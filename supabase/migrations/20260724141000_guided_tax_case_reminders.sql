drop function if exists public.api_claim_due_tax_case_reminders_v1(text, date);

create function public.api_claim_due_tax_case_reminders_v1(
  p_cron_token text,
  p_run_date date
)
returns table (
  delivery_id uuid,
  case_id uuid,
  case_type text,
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
      tax_case.case_type,
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
    where tax_case.case_type in ('vat', 'gift', 'solo_business')
      and tax_case.status <> 'completed'
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
    due.case_type,
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

revoke all on function public.api_claim_due_tax_case_reminders_v1(text, date)
  from public, authenticated;
grant execute on function public.api_claim_due_tax_case_reminders_v1(text, date)
  to anon, service_role;
