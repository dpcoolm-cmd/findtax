-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type lead_status as enum ('new', 'contacted', 'closed');

-- tax_accountants
create table public.tax_accountants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  office_name text not null,
  representative_name text,
  sido text not null,
  sigungu text not null,
  address text,
  phone text,
  email text,
  specialties text[] default '{}',
  bio text,
  is_premium boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tax_accountants_sido_sigungu_idx
  on public.tax_accountants (sido, sigungu)
  where is_active = true;

create index tax_accountants_premium_sort_idx
  on public.tax_accountants (is_premium desc, sort_order desc, office_name asc)
  where is_active = true;

-- leads
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  sido text not null,
  sigungu text not null,
  situation text not null,
  message text,
  target_accountant_id uuid references public.tax_accountants (id) on delete set null,
  status lead_status not null default 'new',
  created_at timestamptz not null default now(),
  category text,
  business_type text,
  monthly_revenue text,
  industry text,
  has_accountant text,
  employee_count int,
  lead_quality text
);

create index leads_created_at_idx on public.leads (created_at desc);

-- blog_posts
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content text not null default '',
  seo_title text,
  seo_description text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index blog_posts_published_idx
  on public.blog_posts (published_at desc)
  where is_published = true;

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tax_accountants_set_updated_at
  before update on public.tax_accountants
  for each row execute procedure public.set_updated_at();

create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute procedure public.set_updated_at();

-- RLS
alter table public.tax_accountants enable row level security;
alter table public.leads enable row level security;
alter table public.blog_posts enable row level security;

create policy "tax_accountants_select_active"
  on public.tax_accountants for select
  using (is_active = true);

create policy "leads_insert_anon"
  on public.leads for insert
  with check (true);

create policy "blog_posts_select_published"
  on public.blog_posts for select
  using (is_published = true);

-- tracking_events
create table public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index tracking_events_type_created_idx
  on public.tracking_events (event_type, created_at desc);

alter table public.tracking_events enable row level security;

create policy "tracking_events_insert_anon"
  on public.tracking_events for insert
  with check (true);

-- Seed: 강남구 세무사 6명
insert into public.tax_accountants (
  slug, office_name, representative_name, sido, sigungu, address, phone, email,
  specialties, bio, is_premium, sort_order
) values
(
  'gangnam-premium-han',
  '한빛세무회계',
  '한지민',
  '서울특별시',
  '강남구',
  '서울특별시 강남구 테헤란로 123',
  '02-1234-5001',
  'contact@hanbit-tax.example',
  array['법인세', 'M&A', '국제조세'],
  '강남 소재 법인·스타트업 세무 전문.',
  true,
  100
),
(
  'gangnam-blue-tax',
  '블루세무사무소',
  '이도현',
  '서울특별시',
  '강남구',
  '서울특별시 강남구 역삼로 45',
  '02-1234-5002',
  'hello@blue-tax.example',
  array['종합소득세', '4대보험'],
  '프리랜서·소상공인 신고 중심.',
  true,
  90
),
(
  'gangnam-vertex',
  '버텍스세무컨설팅',
  '박서준',
  '서울특별시',
  '강남구',
  '서울특별시 강남구 논현로 210',
  '02-1234-5003',
  'info@vertex-tax.example',
  array['세무조사', '이의신청'],
  '조사 대응·쟁점 자문.',
  false,
  50
),
(
  'gangnam-clear',
  '클리어택스',
  '최유진',
  '서울특별시',
  '강남구',
  '서울특별시 강남구 학동로 88',
  '02-1234-5004',
  'support@clear-tax.example',
  array['부가가치세', '원천징수'],
  '월간 장부·부가세 신고 지원.',
  false,
  40
),
(
  'gangnam-ace',
  '에이스세무회계',
  '정민호',
  '서울특별시',
  '강남구',
  '서울특별시 강남구 삼성로 300',
  '02-1234-5005',
  'team@ace-tax.example',
  array['스타트업', 'R&D세액공제'],
  '초기 창업 세팅부터 투자 라운드 자문.',
  true,
  95
),
(
  'gangnam-harbor',
  '하버세무',
  '강하늘',
  '서울특별시',
  '강남구',
  '서울특별시 강남구 도산대로 77',
  '02-1234-5006',
  'office@harbor-tax.example',
  array['상속·증여', '양도소득세'],
  '자산 이전·부동산 세무 상담.',
  false,
  30
);

insert into public.blog_posts (
  slug, title, excerpt, content, seo_title, seo_description, is_published, published_at
) values
(
  'gangnam-tax-consult-checklist',
  '강남에서 세무사 상담 전 체크리스트',
  '상담 전 준비하면 시간과 비용을 줄일 수 있습니다.',
  E'# 체크리스트\n\n- 최근 분기 매출·비용 요약\n- 사업자등록증 사본\n- 문의하려는 세목',
  '강남 세무사 상담 체크리스트',
  '강남 지역 세무사 상담 전 준비물과 질문 리스트.',
  true,
  now() - interval '2 days'
);

-- partner_applications (/register 자가등록)
create table if not exists public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  office_name text not null,
  phone text not null,
  email text not null,
  address text not null,
  specialties text[] not null default '{}',
  plan text not null check (plan in ('FREE', 'STANDARD', 'PREMIUM')),
  bio text,
  created_at timestamptz not null default now()
);
alter table public.partner_applications enable row level security;
