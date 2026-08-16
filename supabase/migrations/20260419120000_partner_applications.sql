-- 세무사 자가등록 / 파트너 플랜 관심 신청 (공개 폼)
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

comment on table public.partner_applications is 'findtax.kr /register 파트너 자가등록 신청';

create index if not exists partner_applications_created_at_idx
  on public.partner_applications (created_at desc);

alter table public.partner_applications enable row level security;
-- anon/authenticated 기본 거부. API는 service_role 클라이언트로 삽입(RLS 우회).
