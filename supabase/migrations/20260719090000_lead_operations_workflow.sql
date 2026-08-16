alter table public.leads
  add column if not exists workflow_status text not null default 'new',
  add column if not exists assigned_partner_id uuid references public.partners(id) on delete set null,
  add column if not exists public_tracking_token uuid not null default gen_random_uuid(),
  add column if not exists contacted_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists admin_note text,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.leads'::regclass
      and conname = 'leads_workflow_status_check'
  ) then
    alter table public.leads
      add constraint leads_workflow_status_check
      check (workflow_status in ('new', 'assigned', 'contacted', 'consulting', 'completed', 'closed'));
  end if;
end $$;

create unique index if not exists leads_public_tracking_token_key
  on public.leads(public_tracking_token);
create index if not exists leads_workflow_status_created_at_idx
  on public.leads(workflow_status, created_at desc);
create index if not exists leads_assigned_partner_id_idx
  on public.leads(assigned_partner_id)
  where assigned_partner_id is not null;

create or replace function public.set_leads_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
before update on public.leads
for each row execute function public.set_leads_updated_at();

alter table public.leads enable row level security;

comment on column public.leads.public_tracking_token is
  'Opaque token used by the server-only public lead status endpoint.';
comment on column public.leads.workflow_status is
  'Detailed operations state. The legacy status column remains for compatibility.';
