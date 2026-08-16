alter table public.tax_cases
  drop constraint if exists tax_cases_type_check;

alter table public.tax_cases
  add constraint tax_cases_type_check
  check (case_type in ('vat', 'gift', 'solo_business'));

alter table public.tax_cases
  add column if not exists case_context jsonb not null default '{}'::jsonb;

alter table public.tax_cases
  drop constraint if exists tax_cases_case_context_size_check;

alter table public.tax_cases
  add constraint tax_cases_case_context_size_check
  check (octet_length(case_context::text) <= 30000);

create or replace function public.api_get_tax_case_v2(
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
    'caseType', c.case_type,
    'title', c.title,
    'status', c.status,
    'readinessScore', c.readiness_score,
    'complexityScore', c.complexity_score,
    'recommendation', c.recommendation,
    'filingPeriodLabel', c.filing_period_label,
    'filingDeadline', c.filing_deadline,
    'reminderEnabled', c.reminder_enabled,
    'reminderDays', to_jsonb(c.reminder_days),
    'filingMethod', c.filing_method,
    'filingCompletedAt', c.filing_completed_at,
    'context', c.case_context,
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
    ),
    'documents', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'key', d.document_key,
            'label', d.label,
            'description', d.description,
            'reason', d.reason,
            'required', d.required,
            'status', d.status,
            'sortOrder', d.sort_order
          )
          order by d.sort_order
        )
        from public.tax_case_documents d
        where d.case_id = c.id
      ),
      '[]'::jsonb
    )
  )
  from public.tax_cases c
  where c.access_token = p_access_token
    and (c.expires_at is null or c.expires_at > now());
$$;

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
  v_task_count integer;
  v_document_count integer;
begin
  if p_case_type not in ('gift', 'solo_business') then
    raise exception 'invalid_case_type';
  end if;
  if p_complexity_score not between 0 and 100 then
    raise exception 'invalid_complexity_score';
  end if;
  if p_recommendation not in ('self', 'review', 'tax_accountant') then
    raise exception 'invalid_recommendation';
  end if;
  if octet_length(coalesce(p_source_path, '')) > 500
    or octet_length(coalesce(p_input_json::text, '')) > 20000
    or octet_length(coalesce(p_result_json::text, '')) > 30000
    or octet_length(coalesce(p_rule_version, '')) > 100
    or octet_length(coalesce(p_filing_period_label, '')) > 160 then
    raise exception 'payload_too_large';
  end if;
  if jsonb_typeof(p_tasks) <> 'array'
    or jsonb_typeof(p_documents) <> 'array' then
    raise exception 'invalid_definitions';
  end if;

  v_task_count := jsonb_array_length(p_tasks);
  v_document_count := jsonb_array_length(p_documents);
  if v_task_count < 4 or v_task_count > 8
    or v_document_count < 2 or v_document_count > 8 then
    raise exception 'invalid_definition_count';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_tasks) item
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
    select 1
    from jsonb_array_elements(p_documents) item
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
    else '1인사업자 세무 관리'
  end;

  insert into public.tax_cases (
    client_dedupe_key,
    case_type,
    title,
    status,
    readiness_score,
    complexity_score,
    recommendation,
    source_path,
    filing_period_label,
    filing_deadline,
    case_context
  )
  values (
    p_client_dedupe_key,
    p_case_type,
    v_title,
    case when v_readiness_score = 100 then 'ready' else 'preparing' end,
    v_readiness_score,
    p_complexity_score,
    p_recommendation,
    nullif(p_source_path, ''),
    nullif(p_filing_period_label, ''),
    p_filing_deadline,
    p_result_json
  )
  on conflict (client_dedupe_key) do nothing
  returning id, access_token into v_case_id, v_access_token;

  if v_case_id is null then
    v_created := false;
    select id, access_token
    into v_case_id, v_access_token
    from public.tax_cases
    where client_dedupe_key = p_client_dedupe_key
      and case_type = p_case_type;
  else
    insert into public.tax_case_assessments (
      case_id,
      rule_version,
      input_json,
      result_json
    )
    values (
      v_case_id,
      p_rule_version,
      p_input_json,
      p_result_json
    );

    insert into public.tax_case_tasks (
      case_id,
      task_key,
      label,
      description,
      status,
      weight,
      sort_order
    )
    select
      v_case_id,
      item->>'key',
      item->>'label',
      item->>'description',
      item->>'status',
      (item->>'weight')::integer,
      (item->>'sortOrder')::integer
    from jsonb_array_elements(p_tasks) item;

    insert into public.tax_case_documents (
      case_id,
      document_key,
      label,
      description,
      reason,
      required,
      status,
      sort_order
    )
    select
      v_case_id,
      item->>'key',
      item->>'label',
      item->>'description',
      coalesce(item->>'reason', ''),
      coalesce((item->>'required')::boolean, true),
      item->>'status',
      (item->>'sortOrder')::integer
    from jsonb_array_elements(p_documents) item;
  end if;

  if v_case_id is null then
    raise exception 'case_create_failed';
  end if;

  return jsonb_build_object(
    'token', v_access_token::text,
    'created', v_created,
    'readinessScore', v_readiness_score
  );
end;
$$;

create or replace function public.api_update_tax_case_task_v2(
  p_access_token uuid,
  p_task_key text,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_case_id uuid;
  v_readiness_score integer;
begin
  if p_task_key !~ '^[a-z0-9_]{1,80}$'
    or p_status not in ('ready', 'not_ready', 'unsure') then
    raise exception 'invalid_task_update';
  end if;

  select id into v_case_id
  from public.tax_cases
  where access_token = p_access_token
    and (expires_at is null or expires_at > now());
  if v_case_id is null then raise exception 'case_not_found'; end if;

  update public.tax_case_tasks
  set status = p_status
  where case_id = v_case_id and task_key = p_task_key;
  if not found then raise exception 'task_not_found'; end if;

  select coalesce(sum(weight) filter (where status = 'ready'), 0)::integer
  into v_readiness_score
  from public.tax_case_tasks
  where case_id = v_case_id;

  update public.tax_cases
  set
    readiness_score = v_readiness_score,
    status = case
      when status = 'completed' then status
      when v_readiness_score = 100 then 'ready'
      else 'preparing'
    end
  where id = v_case_id;

  return public.api_get_tax_case_v2(p_access_token);
end;
$$;

create or replace function public.api_update_tax_case_document_v2(
  p_access_token uuid,
  p_document_key text,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_case_id uuid;
begin
  if p_document_key !~ '^[a-z0-9_]{1,80}$'
    or p_status not in ('pending', 'ready') then
    raise exception 'invalid_document_update';
  end if;
  select id into v_case_id
  from public.tax_cases
  where access_token = p_access_token
    and (expires_at is null or expires_at > now());
  if v_case_id is null then raise exception 'case_not_found'; end if;

  update public.tax_case_documents
  set status = p_status
  where case_id = v_case_id and document_key = p_document_key;
  if not found then raise exception 'document_not_found'; end if;

  return public.api_get_tax_case_v2(p_access_token);
end;
$$;

create or replace function public.api_set_tax_case_filing_method_v2(
  p_access_token uuid,
  p_filing_method text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_filing_method not in ('direct', 'professional') then
    raise exception 'invalid_filing_method';
  end if;
  update public.tax_cases
  set filing_method = p_filing_method
  where access_token = p_access_token
    and status <> 'completed'
    and (expires_at is null or expires_at > now());
  if not found then raise exception 'case_not_found'; end if;
  return public.api_get_tax_case_v2(p_access_token);
end;
$$;

create or replace function public.api_complete_tax_case_v2(
  p_access_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.tax_cases
  set
    status = 'completed',
    filing_completed_at = coalesce(filing_completed_at, now()),
    reminder_enabled = false,
    reminder_updated_at = now()
  where access_token = p_access_token
    and (expires_at is null or expires_at > now());
  if not found then raise exception 'case_not_found'; end if;
  return public.api_get_tax_case_v2(p_access_token);
end;
$$;

create or replace function public.api_record_tax_case_action_v2(
  p_access_token uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_action not in ('hometax_open', 'consultation_open') then
    raise exception 'invalid_action';
  end if;
  update public.tax_cases
  set
    hometax_opened_at = case
      when p_action = 'hometax_open' then coalesce(hometax_opened_at, now())
      else hometax_opened_at
    end,
    consultation_opened_at = case
      when p_action = 'consultation_open' then coalesce(consultation_opened_at, now())
      else consultation_opened_at
    end
  where access_token = p_access_token
    and (expires_at is null or expires_at > now());
  if not found then raise exception 'case_not_found'; end if;
  return public.api_get_tax_case_v2(p_access_token);
end;
$$;

create or replace function public.api_claim_tax_case_v2(
  p_access_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  update public.tax_cases
  set user_id = v_user_id, expires_at = null
  where access_token = p_access_token
    and (user_id is null or user_id = v_user_id)
    and (expires_at is null or expires_at > now());
  return found;
end;
$$;

create or replace function public.api_list_my_tax_cases_v2()
returns jsonb
language sql
security definer
set search_path = public, auth, pg_temp
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'token', c.access_token::text,
        'caseType', c.case_type,
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
          where t.case_id = c.id and t.status <> 'ready'
          order by t.sort_order
          limit 1
        )
      )
      order by
        case when c.status = 'completed' then 1 else 0 end,
        c.updated_at desc
    ),
    '[]'::jsonb
  )
  from public.tax_cases c
  where c.user_id = auth.uid();
$$;

create or replace function public.api_update_tax_case_deadline_v2(
  p_access_token uuid,
  p_filing_period_label text,
  p_filing_deadline date,
  p_reminder_enabled boolean,
  p_reminder_days integer[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_days integer[];
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if octet_length(coalesce(p_filing_period_label, '')) not between 1 and 160
    or p_filing_deadline is null
    or p_reminder_days is null
    or cardinality(p_reminder_days) not between 1 and 3
    or not (p_reminder_days <@ array[1, 3, 7]) then
    raise exception 'invalid_deadline';
  end if;
  select array_agg(day order by day desc)
  into v_days
  from (select distinct unnest(p_reminder_days) as day) d;

  update public.tax_cases
  set
    filing_period_label = p_filing_period_label,
    filing_deadline = p_filing_deadline,
    reminder_enabled = p_reminder_enabled,
    reminder_days = v_days,
    reminder_updated_at = now()
  where access_token = p_access_token
    and user_id = auth.uid()
    and status <> 'completed';
  if not found then raise exception 'case_not_found'; end if;
  return public.api_get_tax_case_v2(p_access_token);
end;
$$;

revoke all on function public.api_get_tax_case_v2(uuid) from public;
revoke all on function public.api_create_guided_tax_case_v1(uuid, text, text, jsonb, jsonb, integer, text, text, text, date, jsonb, jsonb) from public;
revoke all on function public.api_update_tax_case_task_v2(uuid, text, text) from public;
revoke all on function public.api_update_tax_case_document_v2(uuid, text, text) from public;
revoke all on function public.api_set_tax_case_filing_method_v2(uuid, text) from public;
revoke all on function public.api_complete_tax_case_v2(uuid) from public;
revoke all on function public.api_record_tax_case_action_v2(uuid, text) from public;
revoke all on function public.api_claim_tax_case_v2(uuid) from public;
revoke all on function public.api_list_my_tax_cases_v2() from public;
revoke all on function public.api_update_tax_case_deadline_v2(uuid, text, date, boolean, integer[]) from public;

grant execute on function public.api_get_tax_case_v2(uuid) to anon, authenticated, service_role;
grant execute on function public.api_create_guided_tax_case_v1(uuid, text, text, jsonb, jsonb, integer, text, text, text, date, jsonb, jsonb) to anon, authenticated, service_role;
grant execute on function public.api_update_tax_case_task_v2(uuid, text, text) to anon, authenticated, service_role;
grant execute on function public.api_update_tax_case_document_v2(uuid, text, text) to anon, authenticated, service_role;
grant execute on function public.api_set_tax_case_filing_method_v2(uuid, text) to anon, authenticated, service_role;
grant execute on function public.api_complete_tax_case_v2(uuid) to anon, authenticated, service_role;
grant execute on function public.api_record_tax_case_action_v2(uuid, text) to anon, authenticated, service_role;
grant execute on function public.api_claim_tax_case_v2(uuid) to authenticated;
grant execute on function public.api_list_my_tax_cases_v2() to authenticated;
grant execute on function public.api_update_tax_case_deadline_v2(uuid, text, date, boolean, integer[]) to authenticated;
