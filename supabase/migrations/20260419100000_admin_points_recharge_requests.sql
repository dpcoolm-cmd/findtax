-- Manual admin point top-up (RPC) + partner bank recharge request records

create table if not exists public.partner_point_recharge_requests (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  requested_amount bigint not null,
  depositor_name text not null,
  partner_memo text,
  tax_invoice_company_name text not null,
  tax_invoice_business_reg_no text not null,
  tax_invoice_email text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint partner_point_recharge_requests_amount_pos check (requested_amount > 0),
  constraint partner_point_recharge_requests_status_chk check (status in ('pending', 'done', 'cancelled'))
);

create index if not exists partner_point_recharge_requests_status_created_idx
  on public.partner_point_recharge_requests (status, created_at desc);

alter table public.partner_point_recharge_requests enable row level security;

drop policy if exists partner_point_recharge_requests_deny on public.partner_point_recharge_requests;
create policy partner_point_recharge_requests_deny on public.partner_point_recharge_requests
  for all using (false) with check (false);

-- ---------------------------------------------------------------------------
-- rpc_admin_adjust_points: atomic credit + ledger (service_role only)
-- ---------------------------------------------------------------------------
create or replace function public.rpc_admin_adjust_points(
  p_partner_id uuid,
  p_amount bigint,
  p_reason text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  new_bal bigint;
  n int;
begin
  if p_amount is null or p_amount <= 0 then
    return json_build_object('ok', false, 'error', 'amount_must_be_positive');
  end if;
  if coalesce(trim(p_reason), '') = '' then
    return json_build_object('ok', false, 'error', 'reason_required');
  end if;

  update public.partners
  set
    points_balance = points_balance + p_amount,
    updated_at = now()
  where id = p_partner_id
  returning points_balance into new_bal;

  get diagnostics n = row_count;
  if n = 0 then
    return json_build_object('ok', false, 'error', 'partner_not_found');
  end if;

  insert into public.point_ledger (partner_id, amount, balance_after, entry_type, meta)
  values (
    p_partner_id,
    p_amount,
    new_bal,
    'admin_adjustment',
    json_build_object('reason', p_reason, 'source', 'manual_admin_topup')
  );

  return json_build_object('ok', true, 'balance_after', new_bal);
end;
$$;

revoke all on function public.rpc_admin_adjust_points(uuid, bigint, text) from public;
grant execute on function public.rpc_admin_adjust_points(uuid, bigint, text) to service_role;
