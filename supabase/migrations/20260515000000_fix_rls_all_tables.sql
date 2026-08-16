-- ============================================================
-- 보안 긴급 조치: 모든 public 테이블 RLS 강제 활성화
-- idempotent — 이미 enabled된 테이블에 재실행해도 안전
-- Supabase 대시보드 SQL Editor에서 직접 실행 가능
-- ============================================================

-- 1. 기본 테이블
alter table public.tax_accountants       enable row level security;
alter table public.leads                 enable row level security;
alter table public.blog_posts            enable row level security;
alter table public.tracking_events       enable row level security;

-- 2. 파트너 시스템
alter table public.partners                        enable row level security;
alter table public.partner_documents               enable row level security;
alter table public.partner_applications            enable row level security;
alter table public.partner_point_recharge_requests enable row level security;
alter table public.partner_pricing_waitlist        enable row level security;

-- 3. 포인트·배정
alter table public.point_ledger              enable row level security;
alter table public.lead_partner_assignments  enable row level security;

-- 4. 내부 설정
alter table public.app_settings              enable row level security;
alter table public.partner_routing_counters  enable row level security;

-- ============================================================
-- 정책 재확인 (drop-and-recreate, 중복 방지)
-- ============================================================

-- tax_accountants: 활성 레코드만 공개 읽기
drop policy if exists "tax_accountants_select_active" on public.tax_accountants;
create policy "tax_accountants_select_active"
  on public.tax_accountants for select
  using (is_active = true);

-- leads: 익명 삽입만 허용 (조회·수정·삭제 차단)
drop policy if exists "leads_insert_anon" on public.leads;
create policy "leads_insert_anon"
  on public.leads for insert
  with check (true);

-- blog_posts: 게시된 글만 공개 읽기
drop policy if exists "blog_posts_select_published" on public.blog_posts;
create policy "blog_posts_select_published"
  on public.blog_posts for select
  using (is_published = true);

-- tracking_events: 익명 삽입만 허용
drop policy if exists "tracking_events_insert_anon" on public.tracking_events;
create policy "tracking_events_insert_anon"
  on public.tracking_events for insert
  with check (true);

-- partner_applications: 공개 삽입 차단 (service_role만 삽입)
drop policy if exists "partner_applications_deny" on public.partner_applications;
create policy "partner_applications_deny"
  on public.partner_applications for all
  using (false) with check (false);

-- app_settings: 직접 접근 차단
drop policy if exists "app_settings_deny" on public.app_settings;
create policy "app_settings_deny"
  on public.app_settings for all
  using (false) with check (false);

-- partner_routing_counters: 직접 접근 차단
drop policy if exists "partner_routing_deny" on public.partner_routing_counters;
create policy "partner_routing_deny"
  on public.partner_routing_counters for all
  using (false) with check (false);

-- partner_point_recharge_requests: 직접 접근 차단
drop policy if exists "partner_point_recharge_requests_deny" on public.partner_point_recharge_requests;
create policy "partner_point_recharge_requests_deny"
  on public.partner_point_recharge_requests for all
  using (false) with check (false);

-- partner_pricing_waitlist: 직접 접근 차단
drop policy if exists "partner_pricing_waitlist_deny" on public.partner_pricing_waitlist;
create policy "partner_pricing_waitlist_deny"
  on public.partner_pricing_waitlist for all
  using (false) with check (false);

-- partners: 본인 레코드만
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

-- partner_documents: 본인 파트너 소유 문서만
drop policy if exists "partner_docs_all_own" on public.partner_documents;
create policy "partner_docs_all_own"
  on public.partner_documents for all
  using (
    exists (select 1 from public.partners p where p.id = partner_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.partners p where p.id = partner_id and p.user_id = auth.uid())
  );

-- point_ledger: 본인 포인트 내역만 조회
drop policy if exists "point_ledger_select_own" on public.point_ledger;
create policy "point_ledger_select_own"
  on public.point_ledger for select
  using (
    exists (select 1 from public.partners p where p.id = partner_id and p.user_id = auth.uid())
  );

-- lead_partner_assignments: 본인 배정 건만 조회
drop policy if exists "lead_assign_select_own" on public.lead_partner_assignments;
create policy "lead_assign_select_own"
  on public.lead_partner_assignments for select
  using (
    exists (select 1 from public.partners p where p.id = partner_id and p.user_id = auth.uid())
  );

-- ============================================================
-- 검증 쿼리 (실행 후 결과 확인용)
-- relrowsecurity = true 인 행만 보여야 정상
-- ============================================================
-- SELECT relname, relrowsecurity
-- FROM pg_class c
-- JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'public'
--   AND c.relkind = 'r'
-- ORDER BY relname;
