-- 세무 기장(bookkeeping) 리드 확장 + 매칭 가중치

alter table public.leads
  add column if not exists category text,
  add column if not exists business_type text,
  add column if not exists monthly_revenue text,
  add column if not exists industry text,
  add column if not exists has_accountant text,
  add column if not exists employee_count int,
  add column if not exists lead_quality text;

update public.leads set category = situation where category is null;

update public.app_settings
set value = coalesce(value, '{}'::jsonb) || '{"bookkeeping": 40000}'::jsonb,
    updated_at = now()
where key = 'lead_pricing';

-- 기존 other 키는 과거 리드 호환용으로 유지; bookkeeping 고가 키 추가

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
              else
                case when l.situation = any (coalesce(p.specialties, '{}')) then 0 else 1 end
            end,
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
        when l.situation = 'bookkeeping' and l.business_type = 'individual' then
          case
            when exists (
              select 1 from public.partners pp
              where pp.id = pid and 'bookkeeping_individual' = any (coalesce(pp.specialties, '{}'))
            ) then 100
            when exists (
              select 1 from public.partners pp
              where pp.id = pid and 'bookkeeping' = any (coalesce(pp.specialties, '{}'))
            ) then 80
            else 50
          end
        when l.situation = 'bookkeeping' and l.business_type in ('corporation', 'planned') then
          case
            when exists (
              select 1 from public.partners pp
              where pp.id = pid and 'bookkeeping_corp' = any (coalesce(pp.specialties, '{}'))
            ) then 100
            when exists (
              select 1 from public.partners pp
              where pp.id = pid and 'bookkeeping' = any (coalesce(pp.specialties, '{}'))
            ) then 80
            else 50
          end
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
      'message', case when r.unlocked_at is not null then r.message else null end,
      'category', r.category,
      'business_type', r.business_type,
      'monthly_revenue', r.monthly_revenue,
      'industry', r.industry,
      'has_accountant', r.has_accountant,
      'employee_count', r.employee_count,
      'lead_quality', r.lead_quality
    );
  end loop;

  return json_build_object('ok', true, 'items', rows);
end;
$$;

revoke all on function public.rpc_partner_list_my_leads() from public;
grant execute on function public.rpc_partner_list_my_leads() to authenticated;
