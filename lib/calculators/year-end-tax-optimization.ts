import type { TaxCaseRecommendation } from "@/lib/tax-cases/guided-case-definitions";

export type PensionTaxpayerType = "employee" | "business" | "mixed";
export type PensionCashFlowStatus = "reserve_first" | "caution" | "ready";
export type PensionStrategy =
  | "reserve_cash"
  | "pension_first"
  | "irp_next"
  | "isa_transfer"
  | "complete";

export type YearEndTaxOptimizationInput = {
  taxpayerType: PensionTaxpayerType;
  annualSalaryWon: number;
  comprehensiveIncomeWon: number;
  pensionSavingsPaidWon: number;
  irpPaidWon: number;
  isaMaturityTransferWon: number;
  extraBudgetWon: number;
  emergencyFundMonths: number;
  needsMoneyWithinYear: boolean;
  hasCheckedContributionStatements: boolean;
  hasIncomeStatement: boolean;
};

export type YearEndTaxStrategyStep = {
  id: "reserve" | "pension" | "irp" | "isa";
  title: string;
  description: string;
  recommendedContributionWon: number;
  estimatedTaxReductionWon: number;
};

export type YearEndTaxOptimizationResult = {
  taxpayerType: PensionTaxpayerType;
  incomeBasisLabel: string;
  incomeBasisWon: number;
  nationalTaxCreditRatePct: number;
  estimatedEffectiveRatePct: number;
  currentPensionEligibleWon: number;
  currentCombinedEligibleWon: number;
  isaAdditionalLimitWon: number;
  totalCreditLimitWon: number;
  currentNationalTaxCreditWon: number;
  currentEstimatedTaxBenefitWon: number;
  recommendedPensionContributionWon: number;
  recommendedIrpContributionWon: number;
  optimizedCombinedEligibleWon: number;
  optimizedNationalTaxCreditWon: number;
  optimizedEstimatedTaxBenefitWon: number;
  additionalEstimatedTaxBenefitWon: number;
  yearlyContributionGapWon: number;
  cashFlowStatus: PensionCashFlowStatus;
  strategy: PensionStrategy;
  recommendation: TaxCaseRecommendation;
  complexityScore: number;
  filingPeriodLabel: string;
  filingDeadline: string;
  steps: YearEndTaxStrategyStep[];
  oneLineRecommendation: string;
  warnings: string[];
  assumptions: string[];
  ruleVersion: string;
};

export const PENSION_STRATEGY_RULE_VERSION = "pension-strategy-2026.1";
export const PENSION_SAVINGS_LIMIT_WON = 6_000_000;
export const PENSION_COMBINED_LIMIT_WON = 9_000_000;

function floorNonNegative(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function planningDeadline(referenceDate: Date): string {
  const year = referenceDate.getFullYear();
  return `${year}-12-20`;
}

export function calculateYearEndTaxOptimization(
  input: YearEndTaxOptimizationInput,
  referenceDate = new Date(),
): YearEndTaxOptimizationResult {
  const salary = floorNonNegative(input.annualSalaryWon);
  const comprehensiveIncome = floorNonNegative(input.comprehensiveIncomeWon);
  const pensionPaid = floorNonNegative(input.pensionSavingsPaidWon);
  const irpPaid = floorNonNegative(input.irpPaidWon);
  const isaTransfer = floorNonNegative(input.isaMaturityTransferWon);
  const extraBudget = floorNonNegative(input.extraBudgetWon);
  const emergencyFundMonths = Math.max(0, Number(input.emergencyFundMonths) || 0);

  const usesSalaryThreshold = input.taxpayerType === "employee";
  const incomeBasisWon = usesSalaryThreshold ? salary : comprehensiveIncome;
  const incomeBasisLabel = usesSalaryThreshold ? "총급여" : "종합소득금액";
  const lowerRateThresholdWon = usesSalaryThreshold ? 55_000_000 : 45_000_000;
  const nationalRate = incomeBasisWon <= lowerRateThresholdWon ? 0.15 : 0.12;
  const effectiveRate = nationalRate * 1.1;

  const pensionEligible = Math.min(pensionPaid, PENSION_SAVINGS_LIMIT_WON);
  const isaAdditionalLimitWon = Math.min(
    3_000_000,
    Math.floor(isaTransfer * 0.1),
  );
  const totalCreditLimitWon =
    PENSION_COMBINED_LIMIT_WON + isaAdditionalLimitWon;
  const currentCombinedEligibleWon = Math.min(
    totalCreditLimitWon,
    pensionEligible + irpPaid + isaTransfer,
  );

  const cashFlowStatus: PensionCashFlowStatus =
    input.needsMoneyWithinYear || emergencyFundMonths < 3
      ? "reserve_first"
      : emergencyFundMonths < 6
        ? "caution"
        : "ready";

  const allocatableBudget = cashFlowStatus === "reserve_first" ? 0 : extraBudget;
  const remainingCreditHeadroomWon = Math.max(
    0,
    totalCreditLimitWon - currentCombinedEligibleWon,
  );
  const pensionGap = Math.max(0, PENSION_SAVINGS_LIMIT_WON - pensionEligible);
  const recommendedPensionContributionWon = Math.min(
    allocatableBudget,
    pensionGap,
    remainingCreditHeadroomWon,
  );
  const remainingBudget = Math.max(
    0,
    allocatableBudget - recommendedPensionContributionWon,
  );
  const remainingCreditHeadroomAfterPensionWon = Math.max(
    0,
    remainingCreditHeadroomWon - recommendedPensionContributionWon,
  );
  const recommendedIrpContributionWon = Math.min(
    remainingBudget,
    remainingCreditHeadroomAfterPensionWon,
  );
  const optimizedCombinedEligibleWon = Math.min(
    totalCreditLimitWon,
    currentCombinedEligibleWon +
      recommendedPensionContributionWon +
      recommendedIrpContributionWon,
  );

  const currentNationalTaxCreditWon = Math.floor(
    currentCombinedEligibleWon * nationalRate,
  );
  const currentEstimatedTaxBenefitWon = Math.floor(
    currentCombinedEligibleWon * effectiveRate,
  );
  const optimizedNationalTaxCreditWon = Math.floor(
    optimizedCombinedEligibleWon * nationalRate,
  );
  const optimizedEstimatedTaxBenefitWon = Math.floor(
    optimizedCombinedEligibleWon * effectiveRate,
  );
  const additionalEstimatedTaxBenefitWon = Math.max(
    0,
    optimizedEstimatedTaxBenefitWon - currentEstimatedTaxBenefitWon,
  );
  const yearlyContributionGapWon = remainingCreditHeadroomWon;

  const steps: YearEndTaxStrategyStep[] = [];
  if (cashFlowStatus === "reserve_first") {
    steps.push({
      id: "reserve",
      title: "절세보다 비상자금이 먼저예요",
      description:
        "1년 안에 쓸 돈이 있거나 비상자금이 3개월 미만이면 추가 납입을 잠시 보류하세요.",
      recommendedContributionWon: 0,
      estimatedTaxReductionWon: 0,
    });
  } else {
    if (recommendedPensionContributionWon > 0) {
      steps.push({
        id: "pension",
        title: "연금저축 한도부터 채우기",
        description: "연금저축 세액공제 대상 600만원 한도까지 먼저 배분합니다.",
        recommendedContributionWon: recommendedPensionContributionWon,
        estimatedTaxReductionWon: Math.floor(
          recommendedPensionContributionWon * effectiveRate,
        ),
      });
    }
    if (recommendedIrpContributionWon > 0) {
      steps.push({
        id: "irp",
        title: "남은 금액은 IRP로 배분",
        description: "연금저축과 합산한 기본 세액공제 한도 900만원까지 배분합니다.",
        recommendedContributionWon: recommendedIrpContributionWon,
        estimatedTaxReductionWon: Math.floor(
          recommendedIrpContributionWon * effectiveRate,
        ),
      });
    }
  }
  if (isaTransfer > 0) {
    steps.push({
      id: "isa",
      title: "ISA 만기자금 전환 확인",
      description: `전환액의 10%인 ${isaAdditionalLimitWon.toLocaleString("ko-KR")}원까지 추가 세액공제 한도로 계산했어요.`,
      recommendedContributionWon: 0,
      estimatedTaxReductionWon: Math.floor(isaAdditionalLimitWon * effectiveRate),
    });
  }

  const strategy: PensionStrategy =
    cashFlowStatus === "reserve_first"
      ? "reserve_cash"
      : recommendedPensionContributionWon > 0
        ? "pension_first"
        : recommendedIrpContributionWon > 0
          ? "irp_next"
          : isaTransfer > 0
            ? "isa_transfer"
            : "complete";

  let complexityScore = 16;
  if (input.taxpayerType === "mixed") complexityScore += 20;
  if (input.taxpayerType === "business") complexityScore += 10;
  if (isaTransfer > 0) complexityScore += 12;
  if (!input.hasIncomeStatement) complexityScore += 12;
  if (!input.hasCheckedContributionStatements) complexityScore += 12;
  if (cashFlowStatus !== "ready") complexityScore += 10;
  complexityScore = Math.min(100, complexityScore);
  const recommendation: TaxCaseRecommendation =
    complexityScore >= 62 ? "tax_accountant" : complexityScore >= 34 ? "review" : "self";

  const warnings: string[] = [];
  if (cashFlowStatus === "reserve_first") {
    warnings.push(
      "연금계좌는 중도 인출 시 세금상 불이익이 생길 수 있어 단기 생활자금을 넣지 않는 편이 안전합니다.",
    );
  } else if (cashFlowStatus === "caution") {
    warnings.push("비상자금 6개월분을 확보한 뒤 추가 납입액을 확정하세요.");
  }
  if (pensionPaid > PENSION_SAVINGS_LIMIT_WON) {
    warnings.push("연금저축 납입액 중 600만원을 넘는 금액은 기본 세액공제 계산에서 제외했어요.");
  }
  if (input.taxpayerType === "mixed") {
    warnings.push("근로소득과 사업소득이 함께 있으면 종합소득금액 기준으로 최종 공제율을 확인하세요.");
  }

  const oneLineRecommendation =
    cashFlowStatus === "reserve_first"
      ? "지금은 추가 납입보다 비상자금을 확보하는 것이 우선입니다."
      : additionalEstimatedTaxBenefitWon > 0
        ? `추가 예산을 연금저축부터 배분하면 약 ${additionalEstimatedTaxBenefitWon.toLocaleString("ko-KR")}원의 세금 감소 효과를 기대할 수 있어요.`
        : "기본 세액공제 한도를 이미 활용 중이므로 납입확인서와 실제 결정세액을 확인하세요.";

  return {
    taxpayerType: input.taxpayerType,
    incomeBasisLabel,
    incomeBasisWon,
    nationalTaxCreditRatePct: nationalRate * 100,
    estimatedEffectiveRatePct: Number((effectiveRate * 100).toFixed(1)),
    currentPensionEligibleWon: pensionEligible,
    currentCombinedEligibleWon,
    isaAdditionalLimitWon,
    totalCreditLimitWon,
    currentNationalTaxCreditWon,
    currentEstimatedTaxBenefitWon,
    recommendedPensionContributionWon,
    recommendedIrpContributionWon,
    optimizedCombinedEligibleWon,
    optimizedNationalTaxCreditWon,
    optimizedEstimatedTaxBenefitWon,
    additionalEstimatedTaxBenefitWon,
    yearlyContributionGapWon,
    cashFlowStatus,
    strategy,
    recommendation,
    complexityScore,
    filingPeriodLabel: `${referenceDate.getFullYear()}년 연금계좌 납입 점검`,
    filingDeadline: planningDeadline(referenceDate),
    steps,
    oneLineRecommendation,
    warnings,
    assumptions: [
      "연금저축 600만원, 연금저축·IRP 합산 900만원을 기본 세액공제 대상 한도로 계산합니다.",
      "국세 세액공제율은 15% 또는 12%이며, 지방소득세 영향을 포함한 예상 체감효과는 16.5% 또는 13.2%로 구분해 표시합니다.",
      "실제 환급액은 결정세액, 다른 공제·감면, 금융회사 납입 마감시간에 따라 달라질 수 있습니다.",
      "12월 20일은 FindTax의 사전 점검 목표일이며 법정 신고기한이 아닙니다.",
    ],
    ruleVersion: PENSION_STRATEGY_RULE_VERSION,
  };
}
