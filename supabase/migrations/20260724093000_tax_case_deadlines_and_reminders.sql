alter table public.tax_cases
  add column if not exists filing_period_label text,
  add column if not exists filing_deadline date,
  add column if not exists reminder_enabled boolean not null default false,
  add column if not exists reminder_days integer[] not null default array[7, 3, 1],
  add column if not exists reminder_updated_at timestamptz;

alter table public.tax_cases
  drop constraint if exists tax_cases_filing_period_label_length_check,
  add constraint tax_cases_filing_period_label_length_check
    check (filing_period_label is null or char_length(filing_period_label) between 1 and 80),
  drop constraint if exists tax_cases_reminder_days_check,
  add constraint tax_cases_reminder_days_check
    check (
      cardinality(reminder_days) between 1 and 3
      and reminder_days <@ array[1, 3, 7]
    );

create table if not exists public.tax_case_reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.tax_cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  filing_deadline date not null,
  days_before integer not null,
  status text not null default 'pending',
  provider_message_id text,
  error_code text,
  attempted_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint tax_case_reminder_deliveries_unique
    unique (case_id, filing_deadline, days_before),
  constraint tax_case_reminder_deliveries_days_check
    check (days_before in (1, 3, 7)),
  constraint tax_case_reminder_deliveries_status_check
    check (status in ('pending', 'sent', 'failed', 'skipped'))
);

create index if not exists tax_cases_due_reminders_idx
  on public.tax_cases(filing_deadline)
  where reminder_enabled = true and user_id is not null;

create index if not exists tax_case_reminder_deliveries_status_idx
  on public.tax_case_reminder_deliveries(status, created_at);

alter table public.tax_case_reminder_deliveries enable row level security;
revoke all on table public.tax_case_reminder_deliveries from anon, authenticated;
grant select, insert, update, delete on table public.tax_case_reminder_deliveries to service_role;

create or replace function public.api_get_vat_tax_case_v1(
  p_access_token uuid
)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select jsonb_build_object(
    'token', c.access_token::text,
    'title', c.title,
    'status', c.status,
    'readinessScore', c.readiness_score,
    'complexityScore', c.complexity_score,
    'recommendation', c.recommendation,
    'filingPeriodLabel', c.filing_period_label,
    'filingDeadline', c.filing_deadline,
    'reminderEnabled', c.reminder_enabled,
    'reminderDays', to_jsonb(c.reminder_days),
    'createdAt', c.created_at,
    'updatedAt', c.updated_at,
    'tasks', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'key', t.task_key,
            'label', t.label,
            'description', t.description,
            'status', t.status,
            'weight', t.weight,
            'sortOrder', t.sort_order
          )
          order by t.sort_order
        )
        from public.tax_case_tasks t
        where t.case_id = c.id
      ),
      '[]'::jsonb
    )
  )
  from public.tax_cases c
  where c.access_token = p_access_token
    and c.case_type = 'vat'
    and (c.expires_at is null or c.expires_at > now());
$$;

create or replace function public.api_update_vat_tax_case_deadline_v1(
  p_access_token uuid,
  p_filing_period_label text,
  p_filing_deadline date,
  p_reminder_enabled boolean,
  p_reminder_days integer[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_days integer[];
  v_rows integer;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;
  if char_length(trim(coalesce(p_filing_period_label, ''))) not between 1 and 80 then
    raise exception 'invalid_period_label';
  end if;
  if p_filing_deadline < current_date - 365
    or p_filing_deadline > current_date + 1095 then
    raise exception 'invalid_filing_deadline';
  end if;
  if p_reminder_days is null
    or cardinality(p_reminder_days) not between 1 and 3
    or not (p_reminder_days <@ array[1, 3, 7]) then
    raise exception 'invalid_reminder_days';
  end if;

  select array_agg(day order by day desc)
    into v_days
  from (
    select distinct unnest(p_reminder_days) as day
  ) normalized;

  update public.tax_cases
  set
    filing_period_label = trim(p_filing_period_label),
    filing_deadline = p_filing_deadline,
    reminder_enabled = p_reminder_enabled,
    reminder_days = v_days,
    reminder_updated_at = now()
  where access_token = p_access_token
    and case_type = 'vat'
    and user_id = v_user_id;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'owned_case_not_found';
  end if;

  return public.api_get_vat_tax_case_v1(p_access_token);
end;
$$;

create or replace function public.api_list_my_vat_tax_cases_v1()
returns jsonb
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select case
    when auth.uid() is null then '[]'::jsonb
    else coalesce(jsonb_agg(items.item order by items.updated_at desc), '[]'::jsonb)
  end
  from (
    select
      c.updated_at,
      jsonb_build_object(
        'token', c.access_token::text,
        'title', c.title,
        'status', c.status,
        'readinessScore', c.readiness_score,
        'complexityScore', c.complexity_score,
        'recommendation', c.recommendation,
        'filingPeriodLabel', c.filing_period_label,
        'filingDeadline', c.filing_deadline,
        'reminderEnabled', c.reminder_enabled,
        'createdAt', c.created_at,
        'updatedAt', c.updated_at,
        'nextTask', (
          select jsonb_build_object(
            'key', t.task_key,
            'label', t.label,
            'description', t.description
          )
          from public.tax_case_tasks t
          where t.case_id = c.id
            and t.status <> 'ready'
          order by t.sort_order
          limit 1
        )
      ) as item
    from public.tax_cases c
    where c.user_id = auth.uid()
      and c.case_type = 'vat'
    order by c.updated_at desc
    limit 50
  ) as items;
$$;

create or replace function public.rpc_claim_due_tax_case_reminders(
  p_run_date date
)
returns table (
  delivery_id uuid,
  case_id uuid,
  user_id uuid,
  access_token uuid,
  filing_period_label text,
  filing_deadline date,
  days_before integer,
  readiness_score integer
)
language sql
security definer
set search_path = public, pg_temp
as $$
  with due as (
    select
      c.id as case_id,
      c.user_id,
      c.access_token,
      c.filing_period_label,
      c.filing_deadline,
      reminder_day as days_before,
      c.readiness_score
    from public.tax_cases c
    cross join lateral unnest(c.reminder_days) as reminder_day
    where c.case_type = 'vat'
      and c.user_id is not null
      and c.reminder_enabled = true
      and c.filing_deadline is not null
      and c.filing_period_label is not null
      and c.filing_deadline - p_run_date = reminder_day
  ),
  inserted as (
    insert into public.tax_case_reminder_deliveries (
      case_id,
      user_id,
      filing_deadline,
      days_before,
      status,
      attempted_at
    )
    select
      due.case_id,
      due.user_id,
      due.filing_deadline,
      due.days_before,
      'pending',
      now()
    from due
    on conflict (case_id, filing_deadline, days_before) do nothing
    returning
      id,
      tax_case_reminder_deliveries.case_id,
      tax_case_reminder_deliveries.user_id,
      tax_case_reminder_deliveries.filing_deadline,
      tax_case_reminder_deliveries.days_before
  )
  select
    inserted.id,
    due.case_id,
    due.user_id,
    due.access_token,
    due.filing_period_label,
    due.filing_deadline,
    due.days_before,
    due.readiness_score
  from inserted
  join due
    on due.case_id = inserted.case_id
    and due.filing_deadline = inserted.filing_deadline
    and due.days_before = inserted.days_before;
$$;

revoke all on function public.api_update_vat_tax_case_deadline_v1(uuid, text, date, boolean, integer[]) from public;
revoke all on function public.api_update_vat_tax_case_deadline_v1(uuid, text, date, boolean, integer[]) from anon;
grant execute on function public.api_update_vat_tax_case_deadline_v1(uuid, text, date, boolean, integer[]) to authenticated;

revoke all on function public.rpc_claim_due_tax_case_reminders(date) from public;
revoke all on function public.rpc_claim_due_tax_case_reminders(date) from anon, authenticated;
grant execute on function public.rpc_claim_due_tax_case_reminders(date) to service_role;

