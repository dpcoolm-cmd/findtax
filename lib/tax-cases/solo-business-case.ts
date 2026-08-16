export const SOLO_BUSINESS_RULE_VERSION = "solo-business-2026.1";

export type SoloBusinessInput = {
  businessStatus: "registered" | "not_registered" | "unsure";
  vatStatus: "general" | "simplified" | "exempt" | "unsure";
  annualRevenueWon: number;
  incomeSourceCount: number;
  monthlyDocumentCount: number;
  hasEmployees: boolean;
  paysFreelancers: boolean;
  hasForeignTransactions: boolean;
  sellsOnMarketplaces: boolean;
  hasBookkeeping: boolean;
  hasEvidenceRoutine: boolean;
  hasTaxCalendar: boolean;
};

export type SoloBusinessAssessment = {
  complexityScore: number;
  recommendation: "self" | "review" | "tax_accountant";
  obligationCount: number;
  nextDeadline: string;
  nextDeadlineLabel: string;
  annualCalendar: Array<{
    key: string;
    label: string;
    timing: string;
    required: boolean;
  }>;
  warnings: string[];
};

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function nextAnnualDate(
  month: number,
  day: number,
  now: Date,
): string {
  const year = now.getUTCFullYear();
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return candidate >= now ? isoDate(year, month, day) : isoDate(year + 1, month, day);
}

function nextMonthlyWithholdingDate(now: Date): string {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const thisMonth = new Date(Date.UTC(year, month - 1, 10));
  if (thisMonth >= now) return isoDate(year, month, 10);
  const next = new Date(Date.UTC(year, month, 10));
  return isoDate(next.getUTCFullYear(), next.getUTCMonth() + 1, 10);
}

function nextVatDate(
  vatStatus: SoloBusinessInput["vatStatus"],
  now: Date,
): string {
  if (
    vatStatus !== "simplified" &&
    now <= new Date("2026-07-27T23:59:59.999Z")
  ) {
    return "2026-07-27";
  }
  if (vatStatus === "simplified") return nextAnnualDate(1, 25, now);
  const january = nextAnnualDate(1, 25, now);
  const july = nextAnnualDate(7, 25, now);
  return [january, july].sort()[0];
}

export function assessSoloBusiness(
  input: SoloBusinessInput,
  now = new Date(),
): SoloBusinessAssessment {
  let complexityScore = 0;
  if (input.businessStatus === "not_registered") complexityScore += 15;
  if (input.businessStatus === "unsure") complexityScore += 20;
  if (input.vatStatus === "unsure") complexityScore += 14;
  if (input.annualRevenueWon >= 100_000_000) complexityScore += 22;
  else if (input.annualRevenueWon >= 50_000_000) complexityScore += 12;
  if (input.incomeSourceCount >= 3) complexityScore += 14;
  else if (input.incomeSourceCount >= 2) complexityScore += 7;
  if (input.monthlyDocumentCount >= 50) complexityScore += 12;
  else if (input.monthlyDocumentCount >= 20) complexityScore += 7;
  if (input.hasEmployees) complexityScore += 20;
  if (input.paysFreelancers) complexityScore += 10;
  if (input.hasForeignTransactions) complexityScore += 22;
  if (input.sellsOnMarketplaces) complexityScore += 8;
  if (!input.hasEvidenceRoutine) complexityScore += 12;
  complexityScore = Math.min(100, complexityScore);

  const recommendation =
    complexityScore >= 58 || input.hasEmployees
      ? "tax_accountant"
      : complexityScore >= 28
        ? "review"
        : "self";

  const annualCalendar = [
    {
      key: "vat",
      label: "부가가치세",
      timing: input.vatStatus === "simplified" ? "매년 1월" : "통상 1월·7월",
      required: input.vatStatus !== "exempt",
    },
    {
      key: "income_tax",
      label: "종합소득세",
      timing: "매년 5월",
      required: true,
    },
    {
      key: "withholding",
      label: "원천세",
      timing: "지급월 다음 달 10일",
      required: input.hasEmployees || input.paysFreelancers,
    },
    {
      key: "payment_statements",
      label: "지급명세서",
      timing: "지급 유형별 법정 제출기한",
      required: input.hasEmployees || input.paysFreelancers,
    },
  ];
  const obligationCount = annualCalendar.filter((item) => item.required).length;

  const candidates = [
    {
      date: nextAnnualDate(5, 31, now),
      label: "종합소득세 기본 신고기한",
      required: true,
    },
    {
      date: nextVatDate(input.vatStatus, now),
      label: "부가가치세 기본 신고기한",
      required: input.vatStatus !== "exempt",
    },
    {
      date: nextMonthlyWithholdingDate(now),
      label: "원천세 기본 납부기한",
      required: input.hasEmployees || input.paysFreelancers,
    },
  ]
    .filter((item) => item.required)
    .sort((a, b) => a.date.localeCompare(b.date));

  const warnings: string[] = [];
  if (input.businessStatus !== "registered") {
    warnings.push("계속·반복적으로 수익이 발생한다면 사업자등록 필요 여부를 먼저 확인하세요.");
  }
  if (input.vatStatus === "unsure") {
    warnings.push("과세·면세·간이과세 여부에 따라 부가세 의무가 달라집니다.");
  }
  if (input.hasForeignTransactions) {
    warnings.push("해외 매출·매입은 영세율 증빙, 환율, 플랫폼 정산자료를 함께 확인해야 합니다.");
  }
  if (input.hasEmployees || input.paysFreelancers) {
    warnings.push("인건비 지급 시 원천세와 지급명세서 의무가 추가됩니다.");
  }

  return {
    complexityScore,
    recommendation,
    obligationCount,
    nextDeadline: candidates[0]?.date ?? nextAnnualDate(5, 31, now),
    nextDeadlineLabel: candidates[0]?.label ?? "종합소득세 기본 신고기한",
    annualCalendar,
    warnings,
  };
}
