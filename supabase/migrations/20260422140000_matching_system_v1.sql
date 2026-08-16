-- 매칭 v1: 리드당 최대 3명, 시·도 기준, 활동 점수 정렬, 만료(2h), 파트너 통계 컬럼
-- 기존 테이블 `lead_partner_assignments` 확장 (별도 lead_assignments 테이블 없음)

alter table public.partners
  add column if not exists response_rate double precision not null default 1.0
    check (response_rate >= 0 and response_rate <= 1),
  add column if not exists total_assigned int not null default 0 check (total_assigned >= 0),
  add column if not exists total_accepted int not null default 0 check (total_accepted >= 0),
  add column if not exists is_limited boolean not null default false,
  add column if not exists consecutive_expired int not null default 0 check (consecutive_expired >= 0);

alter table public.lead_partner_assignments
  add column if not exists match_status text not null default 'pending',
  add column if not exists expires_at timestamptz;

alter table public.lead_partner_assignments
  drop constraint if exists lead_partner_assignments_match_status_chk;

alter table public.lead_partner_assignments
  add constraint lead_partner_assignments_match_status_chk
  check (match_status in ('pending', 'responded', 'expired', 'rejected'));

update public.lead_partner_assignments lpa
set
  match_status = case when lpa.unlocked_at is not null then 'responded' else 'pending' end,
  expires_at = case
    when lpa.unlocked_at is null then coalesce(lpa.expires_at, lpa.created_at + interval '2 hours')
    else lpa.expires_at
  end
where lpa.expires_at is null or lpa.match_status is distinct from case when lpa.unlocked_at is not null then 'responded' else 'pending' end;

-- ---------------------------------------------------------------------------
-- 리드당 활성 배정 최대 3건 (expired/rejected 제외)
-- ---------------------------------------------------------------------------
create or replace function public.check_lead_partner_assignment_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  c int;
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

-- ---------------------------------------------------------------------------
-- 배정 시 파트너 total_assigned 증가
-- ---------------------------------------------------------------------------
create or replace function public.trg_lead_assignment_inc_total_assigned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.partners
  set
    total_assigned = total_assigned + 1,
    updated_at = now()
  where id = new.partner_id;
  return new;
end;
$$;

drop trigger if exists lead_partner_assignments_after_insert_stats on public.lead_partner_assignments;
create trigger lead_partner_assignments_after_insert_stats
after insert on public.lead_partner_assignments
for each row execute function public.trg_lead_assignment_inc_total_assigned();

-- ---------------------------------------------------------------------------
-- 매칭: 동일 시·도 승인 파트너 중 전문분야·활동점수 상위 3명만 배정
-- ---------------------------------------------------------------------------
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
  if not found then
    return;
  end if;

  insert into public.lead_partner_assignments (
    lead_id,
    partner_id,
    assigned_score,
    match_status,
    expires_at
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
          case
            when 'bookkeeping_individual' = any (coalesce(p.specialties, '{}')) then 100
            when 'bookkeeping' = any (coalesce(p.specialties, '{}')) then 80
            else 50
          end
        when l.situation = 'bookkeeping' and l.business_type in ('corporation', 'planned') then
          case
            when 'bookkeeping_corp' = any (coalesce(p.specialties, '{}')) then 100
            when 'bookkeeping' = any (coalesce(p.specialties, '{}')) then 80
            else 50
          end
        when l.situation = any (coalesce(p.specialties, '{}')) then 100
        else 50
      end as spec_score,
      (
        coalesce(p.response_rate, 1.0) * 100.0
        + case
            when coalesce(p.total_assigned, 0) > 0
            then (p.total_accepted::double precision / p.total_assigned::double precision) * 50.0
            else 0.0
          end
      ) as activity_score,
      row_number() over (
        order by
          case
            when l.situation = 'bookkeeping' and l.business_type = 'individual' then
              case
                when 'bookkeeping_individual' = any (coalesce(p.specialties, '{}')) then 0
                when 'bookkeeping' = any (coalesce(p.specialties, '{}')) then 1
                else 2
              end
            when l.situation = 'bookkeeping' and l.business_type in ('corporation', 'planned') then
              case
                when 'bookkeeping_corp' = any (coalesce(p.specialties, '{}')) then 0
                when 'bookkeeping' = any (coalesce(p.specialties, '{}')) then 1
                else 2
              end
            else case when l.situation = any (coalesce(p.specialties, '{}')) then 0 else 1 end
          end,
          (
            coalesce(p.response_rate, 1.0) * 100.0
            + case
                when coalesce(p.total_assigned, 0) > 0
                then (p.total_accepted::double precision / p.total_assigned::double precision) * 50.0
                else 0.0
              end
          ) desc,
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

-- ---------------------------------------------------------------------------
-- Unlock 시 응답 처리 + 통계
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
  from public.partners
  where id = v_partner
  for update;

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
      return json_build_object(
        'ok', false,
        'error', 'insufficient_balance',
        'required', final_amt,
        'balance', bal
      );
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
      when coalesce(total_assigned, 0) > 0 then least(1.0, greatest(0.0, ta::double precision / total_assigned::double precision))
      else response_rate
    end,
    updated_at = now()
  where id = v_partner;

  update public.lead_partner_assignments
  set
    unlocked_at = now(),
    unlock_points_charged = final_amt,
    match_status = 'responded'
  where partner_id = v_partner and lead_id = p_lead_id;

  insert into public.point_ledger (partner_id, amount, balance_after, entry_type, lead_id, meta)
  values (
    v_partner,
    -final_amt,
    (select points_balance from public.partners where id = v_partner),
    case
      when v_is_founder then 'lead_unlock'::point_ledger_entry_type
      when disc_until is not null and disc_until > now() and final_amt > 0 then 'lead_unlock_discount'::point_ledger_entry_type
      else 'lead_unlock'::point_ledger_entry_type
    end,
    p_lead_id,
    case
      when v_is_founder then
        json_build_object(
          'base_amount', base_amt,
          'charged', final_amt,
          'note', 'Open Beta Founder Unlimited Pass'
        )
      else
        json_build_object('base_amount', base_amt, 'charged', final_amt)
    end
  );

  return json_build_object(
    'ok', true,
    'charged', final_amt,
    'founder_pass', v_is_founder,
    'balance_after', (select points_balance from public.partners where id = v_partner)
  );
end;
$$;

revoke all on function public.rpc_partner_unlock_lead(uuid) from public;
grant execute on function public.rpc_partner_unlock_lead(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 만료 + (가능 시) 슬롯 재배정
-- ---------------------------------------------------------------------------
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
  if not found then
    return 0;
  end if;

  select 3 - count(*) into slots
  from public.lead_partner_assignments x
  where x.lead_id = p_lead_id
    and x.match_status not in ('expired', 'rejected');

  if slots is null or slots <= 0 then
    return 0;
  end if;

  insert into public.lead_partner_assignments (
    lead_id,
    partner_id,
    assigned_score,
    match_status,
    expires_at
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
          case
            when 'bookkeeping_individual' = any (coalesce(p.specialties, '{}')) then 100
            when 'bookkeeping' = any (coalesce(p.specialties, '{}')) then 80
            else 50
          end
        when l.situation = 'bookkeeping' and l.business_type in ('corporation', 'planned') then
          case
            when 'bookkeeping_corp' = any (coalesce(p.specialties, '{}')) then 100
            when 'bookkeeping' = any (coalesce(p.specialties, '{}')) then 80
            else 50
          end
        when l.situation = any (coalesce(p.specialties, '{}')) then 100
        else 50
      end as spec_score,
      row_number() over (
        order by
          (
            coalesce(p.response_rate, 1.0) * 100.0
            + case
                when coalesce(p.total_assigned, 0) > 0
                then (p.total_accepted::double precision / p.total_assigned::double precision) * 50.0
                else 0.0
              end
          ) desc,
          p.created_at asc,
          p.id asc
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

  insert into _expire_batch (lead_id, partner_id)
  select q.lead_id, q.partner_id
  from (
    update public.lead_partner_assignments lpa
    set match_status = 'expired'
    where lpa.match_status = 'pending'
      and lpa.unlocked_at is null
      and coalesce(lpa.expires_at, lpa.created_at + interval '2 hours') <= now()
    returning lpa.lead_id, lpa.partner_id
  ) q;

  select count(*)::int into exp_n from _expire_batch;

  update public.partners p
  set
    consecutive_expired = p.consecutive_expired + s.cnt,
    is_limited = case
      when p.consecutive_expired + s.cnt >= 3 then true
      else coalesce(p.is_limited, false)
    end,
    updated_at = now()
  from (
    select partner_id, count(*)::int as cnt
    from _expire_batch
    group by partner_id
  ) s
  where p.id = s.partner_id;

  for r in select distinct lead_id from _expire_batch loop
    refill_n := refill_n + public.rpc_refill_lead_assignments(r.lead_id);
  end loop;

  return json_build_object('expired_rows', exp_n, 'refill_rows', refill_n);
end;
$$;

revoke all on function public.rpc_cron_expire_lead_assignments() from public;
grant execute on function public.rpc_cron_expire_lead_assignments() to service_role;

-- ---------------------------------------------------------------------------
-- 파트너 대시보드: 오늘(Asia/Seoul) 동일 시도 신규 리드 수
-- ---------------------------------------------------------------------------
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
    and (l.created_at at time zone 'Asia/Seoul')::date
      = (timezone('Asia/Seoul', now()))::date;

  return json_build_object('ok', true, 'sido', v_sido, 'count', n);
end;
$$;

revoke all on function public.rpc_partner_today_leads_same_sido() from public;
grant execute on function public.rpc_partner_today_leads_same_sido() to authenticated;

-- ---------------------------------------------------------------------------
-- 파트너 리드 목록 확장 필드
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
      l.category,
      l.business_type,
      l.monthly_revenue,
      l.industry,
      l.has_accountant,
      l.employee_count,
      l.lead_quality,
      lpa.unlocked_at,
      lpa.created_at as assigned_at,
      lpa.expires_at,
      lpa.match_status,
      case
        when length(coalesce(l.message, '')) >= 50
          and (
            l.situation <> 'bookkeeping'
            or (
              coalesce(l.monthly_revenue, '') <> ''
              and coalesce(l.industry, '') <> ''
            )
          )
        then 'high'
        when length(coalesce(l.message, '')) >= 20 then 'mid'
        else 'low'
      end as detail_tier
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
      'message', case when r.unlocked_at is not null then r.message else null end,
      'category', r.category,
      'business_type', r.business_type,
      'monthly_revenue', r.monthly_revenue,
      'industry', r.industry,
      'has_accountant', r.has_accountant,
      'employee_count', r.employee_count,
      'lead_quality', r.lead_quality,
      'assigned_at', r.assigned_at,
      'expires_at', r.expires_at,
      'match_status', r.match_status,
      'detail_tier', r.detail_tier
    );
  end loop;

  return json_build_object('ok', true, 'items', rows);
end;
$$;

revoke all on function public.rpc_partner_list_my_leads() from public;
grant execute on function public.rpc_partner_list_my_leads() to authenticated;

-- ---------------------------------------------------------------------------
-- 파트너 활동 점수(표시용)
-- ---------------------------------------------------------------------------
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
  from public.partners
  where id = v_partner;

  sc := coalesce(rr, 1.0) * 100.0
    + case when coalesce(tass, 0) > 0 then (ta::double precision / tass::double precision) * 50.0 else 0.0 end;

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

-- ---------------------------------------------------------------------------
-- 대기: 구독 출시 알림
-- ---------------------------------------------------------------------------
create table if not exists public.partner_pricing_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  plan_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists partner_pricing_waitlist_email_idx
  on public.partner_pricing_waitlist (email);

alter table public.partner_pricing_waitlist enable row level security;

drop policy if exists partner_pricing_waitlist_deny on public.partner_pricing_waitlist;
create policy partner_pricing_waitlist_deny on public.partner_pricing_waitlist for all using (false) with check (false);

-- 배정 건수와 통계 트리거 이전 데이터 동기화
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
