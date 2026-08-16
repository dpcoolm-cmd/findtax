-- Open beta: Founders Club (first 20 approved) get 9,900,000 points + unlimited 0P unlocks
-- Replaces rpc_admin_approve_partner / rpc_partner_unlock_lead in-place.

create or replace function public.rpc_admin_approve_partner(p_partner_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  pr public.partners%rowtype;
  founders int;
  grant_founder boolean := false;
  founder_bonus bigint := 9900000;
  ref_id uuid;
  ref_row public.partners%rowtype;
  cycle_blocked boolean := false;
  referral_amount bigint := 30000;
begin
  perform pg_advisory_xact_lock(184021);

  select * into pr from public.partners where id = p_partner_id for update;
  if not found then
    return json_build_object('ok', false, 'error', 'partner_not_found');
  end if;
  if pr.status <> 'pending' then
    return json_build_object('ok', false, 'error', 'not_pending');
  end if;
  if pr.approval_events_processed_at is not null then
    return json_build_object('ok', false, 'error', 'already_processed');
  end if;

  select count(*) into founders from public.partners where is_founder = true;

  if founders < 20 then
    grant_founder := true;
  end if;

  update public.partners
  set
    status = 'approved',
    approved_at = now(),
    approval_events_processed_at = now(),
    is_founder = case when grant_founder then true else is_founder end,
    founder_discount_until = case
      when grant_founder then coalesce(founder_discount_until, now() + interval '365 days')
      else founder_discount_until
    end,
    points_balance = points_balance + case when grant_founder then founder_bonus else 0 end,
    updated_at = now()
  where id = p_partner_id;

  if grant_founder then
    insert into public.point_ledger (partner_id, amount, balance_after, entry_type, meta)
    values (
      p_partner_id,
      founder_bonus,
      (select points_balance from public.partners where id = p_partner_id),
      'founder_bonus',
      json_build_object(
        'note', 'Open Beta Founder Unlimited Pass',
        'display', 'Open Beta Founder Unlimited Pass'
      )
    );
  end if;

  ref_id := pr.referrer_partner_id;
  if ref_id is not null and ref_id <> p_partner_id then
    select * into ref_row from public.partners where id = ref_id for update;
    if not found then
      ref_id := null;
    elsif ref_row.referrer_partner_id = p_partner_id then
      cycle_blocked := true;
    end if;

    if cycle_blocked then
      insert into public.point_ledger (partner_id, amount, balance_after, entry_type, meta)
      values (
        p_partner_id,
        0,
        (select points_balance from public.partners where id = p_partner_id),
        'referral_blocked',
        json_build_object('reason', 'mutual_referral_cycle')
      );
    elsif ref_id is not null and ref_row.status = 'approved' then
      update public.partners
      set
        points_balance = points_balance + referral_amount,
        updated_at = now()
      where id = ref_id;

      insert into public.point_ledger (partner_id, amount, balance_after, entry_type, meta)
      values (
        ref_id,
        referral_amount,
        (select points_balance from public.partners where id = ref_id),
        'referral_reward',
        json_build_object('referee_partner_id', p_partner_id)
      );
    end if;
  end if;

  update public.partners
  set referral_reward_processed_at = now()
  where id = p_partner_id;

  return json_build_object(
    'ok', true,
    'is_founder', grant_founder,
    'founders_after', (select count(*)::int from public.partners where is_founder = true)
  );
end;
$$;

revoke all on function public.rpc_admin_approve_partner(uuid) from public;
grant execute on function public.rpc_admin_approve_partner(uuid) to service_role;

create or replace function public.rpc_partner_unlock_lead(p_lead_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partner uuid;
  base_amt bigint;
  final_amt bigint;
  disc_until timestamptz;
  v_is_founder boolean;
  bal bigint;
  l_situation text;
begin
  v_partner := public.internal_resolve_partner_id();
  if v_partner is null then
    return json_build_object('ok', false, 'error', 'not_partner');
  end if;

  if not exists (
    select 1 from public.lead_partner_assignments
    where partner_id = v_partner and lead_id = p_lead_id
  ) then
    return json_build_object('ok', false, 'error', 'not_assigned');
  end if;

  if exists (
    select 1 from public.lead_partner_assignments
    where partner_id = v_partner and lead_id = p_lead_id and unlocked_at is not null
  ) then
    return json_build_object('ok', true, 'already_unlocked', true);
  end if;

  select situation into l_situation from public.leads where id = p_lead_id;
  base_amt := public.internal_get_unlock_base_amount(l_situation);

  select founder_discount_until, is_founder
  into disc_until, v_is_founder
  from public.partners
  where id = v_partner
  for update;

  if v_is_founder then
    final_amt := 0;
  elsif disc_until is not null and disc_until > now() then
    final_amt := ceil(base_amt * 0.8);
  else
    final_amt := base_amt;
  end if;

  if final_amt > 0 then
    select points_balance into bal from public.partners where id = v_partner;
    if bal < final_amt then
      return json_build_object(
        'ok', false,
        'error', 'insufficient_balance',
        'required', final_amt,
        'balance', bal
      );
    end if;
  end if;

  update public.partners
  set
    points_balance = points_balance - final_amt,
    updated_at = now()
  where id = v_partner;

  update public.lead_partner_assignments
  set
    unlocked_at = now(),
    unlock_points_charged = final_amt
  where partner_id = v_partner and lead_id = p_lead_id;

  insert into public.point_ledger (partner_id, amount, balance_after, entry_type, lead_id, meta)
  values (
    v_partner,
    -final_amt,
    (select points_balance from public.partners where id = v_partner),
    case
      when v_is_founder then 'lead_unlock'::point_ledger_entry_type
      when disc_until is not null and disc_until > now() and final_amt > 0 then 'lead_unlock_discount'::point_ledger_entry_type
      else 'lead_unlock'::point_ledger_entry_type
    end,
    p_lead_id,
    case
      when v_is_founder then
        json_build_object(
          'base_amount', base_amt,
          'charged', final_amt,
          'note', 'Open Beta Founder Unlimited Pass'
        )
      else
        json_build_object('base_amount', base_amt, 'charged', final_amt)
    end
  );

  return json_build_object(
    'ok', true,
    'charged', final_amt,
    'founder_pass', v_is_founder,
    'balance_after', (select points_balance from public.partners where id = v_partner)
  );
end;
$$;

revoke all on function public.rpc_partner_unlock_lead(uuid) from public;
grant execute on function public.rpc_partner_unlock_lead(uuid) to authenticated;
