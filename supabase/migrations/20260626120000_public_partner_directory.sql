-- ============================================================
-- 공개 디렉터리 ↔ 파트너 브리지
-- 승인된 파트너(partners.status='approved')를 공개 디렉터리에 노출하기 위한 RPC.
-- partners 테이블은 RLS(partners_select_own)로 anon 직접 조회가 막혀 있고,
-- RLS는 컬럼 단위 제어가 안 되므로 SECURITY DEFINER + 화이트리스트 컬럼으로
-- 안전한 공개 필드만 반환한다. (points_balance·user_id·license 등 민감정보 제외)
-- idempotent — 재실행 안전.
-- ============================================================

create or replace function public.rpc_public_list_partners(
  p_sido text,
  p_sigungu text default null
)
returns table (
  id uuid,
  office_name text,
  representative_name text,
  sido text,
  sigungu text,
  specialties text[],
  is_founder boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.office_name, p.representative_name, p.sido, p.sigungu, p.specialties, p.is_founder
  from public.partners p
  where p.status = 'approved'
    and p.sido = p_sido
    and (p_sigungu is null or p.sigungu = p_sigungu)
  order by p.is_founder desc, p.created_at asc;
$$;

revoke all on function public.rpc_public_list_partners(text, text) from public;
grant execute on function public.rpc_public_list_partners(text, text) to anon, authenticated;
