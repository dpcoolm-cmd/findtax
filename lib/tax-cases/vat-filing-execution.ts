export type VatFilingMethod = "undecided" | "direct" | "professional";
export type VatCaseDocumentStatus = "pending" | "ready";

export const VAT_FILING_METHODS = ["direct", "professional"] as const;
export const VAT_DOCUMENT_STATUSES = ["pending", "ready"] as const;

export const HOMETAX_VAT_STEPS = [
  {
    title: "기본정보 확인",
    description: "사업자등록번호, 과세유형, 신고 대상 기간이 맞는지 확인합니다.",
  },
  {
    title: "신고서식 선택",
    description: "내 거래에 필요한 매출·매입 및 부속 명세 서식을 선택합니다.",
  },
  {
    title: "매출·매입 입력",
    description: "미리채움 자료와 실제 증빙을 대조하고 공제·불공제 항목을 확인합니다.",
  },
  {
    title: "세액 확인 후 제출",
    description: "최종 납부·환급 세액과 계좌를 확인한 뒤 신고서를 제출합니다.",
  },
] as const;

export function isVatFilingMethod(
  value: unknown,
): value is Exclude<VatFilingMethod, "undecided"> {
  return VAT_FILING_METHODS.includes(
    value as (typeof VAT_FILING_METHODS)[number],
  );
}

export function isVatCaseDocumentStatus(
  value: unknown,
): value is VatCaseDocumentStatus {
  return VAT_DOCUMENT_STATUSES.includes(
    value as (typeof VAT_DOCUMENT_STATUSES)[number],
  );
}
