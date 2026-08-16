-- ============================================================
-- 전체 마이그레이션 통합 적용 (안전, idempotent)
-- leads + tax_accountants 는 이미 존재 → ALTER로만 처리
-- 나머지 테이블은 CREATE TABLE IF NOT EXISTS
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- Enums (중복 시 무시)
-- ============================================================
do $$ begin
  create type lead_status as enum ('new', 'contacted', 'closed');
exception when duplicate_object then null; end $$;

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

-- ============================================================
-- updated_at 공용 함수
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- tax_accountants: 기존 테이블에 누락 컬럼만 추가
-- ============================================================
alter table public.tax_accountants
  add column if not exists representative_name text,
  add column if not exists address text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists specialties text[] default '{}',
  add column if not exists bio text,
  add column if not exists is_premium boolean not null default false,
  add column if not exists is_active boolean not null default true,
  add column if not exists sort_order int not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists tier text default 'free',
  add column if not exists photo_url text,
  add column if not exists review_count integer default 0,
  add column if not exists review_avg numeric default 0;

create index if not exists tax_accountants_sido_sigungu_idx
  on public.tax_accountants (sido, sigungu)
  where is_active = true;

create index if not exists tax_accountants_premium_sort_idx
  on public.tax_accountants (is_premium desc, sort_order desc, office_name asc)
  where is_active = true;

drop trigger if exists tax_accountants_set_updated_at on public.tax_accountants;
create trigger tax_accountants_set_updated_at
  before update on public.tax_accountants
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- leads: 기존 테이블에 누락 컬럼만 추가
-- ============================================================
alter table public.leads
  add column if not exists email text,
  add column if not exists target_accountant_id uuid references public.tax_accountants (id) on delete set null,
  add column if not exists status lead_status not null default 'new',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists category text,
  add column if not exists business_type text,
  add column if not exists monthly_revenue text,
  add column if not exists industry text,
  add column if not exists has_accountant text,
  add column if not exists employee_count int,
  add column if not exists lead_quality text;

create index if not exists leads_created_at_idx on public.leads (created_at desc);

update public.leads set category = situation where category is null;

-- ============================================================
-- blog_posts
-- ============================================================
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content text not null default '',
  seo_title text,
  seo_description text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_published_idx
  on public.blog_posts (published_at desc)
  where is_published = true;

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute procedure public.set_updated_at();

alter table public.blog_posts enable row level security;

drop policy if exists "blog_posts_select_published" on public.blog_posts;
create policy "blog_posts_select_published"
  on public.blog_posts for select
  using (is_published = true);

-- ============================================================
-- tracking_events
-- ============================================================
create table if not exists public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists tracking_events_type_created_idx
  on public.tracking_events (event_type, created_at desc);

alter table public.tracking_events enable row level security;

drop policy if exists "tracking_events_insert_anon" on public.tracking_events;
create policy "tracking_events_insert_anon"
  on public.tracking_events for insert
  with check (true);

-- ============================================================
-- partner_applications
-- ============================================================
create table if not exists public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  office_name text not null,
  phone text not null,
  email text not null,
  address text not null,
  specialties text[] not null default '{}',
  plan text not null check (plan in ('FREE', 'STANDARD', 'PREMIUM')),
  bio text,
  created_at timestamptz not null default now()
);

comment on table public.partner_applications is 'findtax.kr /register 파트너 자가등록 신청';

create index if not exists partner_applications_created_at_idx
  on public.partner_applications (created_at desc);

alter table public.partner_applications enable row level security;

drop policy if exists "partner_applications_deny" on public.partner_applications;
create policy "partner_applications_deny"
  on public.partner_applications for all
  using (false) with check (false);

-- ============================================================
-- app_settings
-- ============================================================
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
    "bookkeeping": 40000,
    "wealth_tax": 30000,
    "property_tax": 30000
  }'::jsonb
) on conflict (key) do update
  set value = excluded.value, updated_at = now();

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_deny" on public.app_settings;
create policy "app_settings_deny"
  on public.app_settings for all
  using (false) with check (false);

-- ============================================================
-- partner_routing_counters
-- ============================================================
create table if not exists public.partner_routing_counters (
  region_key text primary key,
  cursor bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.partner_routing_counters enable row level security;

drop policy if exists "partner_routing_deny" on public.partner_routing_counters;
create policy "partner_routing_deny"
  on public.partner_routing_counters for all
  using (false) with check (false);

-- ============================================================
-- partners
-- ============================================================
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
  response_rate double precision not null default 1.0 check (response_rate >= 0 and response_rate <= 1),
  total_assigned int not null default 0 check (total_assigned >= 0),
  total_accepted int not null default 0 check (total_accepted >= 0),
  is_limited boolean not null default false,
  consecutive_expired int not null default 0 check (consecutive_expired >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partners_points_non_negative check (points_balance >= 0),
  constraint partners_license_unique unique (license_number_normalized, professional_type),
  constraint partners_user_unique unique (user_id)
);

-- 이미 테이블이 있을 경우 누락 컬럼 추가
alter table public.partners
  add column if not exists response_rate double precision not null default 1.0,
  add column if not exists total_assigned int not null default 0,
  add column if not exists total_accepted int not null default 0,
  add column if not exists is_limited boolean not null default false,
  add column if not exists consecutive_expired int not null default 0;

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

drop trigger if exists partners_set_updated_at on public.partners;
create trigger partners_set_updated_at
  before update on public.partners
  for each row execute procedure public.set_updated_at();

alter table public.partners enable row level security;

drop policy if exists "partners_select_own" on public.partners;
create policy "partners_select_own"
  on public.partners for select
  using (auth.uid() = user_id);

drop policy if exists "partners_insert_own_pending" on public.partners;
create policy "partners_insert_own_pending"
  on public.partners for insert
  with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "partners_update_own_pending" on public.partners;
create policy "partners_update_own_pending"
  on public.partners for update
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status = 'pending');

-- ============================================================
-- partner_documents
-- ============================================================
create table if not exists public.partner_documents (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  doc_type partner_doc_type not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists partner_documents_partner_idx
  on public.partner_documents (partner_id);

alter table public.partner_documents enable row level security;

drop policy if exists "partner_docs_all_own" on public.partner_documents;
create policy "partner_docs_all_own"
  on public.partner_documents for all
  using (
    exists (select 1 from public.partners p where p.id = partner_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.partners p where p.id = partner_id and p.user_id = auth.uid())
  );

-- ============================================================
-- point_ledger
-- ============================================================
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

alter table public.point_ledger enable row level security;

drop policy if exists "point_ledger_select_own" on public.point_ledger;
create policy "point_ledger_select_own"
  on public.point_ledger for select
  using (
    exists (select 1 from public.partners p where p.id = partner_id and p.user_id = auth.uid())
  );

-- ============================================================
-- lead_partner_assignments
-- ============================================================
create table if not exists public.lead_partner_assignments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  partner_id uuid not null references public.partners (id) on delete cascade,
  assigned_score int not null default 0,
  unlocked_at timestamptz,
  unlock_points_charged bigint not null default 0,
  match_status text not null default 'pending',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint lead_partner_assignments_unique unique (lead_id, partner_id),
  constraint lead_partner_assignments_match_status_chk
    check (match_status in ('pending', 'responded', 'expired', 'rejected'))
);

alter table public.lead_partner_assignments
  add column if not exists match_status text not null default 'pending',
  add column if not exists expires_at timestamptz;

alter table public.lead_partner_assignments
  drop constraint if exists lead_partner_assignments_match_status_chk;
alter table public.lead_partner_assignments
  add constraint lead_partner_assignments_match_status_chk
  check (match_status in ('pending', 'responded', 'expired', 'rejected'));

create index if not exists lead_partner_assignments_partner_idx
  on public.lead_partner_assignments (partner_id, created_at desc);

alter table public.lead_partner_assignments enable row level security;

drop policy if exists "lead_assign_select_own" on public.lead_partner_assignments;
create policy "lead_assign_select_own"
  on public.lead_partner_assignments for select
  using (
    exists (select 1 from public.partners p where p.id = partner_id and p.user_id = auth.uid())
  );

-- ============================================================
-- partner_point_recharge_requests
-- ============================================================
create table if not exists public.partner_point_recharge_requests (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  requested_amount bigint not null,
  depositor_name text not null,
  partner_memo text,
  tax_invoice_company_name text not null,
  tax_invoice_business_reg_no text not null,
  tax_invoice_email text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint partner_point_recharge_requests_amount_pos check (requested_amount > 0),
  constraint partner_point_recharge_requests_status_chk check (status in ('pending', 'done', 'cancelled'))
);

create index if not exists partner_point_recharge_requests_status_created_idx
  on public.partner_point_recharge_requests (status, created_at desc);

alter table public.partner_point_recharge_requests enable row level security;

drop policy if exists "partner_point_recharge_requests_deny" on public.partner_point_recharge_requests;
create policy "partner_point_recharge_requests_deny"
  on public.partner_point_recharge_requests for all
  using (false) with check (false);

-- ============================================================
-- partner_pricing_waitlist
-- ============================================================
create table if not exists public.partner_pricing_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  plan_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists partner_pricing_waitlist_email_idx
  on public.partner_pricing_waitlist (email);

alter table public.partner_pricing_waitlist enable row level security;

drop policy if exists "partner_pricing_waitlist_deny" on public.partner_pricing_waitlist;
create policy "partner_pricing_waitlist_deny"
  on public.partner_pricing_waitlist for all
  using (false) with check (false);

-- ============================================================
-- 헬퍼 함수들
-- ============================================================
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
  if pricing is null then return 10000; end if;
  v := (pricing ->> p_situation)::bigint;
  if v is null then v := (pricing ->> 'default')::bigint; end if;
  if v is null then return 10000; end if;
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
declare cnt int;
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

-- ============================================================
-- 파운더 통계 (공개)
-- ============================================================
create or replace function public.rpc_public_founder_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare used int;
begin
  select count(*) into used from public.partners where is_founder = true;
  return json_build_object('used', used, 'cap', 20);
end;
$$;
revoke all on function public.rpc_public_founder_stats() from public;
grant execute on function public.rpc_public_founder_stats() to anon, authenticated;

-- ============================================================
-- 배정 제한 트리거 (리드당 최대 3명)
-- ============================================================
create or replace function public.check_lead_partner_assignment_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare c int;
begin
  select count(*) into c
  from public.lead_partner_assignments x
  where x.lead_id = new.lead_id
    and x.match_status not in ('expired', 'rejected');
  if c >= 3 then
    raise exception 'lead_assignment_limit_exceeded';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_lead_partner_assignment_limit on public.lead_partner_assignments;
create trigger enforce_lead_partner_assignment_limit
  before insert on public.lead_partner_assignments
  for each row execute function public.check_lead_partner_assignment_limit();

-- ============================================================
-- 배정 시 total_assigned 증가
-- ============================================================
create or replace function public.trg_lead_assignment_inc_total_assigned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.partners
  set total_assigned = total_assigned + 1, updated_at = now()
  where id = new.partner_id;
  return new;
end;
$$;

drop trigger if exists lead_partner_assignments_after_insert_stats on public.lead_partner_assignments;
create trigger lead_partner_assignments_after_insert_stats
  after insert on public.lead_partner_assignments
  for each row execute function public.trg_lead_assignment_inc_total_assigned();

-- ============================================================
-- 리드 매칭 (시·도 기준, 전문분야·활동점수 상위 3명)
-- ============================================================
create or replace function public.rpc_internal_match_lead(p_lead_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  l record;
begin
  select * into l from public.leads where id = p_lead_id;
  if not found then return; end if;

  insert into public.lead_partner_assignments (
    lead_id, partner_id, assigned_score, match_status, expires_at
  )
  select
    p_lead_id,
    c.id,
    c.spec_score,
    'pending',
    now() + interval '2 hours'
  from (
    select
      p.id,
      case
        when l.situation = 'bookkeeping' and l.business_type = 'individual' then
          case when 'bookkeeping_individual' = any (coalesce(p.specialties,'{}')) then 100
               when 'bookkeeping' = any (coalesce(p.specialties,'{}')) then 80 else 50 end
        when l.situation = 'bookkeeping' and l.business_type in ('corporation','planned') then
          case when 'bookkeeping_corp' = any (coalesce(p.specialties,'{}')) then 100
               when 'bookkeeping' = any (coalesce(p.specialties,'{}')) then 80 else 50 end
        when l.situation = any (coalesce(p.specialties,'{}')) then 100
        else 50
      end as spec_score,
      row_number() over (
        order by
          case
            when l.situation = 'bookkeeping' and l.business_type = 'individual' then
              case when 'bookkeeping_individual' = any (coalesce(p.specialties,'{}')) then 0
                   when 'bookkeeping' = any (coalesce(p.specialties,'{}')) then 1 else 2 end
            when l.situation = 'bookkeeping' and l.business_type in ('corporation','planned') then
              case when 'bookkeeping_corp' = any (coalesce(p.specialties,'{}')) then 0
                   when 'bookkeeping' = any (coalesce(p.specialties,'{}')) then 1 else 2 end
            else case when l.situation = any (coalesce(p.specialties,'{}')) then 0 else 1 end
          end,
          (coalesce(p.response_rate,1.0)*100.0 +
           case when coalesce(p.total_assigned,0)>0
                then (p.total_accepted::double precision/p.total_assigned::double precision)*50.0
                else 0.0 end) desc,
          p.created_at asc,
          p.id asc
      ) as rn
    from public.partners p
    where p.status = 'approved'
      and p.sido = l.sido
      and coalesce(p.is_limited, false) = false
  ) c
  where c.rn <= 3
  on conflict (lead_id, partner_id) do nothing;
end;
$$;
revoke all on function public.rpc_internal_match_lead(uuid) from public;

-- leads 삽입 후 자동 매칭 트리거
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

-- ============================================================
-- 만료 + 재배정
-- ============================================================
create or replace function public.rpc_refill_lead_assignments(p_lead_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  l record;
  slots int;
  n_ins int := 0;
begin
  select * into l from public.leads where id = p_lead_id;
  if not found then return 0; end if;

  select 3 - count(*) into slots
  from public.lead_partner_assignments x
  where x.lead_id = p_lead_id
    and x.match_status not in ('expired', 'rejected');

  if slots is null or slots <= 0 then return 0; end if;

  insert into public.lead_partner_assignments (
    lead_id, partner_id, assigned_score, match_status, expires_at
  )
  select
    p_lead_id, c.id, c.spec_score, 'pending', now() + interval '2 hours'
  from (
    select
      p.id,
      case
        when l.situation = 'bookkeeping' and l.business_type = 'individual' then
          case when 'bookkeeping_individual' = any (coalesce(p.specialties,'{}')) then 100
               when 'bookkeeping' = any (coalesce(p.specialties,'{}')) then 80 else 50 end
        when l.situation = 'bookkeeping' and l.business_type in ('corporation','planned') then
          case when 'bookkeeping_corp' = any (coalesce(p.specialties,'{}')) then 100
               when 'bookkeeping' = any (coalesce(p.specialties,'{}')) then 80 else 50 end
        when l.situation = any (coalesce(p.specialties,'{}')) then 100
        else 50
      end as spec_score,
      row_number() over (
        order by
          (coalesce(p.response_rate,1.0)*100.0 +
           case when coalesce(p.total_assigned,0)>0
                then (p.total_accepted::double precision/p.total_assigned::double precision)*50.0
                else 0.0 end) desc,
          p.created_at asc, p.id asc
      ) as rn
    from public.partners p
    where p.status = 'approved'
      and p.sido = l.sido
      and coalesce(p.is_limited, false) = false
      and not exists (
        select 1 from public.lead_partner_assignments x
        where x.lead_id = p_lead_id and x.partner_id = p.id
      )
  ) c
  where c.rn <= slots
  on conflict (lead_id, partner_id) do nothing;

  get diagnostics n_ins = row_count;
  return n_ins;
end;
$$;
revoke all on function public.rpc_refill_lead_assignments(uuid) from public;
grant execute on function public.rpc_refill_lead_assignments(uuid) to service_role;

-- ============================================================
-- 크론: 배정 만료 처리
-- ============================================================
create or replace function public.rpc_cron_expire_lead_assignments()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  exp_n int := 0;
  refill_n int := 0;
  r record;
begin
  drop table if exists _expire_batch;
  create temp table _expire_batch (lead_id uuid, partner_id uuid) on commit drop;

  with expired as (
    update lead_partner_assignments
    set match_status = 'expired'
    where match_status = 'pending'
      and unlocked_at is null
      and coalesce(expires_at, created_at + interval '2 hours') <= now()
    returning lead_id, partner_id
  )
  insert into _expire_batch (lead_id, partner_id)
  select lead_id, partner_id from expired;

  select count(*)::int into exp_n from _expire_batch;

  update partners p
  set
    consecutive_expired = p.consecutive_expired + s.cnt,
    is_limited = case when p.consecutive_expired + s.cnt >= 3 then true else coalesce(p.is_limited,false) end,
    updated_at = now()
  from (
    select partner_id, count(*)::int as cnt
    from _expire_batch group by partner_id
  ) s
  where p.id = s.partner_id;

  for r in select distinct lead_id from _expire_batch loop
    refill_n := refill_n + rpc_refill_lead_assignments(r.lead_id);
  end loop;

  return json_build_object('expired_rows', exp_n, 'refill_rows', refill_n);
end;
$$;
revoke all on function public.rpc_cron_expire_lead_assignments() from public;
grant execute on function public.rpc_cron_expire_lead_assignments() to service_role;

-- ============================================================
-- 파트너: 오늘 같은 시도 신규 리드 수
-- ============================================================
create or replace function public.rpc_partner_today_leads_same_sido()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partner uuid;
  v_sido text;
  n int;
begin
  v_partner := public.internal_resolve_partner_id();
  if v_partner is null then
    return json_build_object('ok', false, 'error', 'not_partner');
  end if;
  select sido into v_sido from public.partners where id = v_partner;
  if v_sido is null then
    return json_build_object('ok', false, 'error', 'no_sido');
  end if;
  select count(*)::int into n
  from public.leads l
  where l.sido = v_sido
    and (l.created_at at time zone 'Asia/Seoul')::date = (timezone('Asia/Seoul', now()))::date;
  return json_build_object('ok', true, 'sido', v_sido, 'count', n);
end;
$$;
revoke all on function public.rpc_partner_today_leads_same_sido() from public;
grant execute on function public.rpc_partner_today_leads_same_sido() to authenticated;

-- ============================================================
-- 파트너: 활동 점수
-- ============================================================
create or replace function public.rpc_partner_activity_score()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partner uuid;
  rr double precision;
  ta int;
  tass int;
  sc double precision;
begin
  v_partner := public.internal_resolve_partner_id();
  if v_partner is null then
    return json_build_object('ok', false, 'error', 'not_partner');
  end if;
  select response_rate, total_accepted, total_assigned
  into rr, ta, tass
  from public.partners where id = v_partner;
  sc := coalesce(rr,1.0)*100.0
    + case when coalesce(tass,0)>0 then (ta::double precision/tass::double precision)*50.0 else 0.0 end;
  return json_build_object(
    'ok', true,
    'response_rate', rr,
    'total_assigned', tass,
    'total_accepted', ta,
    'is_limited', (select is_limited from public.partners where id = v_partner),
    'activity_score', sc
  );
end;
$$;
revoke all on function public.rpc_partner_activity_score() from public;
grant execute on function public.rpc_partner_activity_score() to authenticated;

-- ============================================================
-- 파트너: 내 리드 목록
-- ============================================================
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
      l.id as lead_id, l.sido, l.sigungu, l.situation, l.created_at,
      l.name, l.phone, l.message, l.category, l.business_type,
      l.monthly_revenue, l.industry, l.has_accountant, l.employee_count, l.lead_quality,
      lpa.unlocked_at, lpa.created_at as assigned_at, lpa.expires_at, lpa.match_status,
      case
        when length(coalesce(l.message,'')) >= 50
          and (
            l.situation <> 'bookkeeping'
            or (
              coalesce(l.monthly_revenue,'') <> ''
              and coalesce(l.industry,'') <> ''
              and coalesce(l.has_accountant,'') <> ''
              and coalesce(l.business_type,'') <> ''
            )
          )
        then 'high'
        when length(coalesce(l.message,'')) >= 20 then 'mid'
        else 'low'
      end as detail_tier
    from public.lead_partner_assignments lpa
    join public.leads l on l.id = lpa.lead_id
    where lpa.partner_id = v_partner
    order by l.created_at desc
    limit 200
  loop
    rows := rows || jsonb_build_object(
      'lead_id', r.lead_id, 'sido', r.sido, 'sigungu', r.sigungu,
      'situation', r.situation, 'created_at', r.created_at,
      'unlocked', r.unlocked_at is not null,
      'name',    case when r.unlocked_at is not null then r.name    else null end,
      'phone',   case when r.unlocked_at is not null then r.phone   else null end,
      'message', case when r.unlocked_at is not null then r.message else null end,
      'category', r.category, 'business_type', r.business_type,
      'monthly_revenue', r.monthly_revenue, 'industry', r.industry,
      'has_accountant', r.has_accountant, 'employee_count', r.employee_count,
      'lead_quality', r.lead_quality, 'assigned_at', r.assigned_at,
      'expires_at', r.expires_at, 'match_status', r.match_status,
      'detail_tier', r.detail_tier
    );
  end loop;

  return json_build_object('ok', true, 'items', rows);
end;
$$;
revoke all on function public.rpc_partner_list_my_leads() from public;
grant execute on function public.rpc_partner_list_my_leads() to authenticated;

-- ============================================================
-- 파트너: 리드 잠금해제 (Unlock)
-- ============================================================
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
  v_is_founder boolean;
  bal bigint;
  l_situation text;
  ta int;
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

  select founder_discount_until, is_founder
  into disc_until, v_is_founder
  from public.partners where id = v_partner for update;

  if v_is_founder then
    final_amt := 0;
  elsif disc_until is not null and disc_until > now() then
    final_amt := ceil(base_amt * 0.8);
  else
    final_amt := base_amt;
  end if;

  if final_amt > 0 then
    select points_balance into bal from public.partners where id = v_partner;
    if bal < final_amt then
      return json_build_object('ok', false, 'error', 'insufficient_balance',
        'required', final_amt, 'balance', bal);
    end if;
  end if;

  update public.partners
  set
    points_balance = points_balance - final_amt,
    total_accepted = total_accepted + 1,
    consecutive_expired = 0,
    updated_at = now()
  where id = v_partner;

  select total_accepted into ta from public.partners where id = v_partner;
  update public.partners
  set
    response_rate = case
      when coalesce(total_assigned,0)>0
      then least(1.0, greatest(0.0, ta::double precision/total_assigned::double precision))
      else response_rate end,
    updated_at = now()
  where id = v_partner;

  update public.lead_partner_assignments
  set unlocked_at = now(), unlock_points_charged = final_amt, match_status = 'responded'
  where partner_id = v_partner and lead_id = p_lead_id;

  insert into public.point_ledger (partner_id, amount, balance_after, entry_type, lead_id, meta)
  values (
    v_partner,
    -final_amt,
    (select points_balance from public.partners where id = v_partner),
    case
      when v_is_founder then 'lead_unlock'::point_ledger_entry_type
      when disc_until is not null and disc_until > now() and final_amt > 0
        then 'lead_unlock_discount'::point_ledger_entry_type
      else 'lead_unlock'::point_ledger_entry_type
    end,
    p_lead_id,
    case when v_is_founder
      then json_build_object('base_amount', base_amt, 'charged', final_amt, 'note', 'Open Beta Founder Unlimited Pass')
      else json_build_object('base_amount', base_amt, 'charged', final_amt)
    end
  );

  return json_build_object(
    'ok', true, 'charged', final_amt,
    'founder_pass', v_is_founder,
    'balance_after', (select points_balance from public.partners where id = v_partner)
  );
end;
$$;
revoke all on function public.rpc_partner_unlock_lead(uuid) from public;
grant execute on function public.rpc_partner_unlock_lead(uuid) to authenticated;

-- ============================================================
-- 관리자: 파트너 승인 (Open Beta Founder)
-- ============================================================
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
  founder_bonus bigint := 9900000;
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
  if founders < 20 then grant_founder := true; end if;

  update public.partners
  set
    status = 'approved',
    approved_at = now(),
    approval_events_processed_at = now(),
    is_founder = case when grant_founder then true else is_founder end,
    founder_discount_until = case
      when grant_founder then coalesce(founder_discount_until, now() + interval '365 days')
      else founder_discount_until end,
    points_balance = points_balance + case when grant_founder then founder_bonus else 0 end,
    updated_at = now()
  where id = p_partner_id;

  if grant_founder then
    insert into public.point_ledger (partner_id, amount, balance_after, entry_type, meta)
    values (
      p_partner_id,
      founder_bonus,
      (select points_balance from public.partners where id = p_partner_id),
      'founder_bonus',
      json_build_object('note', 'Open Beta Founder Unlimited Pass', 'display', 'Open Beta Founder Unlimited Pass')
    );
  end if;

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
        p_partner_id, 0,
        (select points_balance from public.partners where id = p_partner_id),
        'referral_blocked',
        json_build_object('reason', 'mutual_referral_cycle')
      );
    elsif ref_id is not null and ref_row.status = 'approved' then
      update public.partners
      set points_balance = points_balance + referral_amount, updated_at = now()
      where id = ref_id;

      insert into public.point_ledger (partner_id, amount, balance_after, entry_type, meta)
      values (
        ref_id, referral_amount,
        (select points_balance from public.partners where id = ref_id),
        'referral_reward',
        json_build_object('referee_partner_id', p_partner_id)
      );
    end if;
  end if;

  update public.partners set referral_reward_processed_at = now() where id = p_partner_id;

  return json_build_object(
    'ok', true,
    'is_founder', grant_founder,
    'founders_after', (select count(*)::int from public.partners where is_founder = true)
  );
end;
$$;
revoke all on function public.rpc_admin_approve_partner(uuid) from public;
grant execute on function public.rpc_admin_approve_partner(uuid) to service_role;

-- ============================================================
-- 관리자: 파트너 거절
-- ============================================================
create or replace function public.rpc_admin_reject_partner(p_partner_id uuid, p_reason text)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.partners
  set status = 'rejected', rejection_reason = p_reason, updated_at = now()
  where id = p_partner_id and status = 'pending';

  if not found then
    return json_build_object('ok', false, 'error', 'not_pending_or_missing');
  end if;
  return json_build_object('ok', true);
end;
$$;
revoke all on function public.rpc_admin_reject_partner(uuid, text) from public;
grant execute on function public.rpc_admin_reject_partner(uuid, text) to service_role;

-- ============================================================
-- 관리자: 포인트 수동 조정
-- ============================================================
create or replace function public.rpc_admin_adjust_points(
  p_partner_id uuid,
  p_amount bigint,
  p_reason text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  new_bal bigint;
  n int;
begin
  if p_amount is null or p_amount <= 0 then
    return json_build_object('ok', false, 'error', 'amount_must_be_positive');
  end if;
  if coalesce(trim(p_reason), '') = '' then
    return json_build_object('ok', false, 'error', 'reason_required');
  end if;

  update public.partners
  set points_balance = points_balance + p_amount, updated_at = now()
  where id = p_partner_id
  returning points_balance into new_bal;

  get diagnostics n = row_count;
  if n = 0 then
    return json_build_object('ok', false, 'error', 'partner_not_found');
  end if;

  insert into public.point_ledger (partner_id, amount, balance_after, entry_type, meta)
  values (
    p_partner_id, p_amount, new_bal,
    'admin_adjustment',
    json_build_object('reason', p_reason, 'source', 'manual_admin_topup')
  );

  return json_build_object('ok', true, 'balance_after', new_bal);
end;
$$;
revoke all on function public.rpc_admin_adjust_points(uuid, bigint, text) from public;
grant execute on function public.rpc_admin_adjust_points(uuid, bigint, text) to service_role;

-- ============================================================
-- Storage bucket (partner docs)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('partner_docs', 'partner_docs', false)
on conflict (id) do nothing;

drop policy if exists "partner_docs_insert_own" on storage.objects;
create policy "partner_docs_insert_own" on storage.objects
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

drop policy if exists "partner_docs_select_own" on storage.objects;
create policy "partner_docs_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'partner_docs'
    and exists (
      select 1 from public.partners p
      where p.user_id = auth.uid()
        and split_part(name, '/', 2) = p.id::text
    )
  );

-- ============================================================
-- 기존 통계 동기화
-- ============================================================
update public.partners p
set
  total_assigned = coalesce(s.c, 0),
  total_accepted = coalesce(s.u, 0),
  updated_at = now()
from (
  select
    partner_id,
    count(*)::int as c,
    count(*) filter (where unlocked_at is not null)::int as u
  from public.lead_partner_assignments
  group by partner_id
) s
where p.id = s.partner_id;

-- ============================================================
-- 완료 확인용 (실행 후 결과 확인)
-- ============================================================
-- SELECT relname, relrowsecurity
-- FROM pg_class c
-- JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'public' AND c.relkind = 'r'
-- ORDER BY relname;
