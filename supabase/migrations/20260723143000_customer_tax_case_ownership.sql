create or replace function public.api_claim_vat_tax_case_v1(
  p_access_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_rows integer;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  update public.tax_cases
  set
    user_id = v_user_id,
    expires_at = null
  where access_token = p_access_token
    and case_type = 'vat'
    and (expires_at is null or expires_at > now())
    and (user_id is null or user_id = v_user_id);

  get diagnostics v_rows = row_count;
  return v_rows > 0;
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

revoke all on function public.api_claim_vat_tax_case_v1(uuid) from public;
revoke all on function public.api_list_my_vat_tax_cases_v1() from public;
revoke all on function public.api_claim_vat_tax_case_v1(uuid) from anon;
revoke all on function public.api_list_my_vat_tax_cases_v1() from anon;

grant execute on function public.api_claim_vat_tax_case_v1(uuid) to authenticated;
grant execute on function public.api_list_my_vat_tax_cases_v1() to authenticated;
