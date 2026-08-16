alter function public.populate_vat_tax_case_documents_v1() security invoker;
revoke all on function public.populate_vat_tax_case_documents_v1()
  from public, anon, authenticated;
grant execute on function public.populate_vat_tax_case_documents_v1()
  to service_role;
