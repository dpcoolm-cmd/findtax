-- ============================================================
-- 리드 제출 RLS 수정 (긴급)
-- leads에는 anon SELECT 정책이 없어 서버의 insert().select()가 RLS로 막혀
-- 2026-05-15 RLS 잠금 이후 모든 리드 제출이 실패하고 있었다.
-- 서버 라우트가 검증을 마친 뒤 호출하는 SECURITY DEFINER RPC로
-- 삽입 + 행 반환을 처리한다. (leads 테이블 자체는 계속 anon 비공개)
-- idempotent — 재실행 안전.
-- ============================================================
create or replace function public.rpc_submit_lead(
  p_name text,
  p_phone text,
  p_email text,
  p_sido text,
  p_sigungu text,
  p_situation text,
  p_message text,
  p_target_accountant_id uuid,
  p_category text,
  p_business_type text,
  p_monthly_revenue text,
  p_industry text,
  p_has_accountant text,
  p_employee_count int,
  p_lead_quality text
)
returns setof public.leads
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  insert into public.leads (
    name, phone, email, sido, sigungu, situation, message,
    target_accountant_id, status, category, business_type, monthly_revenue,
    industry, has_accountant, employee_count, lead_quality
  ) values (
    p_name, p_phone, p_email, p_sido, p_sigungu, p_situation, p_message,
    p_target_accountant_id, 'new', p_category, p_business_type, p_monthly_revenue,
    p_industry, p_has_accountant, p_employee_count, p_lead_quality
  )
  returning *;
end;
$$;

revoke all on function public.rpc_submit_lead(
  text, text, text, text, text, text, text, uuid, text, text, text, text, text, int, text
) from public;
grant execute on function public.rpc_submit_lead(
  text, text, text, text, text, text, text, uuid, text, text, text, text, text, int, text
) to anon, authenticated;
