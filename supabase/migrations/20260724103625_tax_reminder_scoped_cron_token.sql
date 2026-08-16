create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.cron_credentials (
  credential_name text primary key,
  token_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

revoke all on table private.cron_credentials from public, anon, authenticated;

insert into private.cron_credentials (
  credential_name,
  token_hash,
  active,
  updated_at
)
values (
  'tax_case_reminders',
  '228ff28aa9475cd018fa10512c7bb3af243127154288b41ccf631385c0b29d74',
  true,
  now()
)
on conflict (credential_name) do update
set
  token_hash = excluded.token_hash,
  active = true,
  updated_at = now();

create or replace function public.api_claim_due_tax_case_reminders_v1(
  p_cron_token text,
  p_run_date date
)
returns table (
  delivery_id uuid,
  case_id uuid,
  user_id uuid,
  user_email text,
  access_token uuid,
  filing_period_label text,
  filing_deadline date,
  days_before integer,
  readiness_score integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
begin
  if p_cron_token is null
    or not exists (
      select 1
      from private.cron_credentials credential
      where credential.credential_name = 'tax_case_reminders'
        and credential.active = true
        and credential.token_hash = encode(
          extensions.digest(convert_to(p_cron_token, 'UTF8'), 'sha256'),
          'hex'
        )
    ) then
    raise exception 'invalid_cron_token' using errcode = '42501';
  end if;

  return query
  with due as (
    select
      tax_case.id as case_id,
      tax_case.user_id,
      auth_user.email::text as user_email,
      tax_case.access_token,
      tax_case.filing_period_label,
      tax_case.filing_deadline,
      reminder_day as days_before,
      tax_case.readiness_score
    from public.tax_cases tax_case
    join auth.users auth_user
      on auth_user.id = tax_case.user_id
    cross join lateral unnest(tax_case.reminder_days) as reminder_day
    where tax_case.case_type = 'vat'
      and tax_case.user_id is not null
      and auth_user.email is not null
      and tax_case.reminder_enabled = true
      and tax_case.filing_deadline is not null
      and tax_case.filing_period_label is not null
      and tax_case.filing_deadline - p_run_date = reminder_day
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
    on conflict on constraint tax_case_reminder_deliveries_unique do nothing
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
    due.user_email,
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
end;
$$;

create or replace function public.api_complete_tax_case_reminder_v1(
  p_cron_token text,
  p_delivery_id uuid,
  p_status text,
  p_provider_message_id text default null,
  p_error_code text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rows integer;
begin
  if p_cron_token is null
    or not exists (
      select 1
      from private.cron_credentials credential
      where credential.credential_name = 'tax_case_reminders'
        and credential.active = true
        and credential.token_hash = encode(
          extensions.digest(convert_to(p_cron_token, 'UTF8'), 'sha256'),
          'hex'
        )
    ) then
    raise exception 'invalid_cron_token' using errcode = '42501';
  end if;

  if p_status not in ('sent', 'failed', 'skipped') then
    raise exception 'invalid_delivery_status';
  end if;

  update public.tax_case_reminder_deliveries
  set
    status = p_status,
    provider_message_id = left(p_provider_message_id, 200),
    error_code = left(p_error_code, 200),
    attempted_at = now(),
    sent_at = case when p_status = 'sent' then now() else null end
  where id = p_delivery_id
    and status = 'pending';

  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$$;

revoke all on function public.api_claim_due_tax_case_reminders_v1(text, date)
  from public, authenticated;
revoke all on function public.api_complete_tax_case_reminder_v1(text, uuid, text, text, text)
  from public, authenticated;

grant execute on function public.api_claim_due_tax_case_reminders_v1(text, date)
  to anon, service_role;
grant execute on function public.api_complete_tax_case_reminder_v1(text, uuid, text, text, text)
  to anon, service_role;
