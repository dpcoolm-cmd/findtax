import { calculateComprehensiveIncomeTax } from "./comprehensive-income-tax.ts";

export type SideHustleEmploymentType = "employee" | "self_employed" | "none";
export type SideHustleWithholdingType = "yes" | "no" | "mixed";
export type SideHustleBusinessStatus = "registered" | "not_registered" | "unsure";
export type SideHustleVatStatus = "taxable_sales" | "mostly_exempt_or_foreign" | "unsure";

export type SideHustleTaxInput = {
  employmentType: SideHustleEmploymentType;
  annualSalaryWon: number;
  monthlySideRevenueWon: number;
  annualExtraRevenueWon: number;
  annualExpenseWon: number;
  withholdingType: SideHustleWithholdingType;
  businessStatus: SideHustleBusinessStatus;
  vatStatus: SideHustleVatStatus;
};

export type SideHustleRiskLevel = "low" | "mid" | "high";

export type SideHustleTaxResult = {
  annualRevenueWon: number;
  annualProfitWon: number;
  estimatedWithholdingWon: number;
  sideOnlyIncomeTaxWon: number;
  standaloneSettlementWon: number;
  riskLevel: SideHustleRiskLevel;
  score: number;
  riskReasons: string[];
  nextActions: string[];
};

function clampWon(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export function calculateSideHustleTaxDiagnosis(
  input: SideHustleTaxInput,
): SideHustleTaxResult {
  const monthlyRevenue = clampWon(input.monthlySideRevenueWon);
  const annualRevenue = monthlyRevenue * 12 + clampWon(input.annualExtraRevenueWon);
  const annualExpense = clampWon(input.annualExpenseWon);
  const annualProfit = Math.max(0, annualRevenue - annualExpense);

  const estimatedWithholding =
    input.withholdingType === "yes"
      ? Math.floor(annualRevenue * 0.033)
      : input.withholdingType === "mixed"
        ? Math.floor(annualRevenue * 0.0165)
        : 0;

  const sideOnlyIncomeTax = calculateComprehensiveIncomeTax(annualProfit);
  const standaloneSettlement = Math.max(0, sideOnlyIncomeTax - estimatedWithholding);

  let score = 0;
  const riskReasons: string[] = [];
  const nextActions: string[] = [];

  if (annualProfit >= 24_000_000) {
    score += 35;
    riskReasons.push("부업 이익이 연 2,400만원 이상이라 종합소득세 부담과 신고 리스크가 커질 수 있습니다.");
  } else if (annualProfit >= 7_500_000) {
    score += 22;
    riskReasons.push("부업 이익이 연 750만원 이상이라 공제·비용 정리가 결과에 영향을 줄 수 있습니다.");
  } else if (annualProfit > 0) {
    score += 10;
    riskReasons.push("부업 이익이 발생해 종합소득세 신고 대상 여부를 확인해야 합니다.");
  }

  if (input.employmentType === "employee" && annualProfit > 0) {
    score += 16;
    riskReasons.push("근로소득과 부업 소득이 합산되면 실제 세율 구간이 달라질 수 있습니다.");
  }

  if (input.withholdingType === "no" && annualProfit >= 3_000_000) {
    score += 14;
    riskReasons.push("원천징수가 없으면 신고 시 한 번에 납부할 세액이 생길 수 있습니다.");
  }

  if (annualRevenue >= 48_000_000) {
    score += 24;
    riskReasons.push("연 매출이 4,800만원 이상이면 부가세·사업자 유형 검토가 필요합니다.");
  } else if (annualRevenue >= 24_000_000) {
    score += 12;
    riskReasons.push("연 매출이 커지고 있어 부가세 신고 대상과 매입자료 관리를 미리 확인하는 편이 좋습니다.");
  }

  if (input.businessStatus !== "registered" && annualRevenue >= 12_000_000) {
    score += 12;
    riskReasons.push("반복 매출이 있는데 사업자등록 상태가 불명확하면 신고 방식 판단이 어려워질 수 있습니다.");
  }

  if (input.vatStatus === "taxable_sales" && annualRevenue >= 12_000_000) {
    score += 10;
    riskReasons.push("과세 매출이 있다면 부가세 신고와 매입세액공제 가능성을 함께 봐야 합니다.");
  }

  if (annualExpense === 0 && annualRevenue >= 6_000_000) {
    score += 8;
    riskReasons.push("수입은 있는데 비용 입력이 없어 실제보다 세금이 크게 보일 수 있습니다.");
  }

  const riskLevel: SideHustleRiskLevel = score >= 55 ? "high" : score >= 28 ? "mid" : "low";

  if (annualProfit > 0) {
    nextActions.push("부업 수입과 비용을 월별로 정리하고, 원천징수 내역을 따로 보관하세요.");
  }
  if (input.employmentType === "employee") {
    nextActions.push("근로소득 원천징수영수증과 부업 수익 자료를 함께 놓고 종합소득세를 확인하세요.");
  }
  if (annualRevenue >= 24_000_000 || input.vatStatus === "taxable_sales") {
    nextActions.push("부가세 신고 대상 여부와 매입자료 공제 가능성을 점검하세요.");
  }
  if (annualProfit >= 7_500_000 || input.businessStatus !== "registered") {
    nextActions.push("사업자등록, 비용처리, 신고 유형은 세무사에게 한 번 확인하는 것이 좋습니다.");
  }

  return {
    annualRevenueWon: annualRevenue,
    annualProfitWon: annualProfit,
    estimatedWithholdingWon: estimatedWithholding,
    sideOnlyIncomeTaxWon: sideOnlyIncomeTax,
    standaloneSettlementWon: standaloneSettlement,
    riskLevel,
    score,
    riskReasons,
    nextActions,
  };
}
