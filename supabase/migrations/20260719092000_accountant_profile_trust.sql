alter table public.tax_accountants
  add column if not exists verification_status text not null default 'public_record',
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists last_verified_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tax_accountants'::regclass
      and conname = 'tax_accountants_verification_status_check'
  ) then
    alter table public.tax_accountants
      add constraint tax_accountants_verification_status_check
      check (verification_status in ('public_record', 'findtax_verified'));
  end if;
end $$;

comment on column public.tax_accountants.verification_status is
  'public_record: public directory information, findtax_verified: partner documents reviewed by FindTax.';
