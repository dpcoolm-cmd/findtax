-- 일별 트래픽 품질 지표.
-- engaged_visitors: page_engaged(10초 이상 + 스크롤·클릭·터치·키 입력) 방문자 — 실제 사람 기준 지표(2026-10-06부터 수집).
-- likely_real_visitors: 과거 데이터용 추정치 — 검색·SNS 유입 또는 같은 날 2페이지 이상 본 방문자.
create or replace view public.traffic_quality_daily
with (security_invoker = true) as
with pv as (
  select (created_at at time zone 'Asia/Seoul')::date as d,
         payload->>'visitorId' as vid,
         coalesce(nullif(payload->>'source', ''), 'direct') as src
  from public.tracking_events
  where event_type = 'page_view'
),
per_visitor as (
  select d, vid, min(src) as src, count(*) as pages
  from pv group by d, vid
),
eng as (
  select (created_at at time zone 'Asia/Seoul')::date as d,
         payload->>'visitorId' as vid,
         coalesce(nullif(payload->>'source', ''), 'direct') as src
  from public.tracking_events
  where event_type = 'page_engaged'
)
select p.d,
       count(distinct p.vid) as all_visitors,
       count(distinct p.vid) filter (where p.src <> 'direct' or p.pages >= 2) as likely_real_visitors,
       (select count(distinct e.vid) from eng e where e.d = p.d) as engaged_visitors,
       (select count(distinct e.vid) from eng e where e.d = p.d and e.src = 'google') as engaged_google,
       (select count(distinct e.vid) from eng e where e.d = p.d and e.src = 'naver') as engaged_naver,
       count(distinct p.vid) filter (where p.src = 'google') as google_visitors,
       count(distinct p.vid) filter (where p.src = 'naver') as naver_visitors
from per_visitor p
group by p.d;

revoke all on public.traffic_quality_daily from anon, authenticated;
