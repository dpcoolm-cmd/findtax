-- api_list_my_tax_cases_v2 uses auth.uid() and must never be callable by anon.
revoke all on function public.api_list_my_tax_cases_v2()
  from public, anon, authenticated;
grant execute on function public.api_list_my_tax_cases_v2()
  to authenticated;
