drop policy if exists leads_insert_anon on public.leads;

revoke all privileges on table public.leads from anon, authenticated;

grant execute on function public.rpc_submit_lead(
  text, text, text, text, text, text, text, uuid,
  text, text, text, text, text, integer, text
) to anon, authenticated;
