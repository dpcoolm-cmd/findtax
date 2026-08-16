-- ============================================================
-- 파트너 입점 신청을 anon 키로 안전하게 받기.
-- partner_applications는 partner_applications_deny(all=false)라 anon 직접 insert 불가 →
-- 기존엔 service_role 키에 의존했는데, 키 미설정 환경에서 신청이 전부 실패한다.
-- SECURITY DEFINER RPC로 anon 키만으로 삽입 가능하게 한다(검증은 API 라우트가 수행).
-- idempotent — 재실행 안전.
-- ============================================================
create or replace function public.rpc_submit_partner_application(
  p_name text,
  p_office_name text,
  p_phone text,
  p_email text,
  p_address text,
  p_specialties text[],
  p_plan text,
  p_bio text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.partner_applications (
    name, office_name, phone, email, address, specialties, plan, bio
  ) values (
    p_name, p_office_name, p_phone, p_email, p_address,
    coalesce(p_specialties, '{}'), p_plan, p_bio
  );
end;
$$;

revoke all on function public.rpc_submit_partner_application(
  text, text, text, text, text, text[], text, text
) from public;
grant execute on function public.rpc_submit_partner_application(
  text, text, text, text, text, text[], text, text
) to anon, authenticated;
