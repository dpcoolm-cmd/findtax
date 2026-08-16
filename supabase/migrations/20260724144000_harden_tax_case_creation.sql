revoke all on function public.api_create_guided_tax_case_v1(
  uuid, text, text, jsonb, jsonb, integer, text, text, text, date, jsonb, jsonb
) from public, anon, authenticated;

grant execute on function public.api_create_guided_tax_case_v1(
  uuid, text, text, jsonb, jsonb, integer, text, text, text, date, jsonb, jsonb
) to service_role;

revoke all on function public.api_create_vat_tax_case_v1(
  uuid, text, jsonb, jsonb, integer, text, text
) from public, anon, authenticated;

grant execute on function public.api_create_vat_tax_case_v1(
  uuid, text, jsonb, jsonb, integer, text, text
) to service_role;
