-- bookkeeping 리드: 상세 등급에 기장 핵심 필드(세무사 여부·사업자 유형) 포함
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
              and coalesce(l.has_accountant, '') <> ''
              and coalesce(l.business_type, '') <> ''
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
