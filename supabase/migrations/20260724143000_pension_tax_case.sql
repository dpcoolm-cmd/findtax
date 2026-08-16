alter table public.tax_cases
  drop constraint if exists tax_cases_type_check;

alter table public.tax_cases
  add constraint tax_cases_type_check
  check (case_type in ('vat', 'gift', 'solo_business', 'pension'));

create or replace function public.api_create_guided_tax_case_v1(
  p_client_dedupe_key uuid,
  p_case_type text,
  p_source_path text,
  p_input_json jsonb,
  p_result_json jsonb,
  p_complexity_score integer,
  p_recommendation text,
  p_rule_version text,
  p_filing_period_label text,
  p_filing_deadline date,
  p_tasks jsonb,
  p_documents jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_case_id uuid;
  v_access_token uuid;
  v_created boolean := true;
  v_readiness_score integer;
  v_title text;
begin
  if p_case_type not in ('gift', 'solo_business', 'pension') then
    raise exception 'invalid_case_type';
  end if;
  if p_complexity_score not between 0 and 100
    or p_recommendation not in ('self', 'review', 'tax_accountant') then
    raise exception 'invalid_assessment';
  end if;
  if octet_length(coalesce(p_source_path, '')) > 500
    or octet_length(coalesce(p_input_json::text, '')) > 20000
    or octet_length(coalesce(p_result_json::text, '')) > 30000
    or octet_length(coalesce(p_rule_version, '')) > 100
    or octet_length(coalesce(p_filing_period_label, '')) > 160 then
    raise exception 'payload_too_large';
  end if;
  if jsonb_typeof(p_tasks) <> 'array'
    or jsonb_typeof(p_documents) <> 'array'
    or jsonb_array_length(p_tasks) not between 4 and 8
    or jsonb_array_length(p_documents) not between 2 and 8 then
    raise exception 'invalid_definitions';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_tasks) item
    where coalesce(item->>'key', '') !~ '^[a-z0-9_]{1,80}$'
      or octet_length(coalesce(item->>'label', '')) not between 1 and 300
      or octet_length(coalesce(item->>'description', '')) not between 1 and 1000
      or coalesce(item->>'status', '') not in ('ready', 'not_ready', 'unsure')
      or coalesce((item->>'weight')::integer, 0) not between 1 and 100
      or coalesce((item->>'sortOrder')::integer, -1) not between 0 and 20
  ) then
    raise exception 'invalid_task_definition';
  end if;
  if (
    select coalesce(sum((item->>'weight')::integer), 0)
    from jsonb_array_elements(p_tasks) item
  ) <> 100 then
    raise exception 'invalid_task_weights';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_documents) item
    where coalesce(item->>'key', '') !~ '^[a-z0-9_]{1,80}$'
      or octet_length(coalesce(item->>'label', '')) not between 1 and 300
      or octet_length(coalesce(item->>'description', '')) not between 1 and 1000
      or octet_length(coalesce(item->>'reason', '')) not between 1 and 1000
      or coalesce(item->>'status', '') not in ('pending', 'ready')
      or coalesce((item->>'sortOrder')::integer, -1) not between 0 and 20
  ) then
    raise exception 'invalid_document_definition';
  end if;

  select coalesce(sum((item->>'weight')::integer)
    filter (where item->>'status' = 'ready'), 0)::integer
  into v_readiness_score
  from jsonb_array_elements(p_tasks) item;

  v_title := case p_case_type
    when 'gift' then '증여세 신고 준비'
    when 'solo_business' then '1인사업자 세무 관리'
    else '연금·IRP 절세 플랜'
  end;

  insert into public.tax_cases (
    client_dedupe_key, case_type, title, status, readiness_score,
    complexity_score, recommendation, source_path, filing_period_label,
    filing_deadline, case_context
  )
  values (
    p_client_dedupe_key, p_case_type, v_title,
    case when v_readiness_score = 100 then 'ready' else 'preparing' end,
    v_readiness_score, p_complexity_score, p_recommendation,
    nullif(p_source_path, ''), nullif(p_filing_period_label, ''),
    p_filing_deadline, p_result_json
  )
  on conflict (client_dedupe_key) do nothing
  returning id, access_token into v_case_id, v_access_token;

  if v_case_id is null then
    v_created := false;
    select id, access_token into v_case_id, v_access_token
    from public.tax_cases
    where client_dedupe_key = p_client_dedupe_key
      and case_type = p_case_type;
  else
    insert into public.tax_case_assessments (
      case_id, rule_version, input_json, result_json
    )
    values (v_case_id, p_rule_version, p_input_json, p_result_json);

    insert into public.tax_case_tasks (
      case_id, task_key, label, description, status, weight, sort_order
    )
    select
      v_case_id, item->>'key', item->>'label', item->>'description',
      item->>'status', (item->>'weight')::integer,
      (item->>'sortOrder')::integer
    from jsonb_array_elements(p_tasks) item;

    insert into public.tax_case_documents (
      case_id, document_key, label, description, reason, required,
      status, sort_order
    )
    select
      v_case_id, item->>'key', item->>'label', item->>'description',
      coalesce(item->>'reason', ''), coalesce((item->>'required')::boolean, true),
      item->>'status', (item->>'sortOrder')::integer
    from jsonb_array_elements(p_documents) item;
  end if;

  if v_case_id is null then raise exception 'case_create_failed'; end if;
  return jsonb_build_object(
    'token', v_access_token::text,
    'created', v_created,
    'readinessScore', v_readiness_score
  );
end;
$$;

create or replace function public.api_claim_due_tax_case_reminders_v1(
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
      select 1 from private.cron_credentials credential
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
      tax_case.id as case_id, tax_case.case_type, tax_case.user_id,
      auth_user.email::text as user_email, tax_case.access_token,
      tax_case.filing_period_label, tax_case.filing_deadline,
      reminder_day as days_before, tax_case.readiness_score
    from public.tax_cases tax_case
    join auth.users auth_user on auth_user.id = tax_case.user_id
    cross join lateral unnest(tax_case.reminder_days) as reminder_day
    where tax_case.case_type in ('vat', 'gift', 'solo_business', 'pension')
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
      case_id, user_id, filing_deadline, days_before, status, attempted_at
    )
    select
      due.case_id, due.user_id, due.filing_deadline, due.days_before,
      'pending', now()
    from due
    on conflict on constraint tax_case_reminder_deliveries_unique do nothing
    returning
      id, tax_case_reminder_deliveries.case_id,
      tax_case_reminder_deliveries.user_id,
      tax_case_reminder_deliveries.filing_deadline,
      tax_case_reminder_deliveries.days_before
  )
  select
    inserted.id, due.case_id, due.case_type, due.user_id, due.user_email,
    due.access_token, due.filing_period_label, due.filing_deadline,
    due.days_before, due.readiness_score
  from inserted
  join due on due.case_id = inserted.case_id
    and due.filing_deadline = inserted.filing_deadline
    and due.days_before = inserted.days_before;
end;
$$;

create or replace function public.api_admin_insights_snapshot_v1(
  p_since timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
stable
as $$
declare
  v_email text := lower(coalesce(auth.jwt()->>'email', ''));
begin
  if auth.uid() is null
    or not exists (
      select 1 from private.admin_emails admin
      where lower(admin.email) = v_email
    ) then
    raise exception 'admin_required';
  end if;
  if p_since < now() - interval '370 days' or p_since > now() then
    raise exception 'invalid_period';
  end if;

  return jsonb_build_object(
    'trackingRows',
    coalesce((
      select jsonb_agg(to_jsonb(event_row))
      from (
        select event_type, payload, created_at
        from public.tracking_events
        where created_at >= p_since
          and event_type in (
            'page_view', 'phone_click', 'calculator_result_view',
            'calculator_summary_copy', 'calculator_link_copy',
            'calculator_cta_click', 'blog_cta_click',
            'industry_diagnosis_result_view', 'industry_diagnosis_cta_click',
            'lead_submit', 'situation_page_view', 'situation_cta_click'
          )
        order by created_at asc limit 10000
      ) event_row
    ), '[]'::jsonb),
    'operationLeads',
    coalesce((
      select jsonb_agg(to_jsonb(lead_row))
      from (
        select workflow_status, assigned_partner_id, created_at, updated_at
        from public.leads
        where created_at >= p_since
        order by created_at asc limit 10000
      ) lead_row
    ), '[]'::jsonb),
    'taxCases',
    coalesce((
      select jsonb_agg(to_jsonb(case_row))
      from (
        select
          id, case_type, status, readiness_score, complexity_score,
          recommendation, source_path, user_id, filing_method, created_at,
          filing_completed_at, hometax_opened_at, consultation_opened_at
        from public.tax_cases
        where case_type in ('vat', 'gift', 'solo_business', 'pension')
          and created_at >= p_since
        order by created_at asc limit 10000
      ) case_row
    ), '[]'::jsonb),
    'taxCaseDocuments',
    coalesce((
      select jsonb_agg(to_jsonb(document_row))
      from (
        select document.case_id, document.status
        from public.tax_case_documents document
        join public.tax_cases tax_case on tax_case.id = document.case_id
        where tax_case.case_type in ('vat', 'gift', 'solo_business', 'pension')
          and tax_case.created_at >= p_since
        order by document.case_id, document.sort_order limit 20000
      ) document_row
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.api_create_guided_tax_case_v1(
  uuid, text, text, jsonb, jsonb, integer, text, text, text, date, jsonb, jsonb
) from public;
grant execute on function public.api_create_guided_tax_case_v1(
  uuid, text, text, jsonb, jsonb, integer, text, text, text, date, jsonb, jsonb
) to anon, authenticated, service_role;

revoke all on function public.api_claim_due_tax_case_reminders_v1(text, date)
  from public, authenticated;
grant execute on function public.api_claim_due_tax_case_reminders_v1(text, date)
  to anon, service_role;

revoke all on function public.api_admin_insights_snapshot_v1(timestamptz)
  from public, anon, authenticated;
grant execute on function public.api_admin_insights_snapshot_v1(timestamptz)
  to authenticated;
