-- 세무사 노출 티어·사진·리뷰 메타 (기존 컬럼은 IF NOT EXISTS)
alter table public.tax_accountants
  add column if not exists tier text default 'free',
  add column if not exists photo_url text,
  add column if not exists specialties text[],
  add column if not exists bio text,
  add column if not exists review_count integer default 0,
  add column if not exists review_avg numeric default 0;

comment on column public.tax_accountants.tier is 'premium | standard | free';
