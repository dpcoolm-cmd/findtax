import {
  calculateGiftTaxDetailed,
  type GiftRecipientRelation,
} from "@/lib/calculators/gift-tax";

export type InheritanceGiftStrategyInput = {
  totalAssetWon: number;
  plannedGiftNowWon: number;
  annualGrowthRatePct: number;
  yearsUntilInheritance: number;
  hasSpouse: boolean;
  childCount: number;
  adjustmentWon: number;
};

export type StrategyScenarioId =
  | "inherit_only"
  | "gift_to_spouse"
  | "gift_to_children";

export type InheritanceGiftScenario = {
  id: StrategyScenarioId;
  title: string;
  totalTaxWon: number;
  giftTaxWon: number;
  inheritanceTaxWon: number;
  futureAssetWon: number;
  note: string;
};

export type InheritanceGiftStrategyResult = {
  futureAssetIfUntouchedWon: number;
  currentGiftAmountWon: number;
  bestScenarioId: StrategyScenarioId;
  bestScenario: InheritanceGiftScenario;
  scenarios: InheritanceGiftScenario[];
  summary: string;
  comparisonSummary: string;
  warnings: string[];
  assumptions: string[];
  limitations: string[];
};

const INHERITANCE_BLANKET_DEDUCTION_WON = 500_000_000;
const MIN_SPOUSE_DEDUCTION_WON = 500_000_000;
const MAX_SPOUSE_DEDUCTION_WON = 3_000_000_000;

const INHERITANCE_TAX_BRACKETS = [
  { upper: 100_000_000, rate: 0.1, deduction: 0 },
  { upper: 500_000_000, rate: 0.2, deduction: 10_000_000 },
  { upper: 1_000_000_000, rate: 0.3, deduction: 60_000_000 },
  { upper: 3_000_000_000, rate: 0.4, deduction: 160_000_000 },
  { upper: Number.POSITIVE_INFINITY, rate: 0.5, deduction: 460_000_000 },
] as const;

function floorNonNegative(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function calculateInheritanceTax(taxBaseWon: number): number {
  const taxable = floorNonNegative(taxBaseWon);
  for (const bracket of INHERITANCE_TAX_BRACKETS) {
    if (taxable <= bracket.upper) {
      return Math.max(0, Math.floor(taxable * bracket.rate - bracket.deduction));
    }
  }
  return 0;
}

function getSpouseLegalShareRatio(hasSpouse: boolean, childCount: number): number {
  if (!hasSpouse) return 0;
  if (childCount <= 0) return 1;
  return 1.5 / (1.5 + childCount);
}

function calculateSpouseDeduction(
  estateForDistributionWon: number,
  hasSpouse: boolean,
  childCount: number,
): number {
  if (!hasSpouse) return 0;
  const spouseShareWon = Math.floor(
    estateForDistributionWon * getSpouseLegalShareRatio(hasSpouse, childCount),
  );
  return Math.min(
    MAX_SPOUSE_DEDUCTION_WON,
    Math.max(MIN_SPOUSE_DEDUCTION_WON, spouseShareWon),
  );
}

function growthAmount(baseWon: number, annualGrowthRatePct: number, years: number): number {
  const base = floorNonNegative(baseWon);
  const rate = Number.isFinite(annualGrowthRatePct) ? annualGrowthRatePct / 100 : 0;
  const y = Math.max(0, Math.floor(years));
  return Math.floor(base * Math.pow(1 + rate, y));
}

function relationDeductionInput(
  relation: GiftRecipientRelation,
  adjustmentWon: number,
  giftValueWon: number,
): number {
  return Math.min(floorNonNegative(adjustmentWon), floorNonNegative(giftValueWon));
}

function buildGiftScenario({
  title,
  giftValueWon,
  relation,
  isGenerationSkipping = false,
  hasSpouse,
  childCount,
  adjustmentWon,
  futureRemainingAssetWon,
  yearsUntilInheritance,
}: {
  title: string;
  giftValueWon: number;
  relation: GiftRecipientRelation;
  isGenerationSkipping?: boolean;
  hasSpouse: boolean;
  childCount: number;
  adjustmentWon: number;
  futureRemainingAssetWon: number;
  yearsUntilInheritance: number;
}): InheritanceGiftScenario {
  const currentGiftWon = floorNonNegative(giftValueWon);
  const currentGiftTax = calculateGiftTaxDetailed({
    giftValueWon: currentGiftWon,
    adjustmentWon: relationDeductionInput(relation, adjustmentWon, currentGiftWon),
    relation,
    isGenerationSkipping,
    isResident: true,
  }).finalGiftTaxWon;

  const addedBackGiftWon = yearsUntilInheritance <= 10 ? currentGiftWon : 0;
  const inheritanceBaseAssetWon = futureRemainingAssetWon + addedBackGiftWon;
  const spouseDeductionWon = calculateSpouseDeduction(
    inheritanceBaseAssetWon,
    hasSpouse,
    childCount,
  );
  const inheritanceTaxBaseWon = Math.max(
    0,
    inheritanceBaseAssetWon -
      INHERITANCE_BLANKET_DEDUCTION_WON -
      spouseDeductionWon,
  );
  const grossInheritanceTaxWon = calculateInheritanceTax(inheritanceTaxBaseWon);
  const inheritanceTaxAfterCreditWon =
    yearsUntilInheritance <= 10
      ? Math.max(0, grossInheritanceTaxWon - currentGiftTax)
      : grossInheritanceTaxWon;
  const totalTaxWon = currentGiftTax + inheritanceTaxAfterCreditWon;

  return {
    id:
      relation === "spouse" ? "gift_to_spouse" : "gift_to_children",
    title,
    totalTaxWon,
    giftTaxWon: currentGiftTax,
    inheritanceTaxWon: inheritanceTaxAfterCreditWon,
    futureAssetWon: futureRemainingAssetWon,
    note:
      yearsUntilInheritance <= 10
        ? "10년 이내 상속으로 가정해 현재 증여분을 상속세 계산에 다시 더해 보수적으로 비교했어요."
        : "10년 이후 상속으로 가정해 현재 증여분은 상속재산 합산에서 제외되는 쪽으로 계산했어요.",
  };
}

export function calculateInheritanceGiftStrategy(
  input: InheritanceGiftStrategyInput,
): InheritanceGiftStrategyResult {
  const totalAssetWon = floorNonNegative(input.totalAssetWon);
  const plannedGiftNowWon = Math.min(
    totalAssetWon,
    floorNonNegative(input.plannedGiftNowWon),
  );
  const annualGrowthRatePct = Number.isFinite(input.annualGrowthRatePct)
    ? input.annualGrowthRatePct
    : 0;
  const yearsUntilInheritance = Math.max(0, Math.floor(input.yearsUntilInheritance));
  const childCount = Math.max(0, Math.floor(input.childCount));
  const adjustmentWon = floorNonNegative(input.adjustmentWon);

  const futureAssetIfUntouchedWon = growthAmount(
    totalAssetWon,
    annualGrowthRatePct,
    yearsUntilInheritance,
  );
  const spouseDeductionWon = calculateSpouseDeduction(
    futureAssetIfUntouchedWon,
    input.hasSpouse,
    childCount,
  );
  const inheritOnlyTaxBaseWon = Math.max(
    0,
    futureAssetIfUntouchedWon -
      INHERITANCE_BLANKET_DEDUCTION_WON -
      spouseDeductionWon,
  );
  const inheritOnlyTaxWon = calculateInheritanceTax(inheritOnlyTaxBaseWon);

  const scenarios: InheritanceGiftScenario[] = [
    {
      id: "inherit_only",
      title: "지금 증여하지 않고 상속",
      totalTaxWon: inheritOnlyTaxWon,
      giftTaxWon: 0,
      inheritanceTaxWon: inheritOnlyTaxWon,
      futureAssetWon: futureAssetIfUntouchedWon,
      note:
        "현재 자산이 그대로 연평균 성장한다고 가정한 뒤, 일괄공제와 배우자공제를 단순 반영했어요.",
    },
  ];

  if (plannedGiftNowWon > 0 && input.hasSpouse) {
    scenarios.push(
      buildGiftScenario({
        title: "지금 배우자에게 일부 증여",
        giftValueWon: plannedGiftNowWon,
        relation: "spouse",
        hasSpouse: input.hasSpouse,
        childCount,
        adjustmentWon,
        futureRemainingAssetWon: growthAmount(
          totalAssetWon - plannedGiftNowWon,
          annualGrowthRatePct,
          yearsUntilInheritance,
        ),
        yearsUntilInheritance,
      }),
    );
  }

  if (plannedGiftNowWon > 0 && childCount > 0) {
    const perChildGiftWon = Math.floor(plannedGiftNowWon / childCount);
    const perChildGiftTaxWon = calculateGiftTaxDetailed({
      giftValueWon: perChildGiftWon,
      adjustmentWon: relationDeductionInput(
        "lineal_descendant",
        Math.floor(adjustmentWon / childCount),
        perChildGiftWon,
      ),
      relation: "lineal_descendant",
      isGenerationSkipping: false,
      isResident: true,
    }).finalGiftTaxWon;
    const futureRemainingAssetWon = growthAmount(
      totalAssetWon - plannedGiftNowWon,
      annualGrowthRatePct,
      yearsUntilInheritance,
    );
    const addedBackGiftWon = yearsUntilInheritance <= 10 ? plannedGiftNowWon : 0;
    const inheritanceBaseAssetWon = futureRemainingAssetWon + addedBackGiftWon;
    const spouseGiftSplitDeductionWon = calculateSpouseDeduction(
      inheritanceBaseAssetWon,
      input.hasSpouse,
      childCount,
    );
    const inheritanceTaxBaseWon = Math.max(
      0,
      inheritanceBaseAssetWon -
        INHERITANCE_BLANKET_DEDUCTION_WON -
        spouseGiftSplitDeductionWon,
    );
    const grossInheritanceTaxWon = calculateInheritanceTax(inheritanceTaxBaseWon);
    const totalGiftTaxWon = perChildGiftTaxWon * childCount;
    const inheritanceTaxAfterCreditWon =
      yearsUntilInheritance <= 10
        ? Math.max(0, grossInheritanceTaxWon - totalGiftTaxWon)
        : grossInheritanceTaxWon;

    scenarios.push({
      id: "gift_to_children",
      title: `지금 자녀 ${childCount}명에게 분산 증여`,
      totalTaxWon: totalGiftTaxWon + inheritanceTaxAfterCreditWon,
      giftTaxWon: totalGiftTaxWon,
      inheritanceTaxWon: inheritanceTaxAfterCreditWon,
      futureAssetWon: futureRemainingAssetWon,
      note:
        yearsUntilInheritance <= 10
          ? "10년 이내 상속이면 현재 증여분 합산 가능성을 고려해 보수적으로 비교했어요."
          : "자녀에게 미리 나누어 증여해 향후 상속재산 증가 폭을 줄이는 구조를 가정했어요.",
    });
  }

  const bestScenario = [...scenarios].sort((a, b) => a.totalTaxWon - b.totalTaxWon)[0];
  const taxDifferenceWon = Math.max(
    0,
    inheritOnlyTaxWon - bestScenario.totalTaxWon,
  );

  const warnings: string[] = [];
  if (plannedGiftNowWon === 0) {
    warnings.push("지금 옮겨볼 금액이 0원이라 증여 시나리오는 제한적으로만 비교돼요.");
  }
  if (plannedGiftNowWon > 0 && !input.hasSpouse && childCount === 0) {
    warnings.push("증여 금액을 입력했지만 배우자·자녀가 없어 증여 시나리오를 생성할 수 없어요. 배우자 또는 자녀 수를 입력해 주세요.");
  }
  if (yearsUntilInheritance <= 10 && plannedGiftNowWon > 0) {
    warnings.push("상속까지 10년 이내면 사전 증여분이 다시 합산될 수 있어요.");
  }
  if (input.hasSpouse && childCount === 0) {
    warnings.push("배우자만 있는 가정으로 단순화해 계산했어요.");
  }

  const assumptions = [
    "현재 자산은 연평균 성장률 기준으로 10~20년 뒤 가치로 단순 추정합니다.",
    "상속세는 일괄공제 5억원과 배우자공제를 기본 축으로 단순화해 계산합니다.",
    "증여세는 현재 증여세 계산기와 같은 공제·세율 구조를 재사용합니다.",
  ];

  const limitations = [
    "실제 자산평가, 채무, 금융재산공제, 동거주택상속공제, 가업상속공제는 반영하지 않았어요.",
    "10년 이내 사전증여 합산과 증여세액 공제는 보수적인 간이 모델로 반영했어요.",
    "부동산 유형, 비상장주식 평가, 해외자산, 유언·지분 구조에 따라 실제 세액은 크게 달라질 수 있어요.",
  ];

  const summary =
    taxDifferenceWon > 0
      ? `현재 가정에서는 ${bestScenario.title} 시나리오가 가장 유리해 보여요. 지금 그대로 상속만 기다리는 경우보다 약 ${taxDifferenceWon.toLocaleString("ko-KR")}원 차이 날 수 있어요.`
      : "현재 가정에서는 지금 바로 증여하는 것보다 상속 시점까지 구조를 더 보는 편이 유리하거나 비슷해 보여요.";

  const comparisonSummary =
    plannedGiftNowWon > 0
      ? `지금 ${plannedGiftNowWon.toLocaleString("ko-KR")}원을 옮겨보는 시나리오를 기준으로 상속만 하는 경우와 배우자·자녀 분산 전략을 비교했어요.`
      : "현재 자산 기준으로 상속만 하는 경우를 기본값으로 보여드리고, 증여 시나리오는 참고용으로 제한해 안내합니다.";

  return {
    futureAssetIfUntouchedWon,
    currentGiftAmountWon: plannedGiftNowWon,
    bestScenarioId: bestScenario.id,
    bestScenario,
    scenarios,
    summary,
    comparisonSummary,
    warnings,
    assumptions,
    limitations,
  };
}
