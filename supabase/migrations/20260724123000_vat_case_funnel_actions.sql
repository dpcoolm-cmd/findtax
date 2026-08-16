alter table public.tax_cases
  add column if not exists hometax_opened_at timestamptz,
  add column if not exists consultation_opened_at timestamptz;

create or replace function public.api_record_vat_tax_case_action_v1(
  p_access_token uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rows integer;
begin
  if p_action not in ('hometax_open', 'consultation_open') then
    raise exception 'invalid_case_action';
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
    and case_type = 'vat'
    and (expires_at is null or expires_at > now());

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'case_not_found';
  end if;

  return public.api_get_vat_tax_case_v1(p_access_token);
end;
$$;

revoke all on function public.api_record_vat_tax_case_action_v1(uuid, text)
  from public, anon, authenticated;
grant execute on function public.api_record_vat_tax_case_action_v1(uuid, text)
  to anon, authenticated, service_role;
