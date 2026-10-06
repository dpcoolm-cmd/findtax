-- 보안: 관리자·크론·내부 전용 SECURITY DEFINER 함수를 비로그인(anon)·일반 로그인(authenticated)이
-- PostgREST(/rest/v1/rpc)로 직접 호출할 수 있던 문제를 막는다. (2026-10-06 운영 DB에 적용)
-- 관리자·크론 API 라우트는 서버에서 권한을 확인한 뒤 service_role 키로 호출하므로 영향 없음.
do $$
declare f text;
begin
  foreach f in array array[
    'public.rpc_admin_adjust_points(uuid, bigint, text)',
    'public.rpc_admin_approve_partner(uuid)',
    'public.rpc_admin_reject_partner(uuid, text)',
    'public.rpc_cron_expire_lead_assignments()',
    'public.rpc_internal_match_lead(uuid)',
    'public.rpc_refill_lead_assignments(uuid)',
    'public.rpc_partner_license_available(text, public.partner_professional_type)',
    'public.internal_resolve_partner_id()',
    'public.check_lead_partner_assignment_limit()',
    'public.handle_new_worthit_user()',
    'public.trg_lead_assignment_inc_total_assigned()',
    'public.trg_leads_after_insert_match()'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

-- 파트너 전용 함수: 비로그인 호출만 차단(함수 내부에서 auth.uid()로 파트너 확인).
do $$
declare f text;
begin
  foreach f in array array[
    'public.rpc_partner_unlock_lead(uuid)',
    'public.rpc_partner_list_my_leads()',
    'public.rpc_partner_today_leads_same_sido()',
    'public.rpc_partner_activity_score()'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end $$;
