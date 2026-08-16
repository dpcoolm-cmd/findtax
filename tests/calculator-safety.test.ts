import assert from "node:assert/strict";
import test from "node:test";

import {
  NATIONAL_PENSION_MONTHLY_CAP_WON,
  monthlySocialInsurance,
} from "../lib/calculators/social-insurance-2026.ts";
import { calculateVatFilingDecision } from "../lib/calculators/vat-filing-decision.ts";
import { calculateComprehensiveIncomeTax } from "../lib/calculators/comprehensive-income-tax.ts";
import { calculateVatFromGrossAmount, calculateVatFromSupplyAmount } from "../lib/calculators/vat.ts";
import { calculateGiftTaxDetailed } from "../lib/calculators/gift-tax.ts";
import { calculateAcquisitionTax } from "../lib/calculators/acquisition-tax.ts";
import { calculateCapitalGainsFull } from "../lib/calculators/capital-gains-estimate.ts";
import { calculateWeeklyHolidayPay } from "../lib/calculators/weekly-holiday-pay.ts";
import { calculateSeverancePay } from "../lib/calculators/severance-pay.ts";
import { calculateSideHustleTaxDiagnosis } from "../lib/calculators/side-hustle-tax.ts";
import { calculateAdvisorCostBenefit } from "../lib/calculators/advisor-cost-benefit.ts";
import { calculateVatReadiness } from "../lib/tax-cases/vat-readiness.ts";
import {
  deadlineBadge,
  deadlineDaysRemaining,
} from "../lib/tax-cases/deadlines.ts";
import {
  isBotUserAgent,
  isLikelyTestValue,
} from "../lib/traffic-quality.ts";
import {
  assessGiftCase,
  giftFilingDeadline,
} from "../lib/tax-cases/gift-case.ts";
import { assessSoloBusiness } from "../lib/tax-cases/solo-business-case.ts";
import { calculateYearEndTaxOptimization } from "../lib/calculators/year-end-tax-optimization.ts";
import { checkRequestRateLimit } from "../lib/request-security.ts";
import { assessSellerTax } from "../lib/tax-cases/seller-case.ts";
import {
  sellerCaseDocuments,
  sellerCaseTasks,
} from "../lib/tax-cases/guided-case-definitions.ts";
import { isAdEligiblePath } from "../lib/seo/ad-eligibility.ts";

test("광고는 콘텐츠 페이지에만 표시하고 전환·회원·정책 경로에서는 숨긴다", () => {
  assert.equal(isAdEligiblePath("/"), true);
  assert.equal(isAdEligiblePath("/blog/vat-guide"), true);
  assert.equal(isAdEligiblePath("/calculator/종합소득세"), true);
  assert.equal(isAdEligiblePath("/consult"), false);
  assert.equal(isAdEligiblePath("/consult/thank-you"), false);
  assert.equal(isAdEligiblePath("/case/example-token"), false);
  assert.equal(isAdEligiblePath("/privacy"), false);
  assert.equal(isAdEligiblePath("/admin/insights"), false);
});

test("2026년 7월 국민연금 근로자 부담률 4.75%를 적용한다", () => {
  const result = monthlySocialInsurance({ monthlySalaryWon: 3_000_000, role: "employee" });

  assert.equal(result.nationalPension, 142_500);
  assert.equal(result.health, 107_850);
  assert.equal(result.employment, 27_000);
});

test("국민연금 상한은 건강보험과 고용보험 산정 기준을 제한하지 않는다", () => {
  const result = monthlySocialInsurance({ monthlySalaryWon: 10_000_000, role: "employee" });

  assert.equal(result.contributionBaseWon, NATIONAL_PENSION_MONTHLY_CAP_WON);
  assert.equal(result.nationalPension, 313_025);
  assert.equal(result.health, 359_500);
  assert.equal(result.employment, 90_000);
  assert.equal(result.salaryCapped, true);
});

test("단순한 간이과세 자료는 확정 판정 대신 낮은 복잡도로 안내한다", () => {
  const result = calculateVatFilingDecision({
    taxpayerType: "simplified",
    annualRevenueWon: 30_000_000,
    monthlySalesDocs: 5,
    monthlyPurchaseDocs: 2,
    hasEmployees: false,
    hasPaperOrCashData: false,
    hasOnlineMarketplace: false,
    hasCrossBorderSales: false,
    isNearDeadline: false,
  });

  assert.equal(result.recommendation, "self");
  assert.equal(result.title, "신고 자료 구조가 비교적 단순합니다");
});

test("해외 판매와 다량 증빙은 전문가 검토 필요성이 높은 것으로 안내한다", () => {
  const result = calculateVatFilingDecision({
    taxpayerType: "general",
    annualRevenueWon: 150_000_000,
    monthlySalesDocs: 60,
    monthlyPurchaseDocs: 30,
    hasEmployees: true,
    hasPaperOrCashData: true,
    hasOnlineMarketplace: true,
    hasCrossBorderSales: true,
    isNearDeadline: true,
  });

  assert.equal(result.recommendation, "tax_accountant");
  assert.equal(result.title, "전문가 검토 필요성이 높은 편입니다");
});

test("부가세 준비도는 완료한 항목의 고정 가중치만 합산한다", () => {
  const result = calculateVatReadiness({
    sales: "ready",
    purchases: "not_ready",
    exceptions: "ready",
    deadline: "unsure",
  });

  assert.equal(result.score, 55);
  assert.equal(result.status, "preparing");
  assert.equal(result.nextAction?.key, "purchases");
});

test("부가세 준비 항목을 모두 완료하면 신고 준비 상태가 된다", () => {
  const result = calculateVatReadiness({
    sales: "ready",
    purchases: "ready",
    exceptions: "ready",
    deadline: "ready",
  });

  assert.equal(result.score, 100);
  assert.equal(result.status, "ready");
  assert.equal(result.nextAction, null);
});

test("부가세 신고기한 D-Day를 날짜 경계에서 일관되게 계산한다", () => {
  const today = new Date(2026, 6, 24);
  assert.equal(deadlineDaysRemaining("2026-07-27", today), 3);
  assert.equal(deadlineBadge(3), "D-3");
  assert.equal(deadlineBadge(0), "D-Day");
  assert.equal(deadlineBadge(-2), "2일 지남");
});

test("종합소득세 누진세율은 구간 경계에서 세액이 역전되지 않는다", () => {
  assert.equal(calculateComprehensiveIncomeTax(-1), 0);
  assert.equal(calculateComprehensiveIncomeTax(14_000_000), 840_000);
  assert.equal(calculateComprehensiveIncomeTax(14_000_001), 840_000);
  assert.equal(calculateComprehensiveIncomeTax(50_000_000), 6_240_000);
  assert.equal(calculateComprehensiveIncomeTax(50_000_001), 6_240_000);
});

test("부가세 공급가액 계산과 세포함 역산이 일관된다", () => {
  assert.deepEqual(calculateVatFromSupplyAmount(1_000_000), {
    supplyAmount: 1_000_000,
    vat: 100_000,
    grossTotal: 1_100_000,
  });
  assert.deepEqual(calculateVatFromGrossAmount(1_100_000), {
    grossTotal: 1_100_000,
    vat: 100_000,
    supplyAmount: 1_000_000,
  });
  assert.equal(calculateVatFromGrossAmount(-100).grossTotal, 0);
});

test("배우자 증여공제 6억원을 적용한다", () => {
  const result = calculateGiftTaxDetailed({
    giftValueWon: 700_000_000,
    adjustmentWon: 0,
    relation: "spouse",
    isGenerationSkipping: false,
    isResident: true,
  });
  assert.equal(result.relationDeductionWon, 600_000_000);
  assert.equal(result.taxableBaseWon, 100_000_000);
  assert.equal(result.finalGiftTaxWon, 10_000_000);
});

test("세대생략 증여는 산출세액의 30%를 가산한다", () => {
  const result = calculateGiftTaxDetailed({
    giftValueWon: 200_000_000,
    adjustmentWon: 0,
    relation: "lineal_descendant",
    isGenerationSkipping: true,
    isResident: true,
  });
  assert.equal(result.baseGiftTaxWon, 20_000_000);
  assert.equal(result.generationSkippingSurchargeWon, 6_000_000);
  assert.equal(result.finalGiftTaxWon, 26_000_000);
});

test("1주택 7억5천만원 취득세율은 중간구간 2%다", () => {
  const result = calculateAcquisitionTax({ priceWon: 750_000_000, homeType: "one", zone: "normal" });
  assert.equal(result.rate, 0.02);
  assert.equal(result.acquisitionTax, 15_000_000);
  assert.equal(result.localEducationTax, 1_500_000);
});

test("1세대 1주택 체크만으로는 양도세 비과세를 적용하지 않는다", () => {
  const result = calculateCapitalGainsFull({
    acquisitionDate: "2020-01-01",
    transferDate: "2026-01-02",
    assetType: "house",
    transferPriceWon: 1_000_000_000,
    acquisitionCostWon: 600_000_000,
    necessaryExpenseWon: 20_000_000,
    isOneHouseholdOneHome: true,
    hasVerifiedExemptionRequirements: false,
    isUnregistered: false,
    isMultiHome: false,
    isAdjustmentZone: false,
    isInherited: false,
  });
  assert.ok(result);
  assert.equal(result.isExempt, false);
  assert.ok(result.limitations.some((line) => line.includes("비과세를 반영하지 않았습니다")));
});

test("비과세 요건을 별도 확인한 12억원 이하 1주택만 0원 처리한다", () => {
  const result = calculateCapitalGainsFull({
    acquisitionDate: "2020-01-01",
    transferDate: "2026-01-02",
    assetType: "house",
    transferPriceWon: 1_000_000_000,
    acquisitionCostWon: 600_000_000,
    necessaryExpenseWon: 20_000_000,
    isOneHouseholdOneHome: true,
    hasVerifiedExemptionRequirements: true,
    isUnregistered: false,
    isMultiHome: false,
    isAdjustmentZone: false,
    isInherited: false,
  });
  assert.ok(result);
  assert.equal(result.isExempt, true);
  assert.equal(result.finalTaxWon, 0);
});

test("주 15시간 경계에서만 주휴수당이 발생한다", () => {
  assert.equal(calculateWeeklyHolidayPay({ hourlyWon: 10_000, weeklyWorkHours: 14.9, weeklyWorkDays: 5 }).qualifies, false);
  const result = calculateWeeklyHolidayPay({ hourlyWon: 10_000, weeklyWorkHours: 15, weeklyWorkDays: 5 });
  assert.equal(result.qualifies, true);
  assert.equal(result.weeklyHolidayPay, 30_000);
});

test("퇴직금 계산은 잘못된 날짜를 거부하고 평균임금 산식을 보존한다", () => {
  assert.equal(calculateSeverancePay({ hireYmd: "2026-02-30", resignYmd: "2026-12-31", lastThreeMonthsSalaryTotal: 9_000_000 }), null);
  const result = calculateSeverancePay({ hireYmd: "2025-01-01", resignYmd: "2025-12-31", lastThreeMonthsSalaryTotal: 9_000_000 });
  assert.ok(result);
  assert.equal(result.serviceDays, 365);
  assert.equal(result.netAfterTax, result.severanceGross - result.estimatedIncomeTax);
});

test("고매출 무등록 부업은 높은 위험으로 분류한다", () => {
  const result = calculateSideHustleTaxDiagnosis({
    employmentType: "employee",
    annualSalaryWon: 50_000_000,
    monthlySideRevenueWon: 5_000_000,
    annualExtraRevenueWon: 0,
    annualExpenseWon: 5_000_000,
    withholdingType: "no",
    businessStatus: "not_registered",
    vatStatus: "taxable_sales",
  });
  assert.equal(result.annualRevenueWon, 60_000_000);
  assert.equal(result.riskLevel, "high");
});

test("세무사 비용 판단은 시간·공제·가산세 기대값을 모두 합산한다", () => {
  const result = calculateAdvisorCostBenefit({
    advisorFeeWon: 300_000,
    missedDeductionWon: 2_000_000,
    taxRatePercent: 20,
    penaltyRiskWon: 100_000,
    timeHours: 5,
    hourlyValueWon: 30_000,
  });
  assert.equal(result.estimatedBenefitWon, 650_000);
  assert.equal(result.netBenefitWon, 350_000);
  assert.equal(result.recommendation, "advisor");
});

test("관리자 집계에서 봇과 명시적 테스트 트래픽을 제외한다", () => {
  assert.equal(isBotUserAgent("Mozilla/5.0 Googlebot/2.1"), true);
  assert.equal(isBotUserAgent("Mozilla/5.0 Chrome/140 Safari/537.36"), false);
  assert.equal(isLikelyTestValue("/codex-stage5-funnel-test"), true);
  assert.equal(isLikelyTestValue("api-test-final"), true);
  assert.equal(isLikelyTestValue("/calculator/부가세"), false);
});

test("미성년 자녀 증여는 10년 2천만원 한도와 월말 기준 3개월 신고기한을 계산한다", () => {
  const result = assessGiftCase({
    giftValueWon: 15_000_000,
    priorTenYearGiftsWon: 8_000_000,
    relation: "lineal_descendant",
    recipientIsMinor: true,
    giftDate: "2026-07-15",
    assetType: "cash",
    isGenerationSkipping: false,
    isResident: true,
    knowsPriorGifts: true,
    hasTransferEvidence: true,
    hasRelationshipDocument: true,
    hasValuationEvidence: true,
  });
  assert.equal(result.deductionLimitWon, 20_000_000);
  assert.equal(result.remainingBeforeGiftWon, 12_000_000);
  assert.equal(result.amountOverRemainingLimitWon, 3_000_000);
  assert.equal(result.filingDeadline, "2026-10-31");
});

test("증여일 신고기한 계산은 윤년과 잘못된 날짜를 구분한다", () => {
  assert.equal(giftFilingDeadline("2024-02-29"), "2024-05-31");
  assert.equal(giftFilingDeadline("2026-02-29"), "");
});

test("직원과 해외거래가 있는 1인사업자는 전문가 관리 권장으로 분류한다", () => {
  const result = assessSoloBusiness(
    {
      businessStatus: "registered",
      vatStatus: "general",
      annualRevenueWon: 120_000_000,
      incomeSourceCount: 3,
      monthlyDocumentCount: 60,
      hasEmployees: true,
      paysFreelancers: true,
      hasForeignTransactions: true,
      sellsOnMarketplaces: true,
      hasBookkeeping: false,
      hasEvidenceRoutine: false,
      hasTaxCalendar: false,
    },
    new Date("2026-07-24T00:00:00.000Z"),
  );
  assert.equal(result.recommendation, "tax_accountant");
  assert.equal(result.obligationCount, 4);
  assert.equal(result.nextDeadline, "2026-07-27");
});

test("직원 없는 단순 면세 1인사업자는 필요한 의무만 남긴다", () => {
  const result = assessSoloBusiness(
    {
      businessStatus: "registered",
      vatStatus: "exempt",
      annualRevenueWon: 20_000_000,
      incomeSourceCount: 1,
      monthlyDocumentCount: 5,
      hasEmployees: false,
      paysFreelancers: false,
      hasForeignTransactions: false,
      sellsOnMarketplaces: false,
      hasBookkeeping: false,
      hasEvidenceRoutine: true,
      hasTaxCalendar: true,
    },
    new Date("2026-07-24T00:00:00.000Z"),
  );
  assert.equal(result.recommendation, "self");
  assert.equal(result.obligationCount, 1);
  assert.equal(result.nextDeadline, "2027-05-31");
});

test("총급여 5,500만원 이하 직장인은 국세 15%, 지방세 포함 16.5%로 계산한다", () => {
  const result = calculateYearEndTaxOptimization(
    {
      taxpayerType: "employee",
      annualSalaryWon: 50_000_000,
      comprehensiveIncomeWon: 0,
      pensionSavingsPaidWon: 2_000_000,
      irpPaidWon: 0,
      isaMaturityTransferWon: 0,
      extraBudgetWon: 7_000_000,
      emergencyFundMonths: 6,
      needsMoneyWithinYear: false,
      hasCheckedContributionStatements: true,
      hasIncomeStatement: true,
    },
    new Date("2026-07-24T00:00:00.000Z"),
  );
  assert.equal(result.nationalTaxCreditRatePct, 15);
  assert.equal(result.estimatedEffectiveRatePct, 16.5);
  assert.equal(result.recommendedPensionContributionWon, 4_000_000);
  assert.equal(result.recommendedIrpContributionWon, 3_000_000);
  assert.equal(result.optimizedEstimatedTaxBenefitWon, 1_485_000);
});

test("사업자와 혼합소득자는 종합소득금액 4,500만원 기준을 사용한다", () => {
  const result = calculateYearEndTaxOptimization({
    taxpayerType: "mixed",
    annualSalaryWon: 30_000_000,
    comprehensiveIncomeWon: 46_000_000,
    pensionSavingsPaidWon: 0,
    irpPaidWon: 0,
    isaMaturityTransferWon: 0,
    extraBudgetWon: 1_000_000,
    emergencyFundMonths: 6,
    needsMoneyWithinYear: false,
    hasCheckedContributionStatements: false,
    hasIncomeStatement: true,
  });
  assert.equal(result.incomeBasisLabel, "종합소득금액");
  assert.equal(result.nationalTaxCreditRatePct, 12);
  assert.equal(result.estimatedEffectiveRatePct, 13.2);
});

test("단기 사용 예정 자금이 있으면 절세 납입을 권하지 않는다", () => {
  const result = calculateYearEndTaxOptimization({
    taxpayerType: "employee",
    annualSalaryWon: 40_000_000,
    comprehensiveIncomeWon: 0,
    pensionSavingsPaidWon: 0,
    irpPaidWon: 0,
    isaMaturityTransferWon: 0,
    extraBudgetWon: 9_000_000,
    emergencyFundMonths: 1,
    needsMoneyWithinYear: true,
    hasCheckedContributionStatements: false,
    hasIncomeStatement: false,
  });
  assert.equal(result.cashFlowStatus, "reserve_first");
  assert.equal(result.recommendedPensionContributionWon, 0);
  assert.equal(result.recommendedIrpContributionWon, 0);
  assert.equal(result.strategy, "reserve_cash");
});

test("ISA 만기자금 전환은 전환액 10%, 최대 300만원 추가한도를 적용한다", () => {
  const result = calculateYearEndTaxOptimization({
    taxpayerType: "employee",
    annualSalaryWon: 70_000_000,
    comprehensiveIncomeWon: 0,
    pensionSavingsPaidWon: 6_000_000,
    irpPaidWon: 3_000_000,
    isaMaturityTransferWon: 30_000_000,
    extraBudgetWon: 0,
    emergencyFundMonths: 6,
    needsMoneyWithinYear: false,
    hasCheckedContributionStatements: true,
    hasIncomeStatement: true,
  });
  assert.equal(result.isaAdditionalLimitWon, 3_000_000);
  assert.equal(result.totalCreditLimitWon, 12_000_000);
  assert.equal(result.currentCombinedEligibleWon, 12_000_000);
});

test("ISA 전환으로 공제 한도를 채웠으면 추가 연금·IRP 납입을 권하지 않는다", () => {
  const result = calculateYearEndTaxOptimization({
    taxpayerType: "employee",
    annualSalaryWon: 50_000_000,
    comprehensiveIncomeWon: 0,
    pensionSavingsPaidWon: 0,
    irpPaidWon: 0,
    isaMaturityTransferWon: 30_000_000,
    extraBudgetWon: 9_000_000,
    emergencyFundMonths: 6,
    needsMoneyWithinYear: false,
    hasCheckedContributionStatements: true,
    hasIncomeStatement: true,
  });

  assert.equal(result.currentCombinedEligibleWon, 12_000_000);
  assert.equal(result.yearlyContributionGapWon, 0);
  assert.equal(result.recommendedPensionContributionWon, 0);
  assert.equal(result.recommendedIrpContributionWon, 0);
  assert.equal(result.additionalEstimatedTaxBenefitWon, 0);
  assert.equal(
    result.steps
      .filter((step) => step.recommendedContributionWon > 0)
      .reduce((sum, step) => sum + step.estimatedTaxReductionWon, 0),
    result.additionalEstimatedTaxBenefitWon,
  );
});

test("ISA 전환 후 남은 공제 한도 안에서만 추가 납입을 배분한다", () => {
  const result = calculateYearEndTaxOptimization({
    taxpayerType: "employee",
    annualSalaryWon: 50_000_000,
    comprehensiveIncomeWon: 0,
    pensionSavingsPaidWon: 2_000_000,
    irpPaidWon: 0,
    isaMaturityTransferWon: 5_000_000,
    extraBudgetWon: 9_000_000,
    emergencyFundMonths: 6,
    needsMoneyWithinYear: false,
    hasCheckedContributionStatements: true,
    hasIncomeStatement: true,
  });

  assert.equal(result.totalCreditLimitWon, 9_500_000);
  assert.equal(result.currentCombinedEligibleWon, 7_000_000);
  assert.equal(result.yearlyContributionGapWon, 2_500_000);
  assert.equal(result.recommendedPensionContributionWon, 2_500_000);
  assert.equal(result.recommendedIrpContributionWon, 0);
  assert.equal(
    result.steps
      .filter((step) => step.recommendedContributionWon > 0)
      .reduce((sum, step) => sum + step.estimatedTaxReductionWon, 0),
    result.additionalEstimatedTaxBenefitWon,
  );
});

test("세금 케이스 생성 요청은 같은 주소의 과도한 반복을 제한한다", () => {
  const request = new Request("https://findtax.kr/api/tax-cases/pension", {
    headers: { "x-forwarded-for": "192.0.2.123" },
  });
  const scope = `tax-case-test-${Date.now()}`;

  assert.equal(checkRequestRateLimit(request, scope, 2, 60_000).allowed, true);
  assert.equal(checkRequestRateLimit(request, scope, 2, 60_000).allowed, true);
  const blocked = checkRequestRateLimit(request, scope, 2, 60_000);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);
});

test("역직구 셀러의 수출증빙 누락은 전문가 검토로 분류한다", () => {
  const input = {
    profile: "reverse_export" as const,
    businessStatus: "registered" as const,
    vatStatus: "general" as const,
    annualRevenueWon: 80_000_000,
    monthlyOrderCount: 180,
    platformCount: 2,
    settlementCurrencyCount: 2,
    hasEmployees: false,
    usesFulfillmentAbroad: true,
    hasExportEvidence: false,
    grossSalesSeparated: false,
    hasMonthlySettlementRoutine: false,
    hasExpenseEvidence: true,
  };
  const result = assessSellerTax(
    input,
    new Date("2026-07-25T00:00:00.000Z"),
  );

  assert.equal(result.recommendation, "tax_accountant");
  assert.ok(result.evidenceGaps.includes("수출·배송·외화입금 증빙"));
  assert.ok(result.obligations.some((item) => item.key === "zero_rate" && item.required));
});

test("단순 국내 온라인 셀러는 월 정산 루틴을 갖추면 직접 관리 가능성이 높다", () => {
  const result = assessSellerTax(
    {
      profile: "smartstore",
      businessStatus: "registered",
      vatStatus: "simplified",
      annualRevenueWon: 18_000_000,
      monthlyOrderCount: 30,
      platformCount: 1,
      settlementCurrencyCount: 1,
      hasEmployees: false,
      usesFulfillmentAbroad: false,
      hasExportEvidence: false,
      grossSalesSeparated: true,
      hasMonthlySettlementRoutine: true,
      hasExpenseEvidence: true,
    },
    new Date("2026-07-25T00:00:00.000Z"),
  );

  assert.equal(result.recommendation, "self");
  assert.equal(result.evidenceGaps.length, 0);
});

test("셀러 운영표 준비도 가중치는 정확히 100이고 필요한 문서만 만든다", () => {
  const input = {
    profile: "purchase_agency" as const,
    businessStatus: "registered" as const,
    vatStatus: "general" as const,
    annualRevenueWon: 40_000_000,
    monthlyOrderCount: 70,
    platformCount: 2,
    settlementCurrencyCount: 2,
    hasEmployees: false,
    usesFulfillmentAbroad: false,
    hasExportEvidence: false,
    grossSalesSeparated: true,
    hasMonthlySettlementRoutine: true,
    hasExpenseEvidence: true,
  };

  assert.equal(
    sellerCaseTasks(input).reduce((sum, task) => sum + task.weight, 0),
    100,
  );
  assert.ok(
    sellerCaseDocuments(input).some(
      (document) => document.key === "agency_contracts",
    ),
  );
});
