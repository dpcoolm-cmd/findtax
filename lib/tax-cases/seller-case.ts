export const SELLER_TAX_RULE_VERSION = "seller-tax-os-2026.1";

export type SellerProfile =
  | "smartstore"
  | "purchase_agency"
  | "reverse_export";

export type SellerTaxInput = {
  profile: SellerProfile;
  businessStatus: "registered" | "not_registered" | "unsure";
  vatStatus: "general" | "simplified" | "exempt" | "unsure";
  annualRevenueWon: number;
  monthlyOrderCount: number;
  platformCount: number;
  settlementCurrencyCount: number;
  hasEmployees: boolean;
  usesFulfillmentAbroad: boolean;
  hasExportEvidence: boolean;
  grossSalesSeparated: boolean;
  hasMonthlySettlementRoutine: boolean;
  hasExpenseEvidence: boolean;
};

export type SellerTaxAssessment = {
  profile: SellerProfile;
  complexityScore: number;
  recommendation: "self" | "review" | "tax_accountant";
  decisionSummary: string;
  nextDeadline: string;
  nextDeadlineLabel: string;
  obligations: Array<{
    key: string;
    label: string;
    required: boolean;
    reason: string;
  }>;
  warnings: string[];
  evidenceGaps: string[];
};

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function nextAnnualDate(month: number, day: number, now: Date): string {
  const year = now.getUTCFullYear();
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return candidate >= now
    ? isoDate(year, month, day)
    : isoDate(year + 1, month, day);
}

function nextVatDate(
  vatStatus: SellerTaxInput["vatStatus"],
  now: Date,
): string {
  if (vatStatus === "simplified") return nextAnnualDate(1, 25, now);
  const january = nextAnnualDate(1, 25, now);
  const july = nextAnnualDate(7, 25, now);
  return [january, july].sort()[0];
}

export function assessSellerTax(
  input: SellerTaxInput,
  now = new Date(),
): SellerTaxAssessment {
  let score =
    input.profile === "reverse_export"
      ? 28
      : input.profile === "purchase_agency"
        ? 24
        : 14;

  if (input.businessStatus === "not_registered") score += 14;
  if (input.businessStatus === "unsure") score += 18;
  if (input.vatStatus === "unsure") score += 12;
  if (input.annualRevenueWon >= 100_000_000) score += 18;
  else if (input.annualRevenueWon >= 50_000_000) score += 10;
  if (input.monthlyOrderCount >= 500) score += 14;
  else if (input.monthlyOrderCount >= 100) score += 8;
  if (input.platformCount >= 3) score += 8;
  if (input.settlementCurrencyCount >= 2) score += 10;
  if (input.hasEmployees) score += 14;
  if (input.usesFulfillmentAbroad) score += 10;
  if (!input.grossSalesSeparated) score += 14;
  if (!input.hasMonthlySettlementRoutine) score += 12;
  if (!input.hasExpenseEvidence) score += 10;
  if (
    input.profile === "reverse_export" &&
    !input.hasExportEvidence
  ) {
    score += 18;
  }

  const complexityScore = Math.min(100, score);
  const recommendation =
    complexityScore >= 60 ||
    (input.profile === "reverse_export" && !input.hasExportEvidence)
      ? "tax_accountant"
      : complexityScore >= 30
        ? "review"
        : "self";

  const obligations = [
    {
      key: "business_registration",
      label: "사업자등록 상태 확인",
      required: input.businessStatus !== "registered",
      reason: "계속·반복 판매라면 등록 여부가 부가세와 증빙 발급의 출발점입니다.",
    },
    {
      key: "vat",
      label: "부가가치세 신고",
      required: input.vatStatus !== "exempt",
      reason: "플랫폼 정산금이 아니라 세법상 매출과 매입을 기준으로 확인합니다.",
    },
    {
      key: "income_tax",
      label: "종합소득세 신고",
      required: true,
      reason: "플랫폼 수수료·배송비·광고비를 반영한 연간 이익을 기준으로 봅니다.",
    },
    {
      key: "zero_rate",
      label: "수출 영세율 증빙",
      required: input.profile === "reverse_export",
      reason: "해외 판매는 수출·배송·외화입금 근거가 함께 있어야 영세율 판단이 가능합니다.",
    },
    {
      key: "payroll",
      label: "원천세·지급명세서",
      required: input.hasEmployees,
      reason: "직원·외주 인건비 지급이 있으면 별도 신고 일정이 생깁니다.",
    },
  ];

  const warnings: string[] = [];
  if (!input.grossSalesSeparated) {
    warnings.push(
      "정산 입금액과 총매출을 구분하지 않으면 플랫폼 수수료·쿠폰·반품이 매출에서 빠질 수 있습니다.",
    );
  }
  if (input.profile === "purchase_agency") {
    warnings.push(
      "구매대행은 거래 실질에 따라 상품 전체 금액과 대행수수료 중 매출 인식 범위가 달라질 수 있습니다.",
    );
  }
  if (input.profile === "reverse_export" && !input.hasExportEvidence) {
    warnings.push(
      "수출신고·배송·외화입금 자료가 없으면 영세율 적용 근거가 부족할 수 있습니다.",
    );
  }
  if (input.settlementCurrencyCount >= 2) {
    warnings.push(
      "통화별 정산일과 적용 환율을 남겨 원화 환산 기준을 일관되게 관리하세요.",
    );
  }
  if (input.usesFulfillmentAbroad) {
    warnings.push(
      "해외 보관·배송 구조는 현지 세금과 국내 신고 범위를 함께 확인해야 합니다.",
    );
  }

  const evidenceGaps = [
    !input.grossSalesSeparated ? "총매출·수수료·반품 분리표" : null,
    !input.hasMonthlySettlementRoutine ? "플랫폼별 월 정산 대사표" : null,
    !input.hasExpenseEvidence ? "매입·광고·배송비 적격증빙" : null,
    input.profile === "reverse_export" && !input.hasExportEvidence
      ? "수출·배송·외화입금 증빙"
      : null,
  ].filter((item): item is string => item !== null);

  const nextDeadline =
    input.vatStatus === "exempt"
      ? nextAnnualDate(5, 31, now)
      : nextVatDate(input.vatStatus, now);
  const nextDeadlineLabel =
    input.vatStatus === "exempt"
      ? "종합소득세 기본 신고기한"
      : "부가가치세 기본 신고기한";

  return {
    profile: input.profile,
    complexityScore,
    recommendation,
    decisionSummary:
      recommendation === "tax_accountant"
        ? "거래 구조와 증빙을 정리한 뒤 신고 전 전문가 검토를 권합니다."
        : recommendation === "review"
          ? "월 정산 대사표를 먼저 만들고 애매한 항목만 검토받으세요."
          : "현재는 월별 자료를 직접 정리하며 관리할 수 있는 구조입니다.",
    nextDeadline,
    nextDeadlineLabel,
    obligations,
    warnings,
    evidenceGaps,
  };
}
