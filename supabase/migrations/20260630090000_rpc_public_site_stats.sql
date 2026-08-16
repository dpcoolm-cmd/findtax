-- ============================================================
-- /register 등 공개 화면용 집계 통계 RPC (개인정보 없음, 숫자만).
-- tracking_events·leads는 anon SELECT가 막혀 있어 집계도 RPC로만 노출한다.
-- idempotent — 재실행 안전.
-- ============================================================
create or replace function public.rpc_public_site_stats()
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'calc_uses_30d', (
      select count(*) from public.tracking_events
      where event_type in ('calculator_result_view','calculator_cta_click','situation_page_view')
        and created_at >= now() - interval '30 days'
    ),
    'leads_total', (select count(*) from public.leads),
    'accountants_total', (select count(*) from public.tax_accountants where is_active = true),
    'partners_approved', (select count(*) from public.partners where status = 'approved')
  );
$$;

revoke all on function public.rpc_public_site_stats() from public;
grant execute on function public.rpc_public_site_stats() to anon, authenticated;
