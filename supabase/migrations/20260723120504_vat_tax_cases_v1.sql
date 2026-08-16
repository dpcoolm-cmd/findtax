create table if not exists public.tax_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  access_token uuid not null default gen_random_uuid(),
  client_dedupe_key uuid not null,
  case_type text not null,
  title text not null,
  status text not null default 'preparing',
  readiness_score integer not null default 0,
  complexity_score integer not null default 0,
  recommendation text not null,
  source_path text,
  expires_at timestamptz default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tax_cases_access_token_key unique (access_token),
  constraint tax_cases_client_dedupe_key unique (client_dedupe_key),
  constraint tax_cases_type_check check (case_type in ('vat')),
  constraint tax_cases_status_check check (status in ('preparing', 'ready', 'completed')),
  constraint tax_cases_readiness_score_check check (readiness_score between 0 and 100),
  constraint tax_cases_complexity_score_check check (complexity_score between 0 and 100),
  constraint tax_cases_recommendation_check check (
    recommendation in ('self', 'review', 'tax_accountant')
  )
);

create table if not exists public.tax_case_assessments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.tax_cases(id) on delete cascade,
  snapshot_version integer not null default 1,
  rule_version text not null,
  input_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint tax_case_assessments_case_version_key unique (case_id, snapshot_version)
);

create table if not exists public.tax_case_tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.tax_cases(id) on delete cascade,
  task_key text not null,
  label text not null,
  description text not null,
  status text not null default 'unsure',
  weight integer not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tax_case_tasks_case_key unique (case_id, task_key),
  constraint tax_case_tasks_status_check check (status in ('ready', 'not_ready', 'unsure')),
  constraint tax_case_tasks_weight_check check (weight between 1 and 100)
);

create index if not exists tax_cases_user_created_at_idx
  on public.tax_cases(user_id, created_at desc)
  where user_id is not null;
create index if not exists tax_cases_status_created_at_idx
  on public.tax_cases(status, created_at desc);
create index if not exists tax_case_tasks_case_sort_idx
  on public.tax_case_tasks(case_id, sort_order);

drop trigger if exists tax_cases_set_updated_at on public.tax_cases;
create trigger tax_cases_set_updated_at
before update on public.tax_cases
for each row execute procedure public.set_updated_at();

drop trigger if exists tax_case_tasks_set_updated_at on public.tax_case_tasks;
create trigger tax_case_tasks_set_updated_at
before update on public.tax_case_tasks
for each row execute procedure public.set_updated_at();

alter table public.tax_cases enable row level security;
alter table public.tax_case_assessments enable row level security;
alter table public.tax_case_tasks enable row level security;

revoke all on table public.tax_cases from anon, authenticated;
revoke all on table public.tax_case_assessments from anon, authenticated;
revoke all on table public.tax_case_tasks from anon, authenticated;

grant select, insert, update, delete on table public.tax_cases to service_role;
grant select, insert, update, delete on table public.tax_case_assessments to service_role;
grant select, insert, update, delete on table public.tax_case_tasks to service_role;

comment on column public.tax_cases.access_token is
  'Opaque temporary access token. It is not a substitute for account ownership.';
comment on column public.tax_cases.user_id is
  'Future customer account owner. Anonymous V1 cases leave this null.';
comment on column public.tax_cases.expires_at is
  'Anonymous case expiry. Claimed customer cases may clear or extend this later.';
