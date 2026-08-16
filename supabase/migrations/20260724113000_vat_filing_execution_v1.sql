alter table public.tax_cases
  add column if not exists filing_method text not null default 'undecided',
  add column if not exists filing_completed_at timestamptz;

alter table public.tax_cases
  drop constraint if exists tax_cases_filing_method_check,
  add constraint tax_cases_filing_method_check
    check (filing_method in ('undecided', 'direct', 'professional'));

create table if not exists public.tax_case_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.tax_cases(id) on delete cascade,
  document_key text not null,
  label text not null,
  description text not null,
  reason text not null,
  required boolean not null default true,
  status text not null default 'pending',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tax_case_documents_case_key unique (case_id, document_key),
  constraint tax_case_documents_status_check check (status in ('pending', 'ready'))
);

create index if not exists tax_case_documents_case_sort_idx
  on public.tax_case_documents(case_id, sort_order);

drop trigger if exists tax_case_documents_set_updated_at on public.tax_case_documents;
create trigger tax_case_documents_set_updated_at
before update on public.tax_case_documents
for each row execute procedure public.set_updated_at();

alter table public.tax_case_documents enable row level security;
revoke all on table public.tax_case_documents from anon, authenticated;
grant select, insert, update, delete on table public.tax_case_documents to service_role;

create or replace function public.populate_vat_tax_case_documents_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_input jsonb := coalesce(new.input_json->'decisionInput', '{}'::jsonb);
begin
  insert into public.tax_case_documents (
    case_id,
    document_key,
    label,
    description,
    reason,
    sort_order
  )
  values
    (
      new.case_id,
      'business_profile',
      '사업자 기본정보',
      '홈택스에서 사업자등록 상태, 과세유형, 신고 대상 기간을 확인하세요.',
      '간이·일반과세 여부와 신고 기간이 맞아야 다음 입력이 정확해집니다.',
      0
    ),
    (
      new.case_id,
      'sales_evidence',
      '매출 자료',
      '전자세금계산서, 카드매출, 현금영수증 매출을 신고 기간별로 모으세요.',
      '홈택스 미리채움 자료의 누락과 중복을 실제 매출과 대조하기 위해 필요합니다.',
      10
    ),
    (
      new.case_id,
      'purchase_evidence',
      '매입·공제 자료',
      '전자세금계산서, 사업용 카드, 현금영수증 등 공제 후보 자료를 모으세요.',
      '공제 가능한 매입세액을 놓치거나 불공제 항목을 잘못 넣는 일을 줄입니다.',
      20
    ),
    (
      new.case_id,
      'adjustments',
      '취소·반품·누락 확인',
      '취소, 반품, 수정세금계산서와 신고 자료에 빠진 거래가 없는지 확인하세요.',
      '최종 매출·매입 금액과 증빙 금액을 일치시키는 마지막 대조 단계입니다.',
      30
    )
  on conflict (case_id, document_key) do nothing;

  if v_input->>'hasOnlineMarketplace' = 'true' then
    insert into public.tax_case_documents (
      case_id, document_key, label, description, reason, sort_order
    )
    values (
      new.case_id,
      'marketplace_settlements',
      '플랫폼 정산서',
      '스마트스토어, 쿠팡 등 판매처별 정산서와 수수료·쿠폰·반품 내역을 내려받으세요.',
      '플랫폼 입금액은 수수료 등이 차감되어 실제 과세 매출과 다를 수 있습니다.',
      40
    )
    on conflict (case_id, document_key) do nothing;
  end if;

  if v_input->>'hasPaperOrCashData' = 'true' then
    insert into public.tax_case_documents (
      case_id, document_key, label, description, reason, sort_order
    )
    values (
      new.case_id,
      'paper_cash_ledger',
      '종이·현금 거래 장부',
      '종이 세금계산서와 단말기 밖 현금 매출·매입을 날짜순으로 정리하세요.',
      '자동 수집되지 않는 거래는 직접 입력하지 않으면 신고에서 빠질 수 있습니다.',
      50
    )
    on conflict (case_id, document_key) do nothing;
  end if;

  if v_input->>'hasCrossBorderSales' = 'true' then
    insert into public.tax_case_documents (
      case_id, document_key, label, description, reason, sort_order
    )
    values (
      new.case_id,
      'cross_border_evidence',
      '해외판매·영세율 증빙',
      '수출신고필증, 외화입금 내역, 해외 플랫폼 정산서 등 거래 유형별 증빙을 모으세요.',
      '해외판매는 거래 구조에 따라 영세율 적용과 제출 서류가 달라질 수 있습니다.',
      60
    )
    on conflict (case_id, document_key) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists tax_case_assessments_populate_vat_documents
  on public.tax_case_assessments;
create trigger tax_case_assessments_populate_vat_documents
after insert on public.tax_case_assessments
for each row execute procedure public.populate_vat_tax_case_documents_v1();

with latest_assessments as (
  select distinct on (case_id)
    case_id,
    coalesce(input_json->'decisionInput', '{}'::jsonb) as decision_input
  from public.tax_case_assessments
  order by case_id, snapshot_version desc
),
document_templates as (
  select *
  from (
    values
      (
        'business_profile',
        '사업자 기본정보',
        '홈택스에서 사업자등록 상태, 과세유형, 신고 대상 기간을 확인하세요.',
        '간이·일반과세 여부와 신고 기간이 맞아야 다음 입력이 정확해집니다.',
        0,
        null::text
      ),
      (
        'sales_evidence',
        '매출 자료',
        '전자세금계산서, 카드매출, 현금영수증 매출을 신고 기간별로 모으세요.',
        '홈택스 미리채움 자료의 누락과 중복을 실제 매출과 대조하기 위해 필요합니다.',
        10,
        null::text
      ),
      (
        'purchase_evidence',
        '매입·공제 자료',
        '전자세금계산서, 사업용 카드, 현금영수증 등 공제 후보 자료를 모으세요.',
        '공제 가능한 매입세액을 놓치거나 불공제 항목을 잘못 넣는 일을 줄입니다.',
        20,
        null::text
      ),
      (
        'adjustments',
        '취소·반품·누락 확인',
        '취소, 반품, 수정세금계산서와 신고 자료에 빠진 거래가 없는지 확인하세요.',
        '최종 매출·매입 금액과 증빙 금액을 일치시키는 마지막 대조 단계입니다.',
        30,
        null::text
      ),
      (
        'marketplace_settlements',
        '플랫폼 정산서',
        '스마트스토어, 쿠팡 등 판매처별 정산서와 수수료·쿠폰·반품 내역을 내려받으세요.',
        '플랫폼 입금액은 수수료 등이 차감되어 실제 과세 매출과 다를 수 있습니다.',
        40,
        'hasOnlineMarketplace'
      ),
      (
        'paper_cash_ledger',
        '종이·현금 거래 장부',
        '종이 세금계산서와 단말기 밖 현금 매출·매입을 날짜순으로 정리하세요.',
        '자동 수집되지 않는 거래는 직접 입력하지 않으면 신고에서 빠질 수 있습니다.',
        50,
        'hasPaperOrCashData'
      ),
      (
        'cross_border_evidence',
        '해외판매·영세율 증빙',
        '수출신고필증, 외화입금 내역, 해외 플랫폼 정산서 등 거래 유형별 증빙을 모으세요.',
        '해외판매는 거래 구조에 따라 영세율 적용과 제출 서류가 달라질 수 있습니다.',
        60,
        'hasCrossBorderSales'
      )
  ) as templates(document_key, label, description, reason, sort_order, condition_key)
)
insert into public.tax_case_documents (
  case_id,
  document_key,
  label,
  description,
  reason,
  sort_order
)
select
  assessment.case_id,
  template.document_key,
  template.label,
  template.description,
  template.reason,
  template.sort_order
from latest_assessments assessment
cross join document_templates template
where template.condition_key is null
  or assessment.decision_input->>template.condition_key = 'true'
on conflict (case_id, document_key) do nothing;

create or replace function public.api_get_vat_tax_case_v1(
  p_access_token uuid
)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select jsonb_build_object(
    'token', c.access_token::text,
    'title', c.title,
    'status', c.status,
    'readinessScore', c.readiness_score,
    'complexityScore', c.complexity_score,
    'recommendation', c.recommendation,
    'filingPeriodLabel', c.filing_period_label,
    'filingDeadline', c.filing_deadline,
    'reminderEnabled', c.reminder_enabled,
    'reminderDays', to_jsonb(c.reminder_days),
    'filingMethod', c.filing_method,
    'filingCompletedAt', c.filing_completed_at,
    'createdAt', c.created_at,
    'updatedAt', c.updated_at,
    'tasks', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'key', t.task_key,
            'label', t.label,
            'description', t.description,
            'status', t.status,
            'weight', t.weight,
            'sortOrder', t.sort_order
          )
          order by t.sort_order
        )
        from public.tax_case_tasks t
        where t.case_id = c.id
      ),
      '[]'::jsonb
    ),
    'documents', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'key', d.document_key,
            'label', d.label,
            'description', d.description,
            'reason', d.reason,
            'required', d.required,
            'status', d.status,
            'sortOrder', d.sort_order
          )
          order by d.sort_order
        )
        from public.tax_case_documents d
        where d.case_id = c.id
      ),
      '[]'::jsonb
    )
  )
  from public.tax_cases c
  where c.access_token = p_access_token
    and c.case_type = 'vat'
    and (c.expires_at is null or c.expires_at > now());
$$;

create or replace function public.api_update_vat_tax_case_document_v1(
  p_access_token uuid,
  p_document_key text,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_case_id uuid;
  v_rows integer;
begin
  if p_status not in ('pending', 'ready')
    or char_length(coalesce(p_document_key, '')) not between 1 and 80 then
    raise exception 'invalid_document_update';
  end if;

  select id
    into v_case_id
  from public.tax_cases
  where access_token = p_access_token
    and case_type = 'vat'
    and status <> 'completed'
    and (expires_at is null or expires_at > now());

  if v_case_id is null then
    raise exception 'case_not_found_or_completed';
  end if;

  update public.tax_case_documents
  set status = p_status
  where case_id = v_case_id
    and document_key = p_document_key;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'document_not_found';
  end if;

  update public.tax_cases
  set updated_at = now()
  where id = v_case_id;

  return public.api_get_vat_tax_case_v1(p_access_token);
end;
$$;

create or replace function public.api_set_vat_filing_method_v1(
  p_access_token uuid,
  p_filing_method text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rows integer;
begin
  if p_filing_method not in ('direct', 'professional') then
    raise exception 'invalid_filing_method';
  end if;

  update public.tax_cases
  set filing_method = p_filing_method
  where access_token = p_access_token
    and case_type = 'vat'
    and status <> 'completed'
    and (expires_at is null or expires_at > now());

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'case_not_found_or_completed';
  end if;

  return public.api_get_vat_tax_case_v1(p_access_token);
end;
$$;

create or replace function public.api_complete_vat_tax_case_v1(
  p_access_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rows integer;
begin
  update public.tax_cases
  set
    status = 'completed',
    filing_completed_at = coalesce(filing_completed_at, now()),
    reminder_enabled = false,
    reminder_updated_at = now()
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

revoke all on function public.populate_vat_tax_case_documents_v1() from public;
revoke all on function public.api_update_vat_tax_case_document_v1(uuid, text, text) from public;
revoke all on function public.api_set_vat_filing_method_v1(uuid, text) from public;
revoke all on function public.api_complete_vat_tax_case_v1(uuid) from public;

grant execute on function public.api_update_vat_tax_case_document_v1(uuid, text, text)
  to anon, authenticated, service_role;
grant execute on function public.api_set_vat_filing_method_v1(uuid, text)
  to anon, authenticated, service_role;
grant execute on function public.api_complete_vat_tax_case_v1(uuid)
  to anon, authenticated, service_role;
