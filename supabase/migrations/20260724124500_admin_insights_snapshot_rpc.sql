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
      select 1
      from private.admin_emails admin
      where lower(admin.email) = v_email
    ) then
    raise exception 'admin_required';
  end if;

  if p_since < now() - interval '370 days'
    or p_since > now() then
    raise exception 'invalid_period';
  end if;

  return jsonb_build_object(
    'trackingRows',
    coalesce(
      (
        select jsonb_agg(to_jsonb(event_row))
        from (
          select event_type, payload, created_at
          from public.tracking_events
          where created_at >= p_since
            and event_type in (
              'page_view',
              'phone_click',
              'calculator_result_view',
              'calculator_summary_copy',
              'calculator_link_copy',
              'calculator_cta_click',
              'blog_cta_click',
              'industry_diagnosis_result_view',
              'industry_diagnosis_cta_click',
              'lead_submit',
              'situation_page_view',
              'situation_cta_click'
            )
          order by created_at asc
          limit 10000
        ) event_row
      ),
      '[]'::jsonb
    ),
    'operationLeads',
    coalesce(
      (
        select jsonb_agg(to_jsonb(lead_row))
        from (
          select
            workflow_status,
            assigned_partner_id,
            created_at,
            updated_at
          from public.leads
          where created_at >= p_since
          order by created_at asc
          limit 10000
        ) lead_row
      ),
      '[]'::jsonb
    ),
    'taxCases',
    coalesce(
      (
        select jsonb_agg(to_jsonb(case_row))
        from (
          select
            id,
            status,
            readiness_score,
            complexity_score,
            recommendation,
            source_path,
            user_id,
            filing_method,
            created_at,
            filing_completed_at,
            hometax_opened_at,
            consultation_opened_at
          from public.tax_cases
          where case_type = 'vat'
            and created_at >= p_since
          order by created_at asc
          limit 10000
        ) case_row
      ),
      '[]'::jsonb
    ),
    'taxCaseDocuments',
    coalesce(
      (
        select jsonb_agg(to_jsonb(document_row))
        from (
          select document.case_id, document.status
          from public.tax_case_documents document
          join public.tax_cases tax_case
            on tax_case.id = document.case_id
          where tax_case.case_type = 'vat'
            and tax_case.created_at >= p_since
          order by document.case_id, document.sort_order
          limit 20000
        ) document_row
      ),
      '[]'::jsonb
    )
  );
end;
$$;

revoke all on function public.api_admin_insights_snapshot_v1(timestamptz)
  from public, anon, authenticated;
grant execute on function public.api_admin_insights_snapshot_v1(timestamptz)
  to authenticated;
