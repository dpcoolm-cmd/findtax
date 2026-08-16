-- Partner onboarding, points, founder club, referrals, lead assignment/unlock
-- Run after base schema (leads, tax_accountants, etc.)

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type partner_professional_type as enum ('tax_advisor', 'cpa');
exception when duplicate_object then null; end $$;

do $$ begin
  create type partner_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type partner_doc_type as enum ('certificate', 'business_license');
exception when duplicate_object then null; end $$;

do $$ begin
  create type point_ledger_entry_type as enum (
    'founder_bonus',
    'referral_reward',
    'referral_blocked',
    'lead_unlock',
    'lead_unlock_discount',
    'admin_adjustment'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- App settings (lead pricing JSON, RR cursor as text key)
-- ---------------------------------------------------------------------------
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value) values (
  'lead_pricing',
  '{
    "default": 10000,
    "income_tax": 10000,
    "transfer_tax": 10000,
    "vat": 10000,
    "gift_tax": 10000,
    "other": 10000,
    "wealth_tax": 30000,
    "property_tax": 30000
  }'::jsonb
) on conflict (key) do nothing;

create table if not exists public.partner_routing_counters (
  region_key text primary key,
  cursor bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Partners
-- ---------------------------------------------------------------------------
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  professional_type partner_professional_type not null,
  license_number_normalized text not null,
  license_display text not null,
  office_name text not null,
  representative_name text,
  sido text not null,
  sigungu text not null,
  specialties text[] not null default '{}',
  status partner_status not null default 'pending',
  points_balance bigint not null default 0,
  is_founder boolean not null default false,
  founder_discount_until timestamptz,
  referrer_partner_id uuid references public.partners (id) on delete set null,
  referral_reward_processed_at timestamptz,
  approval_events_processed_at timestamptz,
  rejection_reason text,
  approved_at timestamptz,
  referral_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partners_points_non_negative check (points_balance >= 0),
  constraint partners_license_unique unique (license_number_normalized, professional_type),
  constraint partners_user_unique unique (user_id)
);

create index if not exists partners_status_sigungu_idx
  on public.partners (status, sido, sigungu)
  where status = 'approved';

create unique index if not exists partners_referral_code_uidx
  on public.partners (referral_code)
  where referral_code is not null;

create or replace function public.set_partner_referral_code()
returns trigger
language plpgsql
as $$
begin
  if new.referral_code is null or new.referral_code = '' then
    new.referral_code := replace(gen_random_uuid()::text, '-', '');
    new.referral_code := left(new.referral_code, 12);
  end if;
  return new;
end;
$$;

drop trigger if exists partners_set_referral_code on public.partners;
create trigger partners_set_referral_code
  before insert on public.partners
  for each row execute procedure public.set_partner_referral_code();

create trigger partners_set_updated_at
  before update on public.partners
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Partner documents (storage paths under bucket partner_docs)
-- ---------------------------------------------------------------------------
create table if not exists public.partner_documents (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  doc_type partner_doc_type not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists partner_documents_partner_idx
  on public.partner_documents (partner_id);

-- ---------------------------------------------------------------------------
-- Point ledger (immutable history)
-- ---------------------------------------------------------------------------
create table if not exists public.point_ledger (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  amount bigint not null,
  balance_after bigint not null,
  entry_type point_ledger_entry_type not null,
  lead_id uuid references public.leads (id) on delete set null,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists point_ledger_partner_created_idx
  on public.point_ledger (partner_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Lead ↔ partner assignment + unlock
-- ---------------------------------------------------------------------------
create table if not exists public.lead_partner_assignments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  partner_id uuid not null references public.partners (id) on delete cascade,
  assigned_score int not null default 0,
  unlocked_at timestamptz,
  unlock_points_charged bigint not null default 0,
  created_at timestamptz not null default now(),
  constraint lead_partner_assignments_unique unique (lead_id, partner_id)
);

create index if not exists lead_partner_assignments_partner_idx
  on public.lead_partner_assignments (partner_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers: pricing & partner resolution
-- ---------------------------------------------------------------------------
create or replace function public.internal_get_unlock_base_amount(p_situation text)
returns bigint
language plpgsql
stable
as $$
declare
  pricing jsonb;
  v bigint;
begin
  select value into pricing from public.app_settings where key = 'lead_pricing';
  if pricing is null then
    return 10000;
  end if;
  v := (pricing ->> p_situation)::bigint;
  if v is null then
    v := (pricing ->> 'default')::bigint;
  end if;
  if v is null then
    return 10000;
  end if;
  return v;
end;
$$;

create or replace function public.internal_resolve_partner_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.partners where user_id = auth.uid() limit 1;
$$;

create or replace function public.rpc_partner_license_available(
  p_license_normalized text,
  p_professional partner_professional_type
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cnt int;
begin
  select count(*) into cnt
  from public.partners
  where license_number_normalized = p_license_normalized
    and professional_type = p_professional;
  return cnt = 0;
end;
$$;

revoke all on function public.rpc_partner_license_available(text, partner_professional_type) from public;
grant execute on function public.rpc_partner_license_available(text, partner_professional_type) to service_role;

-- ---------------------------------------------------------------------------
-- Match new leads to approved partners (region > specialty > round-robin)
-- ---------------------------------------------------------------------------
create or replace function public.rpc_internal_match_lead(p_lead_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  l record;
  rk text;
  cur bigint;
  pid uuid;
begin
  select * into l from public.leads where id = p_lead_id;
  if not found then
    return;
  end if;

  rk := l.sido || '|' || l.sigungu;

  select coalesce(cursor, 0) into cur
  from public.partner_routing_counters
  where region_key = rk
  for update;

  if not found then
    insert into public.partner_routing_counters (region_key, cursor)
    values (rk, 0);
    cur := 0;
  end if;

  for pid in
    with ordered as (
      select
        p.id,
        row_number() over (
          order by
            case when l.situation = any (coalesce(p.specialties, '{}')) then 0 else 1 end,
            p.created_at,
            p.id
        ) as rn,
        count(*) over () as c
      from public.partners p
      where p.status = 'approved'
        and p.sido = l.sido
        and p.sigungu = l.sigungu
    ),
    shifted as (
      select
        id,
        case
          when c = 0 then 0
          else ((rn + (cur % c) - 1) % c) + 1
        end as sort_ord
      from ordered
    )
    select id from shifted where sort_ord > 0 order by sort_ord, id
  loop
    insert into public.lead_partner_assignments (lead_id, partner_id, assigned_score)
    values (
      p_lead_id,
      pid,
      case
        when exists (
          select 1 from public.partners pp
          where pp.id = pid and l.situation = any (coalesce(pp.specialties, '{}'))
        ) then 100
        else 50
      end
    )
    on conflict (lead_id, partner_id) do nothing;
  end loop;

  update public.partner_routing_counters
  set cursor = cur + 1, updated_at = now()
  where region_key = rk;
end;
$$;

revoke all on function public.rpc_internal_match_lead(uuid) from public;

create or replace function public.trg_leads_after_insert_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.rpc_internal_match_lead(new.id);
  return new;
end;
$$;

drop trigger if exists leads_after_insert_match on public.leads;
create trigger leads_after_insert_match
  after insert on public.leads
  for each row execute procedure public.trg_leads_after_insert_match();

-- ---------------------------------------------------------------------------
-- Founder stats (public read via RPC)
-- ---------------------------------------------------------------------------
create or replace function public.rpc_public_founder_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  used int;
begin
  select count(*) into used from public.partners where is_founder = true;
  return json_build_object('used', used, 'cap', 20);
end;
$$;

revoke all on function public.rpc_public_founder_stats() from public;
grant execute on function public.rpc_public_founder_stats() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Approve / reject (service_role only EXECUTE)
-- ---------------------------------------------------------------------------
create or replace function public.rpc_admin_approve_partner(p_partner_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  pr public.partners%rowtype;
  founders int;
  grant_founder boolean := false;
  base_bonus bigint := 50000;
  ref_id uuid;
  ref_row public.partners%rowtype;
  cycle_blocked boolean := false;
  referral_amount bigint := 30000;
begin
  perform pg_advisory_xact_lock(184021);

  select * into pr from public.partners where id = p_partner_id for update;
  if not found then
    return json_build_object('ok', false, 'error', 'partner_not_found');
  end if;
  if pr.status <> 'pending' then
    return json_build_object('ok', false, 'error', 'not_pending');
  end if;
  if pr.approval_events_processed_at is not null then
    return json_build_object('ok', false, 'error', 'already_processed');
  end if;

  select count(*) into founders from public.partners where is_founder = true;

  if founders < 20 then
    grant_founder := true;
  end if;

  update public.partners
  set
    status = 'approved',
    approved_at = now(),
    approval_events_processed_at = now(),
    is_founder = case when grant_founder then true else is_founder end,
    founder_discount_until = case
      when grant_founder then coalesce(founder_discount_until, now() + interval '365 days')
      else founder_discount_until
    end,
    points_balance = points_balance + case when grant_founder then base_bonus else 0 end,
    updated_at = now()
  where id = p_partner_id;

  if grant_founder then
    insert into public.point_ledger (partner_id, amount, balance_after, entry_type, meta)
    values (
      p_partner_id,
      base_bonus,
      (select points_balance from public.partners where id = p_partner_id),
      'founder_bonus',
      json_build_object('note', 'Founding Partner 선착순 보너스')
    );
  end if;

  -- Referral (one-time on first approve), block self + A<->B
  ref_id := pr.referrer_partner_id;
  if ref_id is not null and ref_id <> p_partner_id then
    select * into ref_row from public.partners where id = ref_id for update;
    if not found then
      ref_id := null;
    elsif ref_row.referrer_partner_id = p_partner_id then
      cycle_blocked := true;
    end if;

    if cycle_blocked then
      insert into public.point_ledger (partner_id, amount, balance_after, entry_type, meta)
      values (
        p_partner_id,
        0,
        (select points_balance from public.partners where id = p_partner_id),
        'referral_blocked',
        json_build_object('reason', 'mutual_referral_cycle')
      );
    elsif ref_id is not null and ref_row.status = 'approved' then
      update public.partners
      set
        points_balance = points_balance + referral_amount,
        updated_at = now()
      where id = ref_id;

      insert into public.point_ledger (partner_id, amount, balance_after, entry_type, meta)
      values (
        ref_id,
        referral_amount,
        (select points_balance from public.partners where id = ref_id),
        'referral_reward',
        json_build_object('referee_partner_id', p_partner_id)
      );
    end if;
  end if;

  update public.partners
  set referral_reward_processed_at = now()
  where id = p_partner_id;

  return json_build_object(
    'ok', true,
    'is_founder', grant_founder,
    'founders_after', (select count(*)::int from public.partners where is_founder = true)
  );
end;
$$;

revoke all on function public.rpc_admin_approve_partner(uuid) from public;
grant execute on function public.rpc_admin_approve_partner(uuid) to service_role;

create or replace function public.rpc_admin_reject_partner(p_partner_id uuid, p_reason text)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.partners
  set
    status = 'rejected',
    rejection_reason = p_reason,
    updated_at = now()
  where id = p_partner_id and status = 'pending';

  if not found then
    return json_build_object('ok', false, 'error', 'not_pending_or_missing');
  end if;

  return json_build_object('ok', true);
end;
$$;

revoke all on function public.rpc_admin_reject_partner(uuid, text) from public;
grant execute on function public.rpc_admin_reject_partner(uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- Partner unlock lead (atomic debit + ledger + assignment unlock)
-- ---------------------------------------------------------------------------
create or replace function public.rpc_partner_unlock_lead(p_lead_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partner uuid;
  base_amt bigint;
  final_amt bigint;
  disc_until timestamptz;
  bal bigint;
  l_situation text;
begin
  v_partner := public.internal_resolve_partner_id();
  if v_partner is null then
    return json_build_object('ok', false, 'error', 'not_partner');
  end if;

  if not exists (
    select 1 from public.lead_partner_assignments
    where partner_id = v_partner and lead_id = p_lead_id
  ) then
    return json_build_object('ok', false, 'error', 'not_assigned');
  end if;

  if exists (
    select 1 from public.lead_partner_assignments
    where partner_id = v_partner and lead_id = p_lead_id and unlocked_at is not null
  ) then
    return json_build_object('ok', true, 'already_unlocked', true);
  end if;

  select situation into l_situation from public.leads where id = p_lead_id;
  base_amt := public.internal_get_unlock_base_amount(l_situation);

  select founder_discount_until into disc_until from public.partners where id = v_partner for update;
  if disc_until is not null and disc_until > now() then
    final_amt := ceil(base_amt * 0.8);
  else
    final_amt := base_amt;
  end if;

  select points_balance into bal from public.partners where id = v_partner;
  if bal < final_amt then
    return json_build_object(
      'ok', false,
      'error', 'insufficient_balance',
      'required', final_amt,
      'balance', bal
    );
  end if;

  update public.partners
  set
    points_balance = points_balance - final_amt,
    updated_at = now()
  where id = v_partner;

  update public.lead_partner_assignments
  set
    unlocked_at = now(),
    unlock_points_charged = final_amt
  where partner_id = v_partner and lead_id = p_lead_id;

  insert into public.point_ledger (partner_id, amount, balance_after, entry_type, lead_id, meta)
  values (
    v_partner,
    -final_amt,
    (select points_balance from public.partners where id = v_partner),
    case
      when disc_until is not null and disc_until > now() then 'lead_unlock_discount'::point_ledger_entry_type
      else 'lead_unlock'::point_ledger_entry_type
    end,
    p_lead_id,
    json_build_object('base_amount', base_amt, 'charged', final_amt)
  );

  return json_build_object(
    'ok', true,
    'charged', final_amt,
    'balance_after', (select points_balance from public.partners where id = v_partner)
  );
end;
$$;

revoke all on function public.rpc_partner_unlock_lead(uuid) from public;
grant execute on function public.rpc_partner_unlock_lead(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Partner: list assigned leads (masked until unlock)
-- ---------------------------------------------------------------------------
create or replace function public.rpc_partner_list_my_leads()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partner uuid;
  rows jsonb := '[]'::jsonb;
  r record;
begin
  v_partner := public.internal_resolve_partner_id();
  if v_partner is null then
    return json_build_object('ok', false, 'error', 'not_partner');
  end if;

  for r in
    select
      l.id as lead_id,
      l.sido,
      l.sigungu,
      l.situation,
      l.created_at,
      l.name,
      l.phone,
      l.message,
      lpa.unlocked_at
    from public.lead_partner_assignments lpa
    join public.leads l on l.id = lpa.lead_id
    where lpa.partner_id = v_partner
    order by l.created_at desc
    limit 200
  loop
    rows := rows || jsonb_build_object(
      'lead_id', r.lead_id,
      'sido', r.sido,
      'sigungu', r.sigungu,
      'situation', r.situation,
      'created_at', r.created_at,
      'unlocked', r.unlocked_at is not null,
      'name', case when r.unlocked_at is not null then r.name else null end,
      'phone', case when r.unlocked_at is not null then r.phone else null end,
      'message', case when r.unlocked_at is not null then r.message else null end
    );
  end loop;

  return json_build_object('ok', true, 'items', rows);
end;
$$;

revoke all on function public.rpc_partner_list_my_leads() from public;
grant execute on function public.rpc_partner_list_my_leads() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.app_settings enable row level security;
alter table public.partner_routing_counters enable row level security;
alter table public.partners enable row level security;
alter table public.partner_documents enable row level security;
alter table public.point_ledger enable row level security;
alter table public.lead_partner_assignments enable row level security;

-- app_settings: no direct client access (use RPC / service)
drop policy if exists app_settings_deny on public.app_settings;
create policy app_settings_deny on public.app_settings for all using (false) with check (false);

drop policy if exists partner_routing_deny on public.partner_routing_counters;
create policy partner_routing_deny on public.partner_routing_counters for all using (false) with check (false);

drop policy if exists partners_select_own on public.partners;
create policy partners_select_own on public.partners
  for select using (auth.uid() = user_id);

drop policy if exists partners_insert_own_pending on public.partners;
create policy partners_insert_own_pending on public.partners
  for insert with check (
    auth.uid() = user_id and status = 'pending'
  );

drop policy if exists partners_update_own_pending on public.partners;
create policy partners_update_own_pending on public.partners
  for update using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status = 'pending');

drop policy if exists partner_docs_all_own on public.partner_documents;
create policy partner_docs_all_own on public.partner_documents
  for all using (
    exists (select 1 from public.partners p where p.id = partner_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.partners p where p.id = partner_id and p.user_id = auth.uid())
  );

drop policy if exists point_ledger_select_own on public.point_ledger;
create policy point_ledger_select_own on public.point_ledger
  for select using (
    exists (select 1 from public.partners p where p.id = partner_id and p.user_id = auth.uid())
  );

drop policy if exists lead_assign_select_own on public.lead_partner_assignments;
create policy lead_assign_select_own on public.lead_partner_assignments
  for select using (
    exists (select 1 from public.partners p where p.id = partner_id and p.user_id = auth.uid())
  );

-- Service role bypasses RLS by default in Supabase

-- ---------------------------------------------------------------------------
-- Storage bucket (private) + policies for partner uploads
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('partner_docs', 'partner_docs', false)
on conflict (id) do nothing;

drop policy if exists partner_docs_insert_own on storage.objects;
create policy partner_docs_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'partner_docs'
    and split_part(name, '/', 1) in ('certificates', 'business_licenses')
    and exists (
      select 1 from public.partners p
      where p.user_id = auth.uid()
        and split_part(name, '/', 2) = p.id::text
    )
  );

drop policy if exists partner_docs_select_own on storage.objects;
create policy partner_docs_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'partner_docs'
    and exists (
      select 1 from public.partners p
      where p.user_id = auth.uid()
        and split_part(name, '/', 2) = p.id::text
    )
  );
