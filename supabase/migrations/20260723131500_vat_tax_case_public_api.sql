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

create or replace function public.api_create_vat_tax_case_v1(
  p_client_dedupe_key uuid,
  p_source_path text,
  p_decision_input jsonb,
  p_readiness_answers jsonb,
  p_complexity_score integer,
  p_recommendation text,
  p_rule_version text
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
  v_status text;
begin
  if p_complexity_score not between 0 and 100 then
    raise exception 'invalid_complexity_score';
  end if;
  if p_recommendation not in ('self', 'review', 'tax_accountant') then
    raise exception 'invalid_recommendation';
  end if;
  if octet_length(coalesce(p_source_path, '')) > 500
    or octet_length(coalesce(p_decision_input::text, '')) > 20000 then
    raise exception 'payload_too_large';
  end if;
  if coalesce(p_readiness_answers->>'sales', '') not in ('ready', 'not_ready', 'unsure')
    or coalesce(p_readiness_answers->>'purchases', '') not in ('ready', 'not_ready', 'unsure')
    or coalesce(p_readiness_answers->>'exceptions', '') not in ('ready', 'not_ready', 'unsure')
    or coalesce(p_readiness_answers->>'deadline', '') not in ('ready', 'not_ready', 'unsure') then
    raise exception 'invalid_readiness_answers';
  end if;

  v_readiness_score :=
    case when p_readiness_answers->>'sales' = 'ready' then 30 else 0 end
    + case when p_readiness_answers->>'purchases' = 'ready' then 30 else 0 end
    + case when p_readiness_answers->>'exceptions' = 'ready' then 25 else 0 end
    + case when p_readiness_answers->>'deadline' = 'ready' then 15 else 0 end;
  v_status := case when v_readiness_score = 100 then 'ready' else 'preparing' end;

  insert into public.tax_cases (
    client_dedupe_key,
    case_type,
    title,
    status,
    readiness_score,
    complexity_score,
    recommendation,
    source_path
  )
  values (
    p_client_dedupe_key,
    'vat',
    '부가세 신고 준비',
    v_status,
    v_readiness_score,
    p_complexity_score,
    p_recommendation,
    nullif(p_source_path, '')
  )
  on conflict (client_dedupe_key) do nothing
  returning id, access_token into v_case_id, v_access_token;

  if v_case_id is null then
    v_created := false;
    select id, access_token
      into v_case_id, v_access_token
    from public.tax_cases
    where client_dedupe_key = p_client_dedupe_key
      and case_type = 'vat';
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
      jsonb_build_object(
        'decisionInput', p_decision_input,
        'readinessAnswers', p_readiness_answers
      ),
      jsonb_build_object(
        'readinessScore', v_readiness_score,
        'complexityScore', p_complexity_score,
        'recommendation', p_recommendation
      )
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
    values
      (v_case_id, 'sales', '매출 자료 확인', '카드·현금영수증·세금계산서 매출을 확인했어요.', p_readiness_answers->>'sales', 30, 0),
      (v_case_id, 'purchases', '매입 자료 확인', '공제받을 매입 세금계산서와 영수증을 모았어요.', p_readiness_answers->>'purchases', 30, 1),
      (v_case_id, 'exceptions', '예외 거래 확인', '종이 자료·현금 거래·해외 거래 여부를 확인했어요.', p_readiness_answers->>'exceptions', 25, 2),
      (v_case_id, 'deadline', '신고 일정 확인', '신고·납부 마감일과 진행 시간을 확인했어요.', p_readiness_answers->>'deadline', 15, 3);
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

create or replace function public.api_update_vat_tax_case_task_v1(
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
  if p_task_key not in ('sales', 'purchases', 'exceptions', 'deadline')
    or p_status not in ('ready', 'not_ready', 'unsure') then
    raise exception 'invalid_task_update';
  end if;

  select id into v_case_id
  from public.tax_cases
  where access_token = p_access_token
    and case_type = 'vat'
    and (expires_at is null or expires_at > now());

  if v_case_id is null then
    raise exception 'case_not_found';
  end if;

  update public.tax_case_tasks
  set status = p_status
  where case_id = v_case_id
    and task_key = p_task_key;

  select coalesce(sum(weight) filter (where status = 'ready'), 0)::integer
    into v_readiness_score
  from public.tax_case_tasks
  where case_id = v_case_id;

  update public.tax_cases
  set
    readiness_score = v_readiness_score,
    status = case when v_readiness_score = 100 then 'ready' else 'preparing' end
  where id = v_case_id;

  return public.api_get_vat_tax_case_v1(p_access_token);
end;
$$;

revoke all on function public.api_get_vat_tax_case_v1(uuid) from public;
revoke all on function public.api_create_vat_tax_case_v1(uuid, text, jsonb, jsonb, integer, text, text) from public;
revoke all on function public.api_update_vat_tax_case_task_v1(uuid, text, text) from public;

grant execute on function public.api_get_vat_tax_case_v1(uuid) to anon, authenticated, service_role;
grant execute on function public.api_create_vat_tax_case_v1(uuid, text, jsonb, jsonb, integer, text, text) to anon, authenticated, service_role;
grant execute on function public.api_update_vat_tax_case_task_v1(uuid, text, text) to anon, authenticated, service_role;

