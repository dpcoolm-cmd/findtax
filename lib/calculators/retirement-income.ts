export type RetirementInput = {
  currentAge: number;
  retirementAge: number;
  targetAge: number;
  pensionStartAge: number;
  assetsWon: number;
  additionalAssetsWon: number;
  monthlyContributionWon: number;
  pensionMonthlyWon: number;
  otherMonthlyWon: number;
  spendingMonthlyWon: number;
  annualReturn: number;
  inflation: number;
};

export const RETIREMENT_DEFAULTS: RetirementInput = {
  currentAge: 45, retirementAge: 60, targetAge: 90, pensionStartAge: 65,
  assetsWon: 100_000_000, additionalAssetsWon: 0, monthlyContributionWon: 300_000,
  pensionMonthlyWon: 1_000_000, otherMonthlyWon: 0, spendingMonthlyWon: 2_500_000,
  annualReturn: 4, inflation: 2,
};

export const RETIREMENT_REFERENCE = {
  lastVerifiedAt: "2026-09-06",
  version: "retirement-income-1.0",
  sources: [
    { title: "국민연금공단: 노령연금 지급개시연령", url: "https://www.nps.or.kr/pnsinfo/ntpsklg/getOHAF0056M0.do" },
    { title: "국민연금공단: 국민연금 제도와 물가 반영", url: "https://www.nps.or.kr/pnsinfo/ntpsklg/getOHAF0095M0.do?menuId=MN24001131" },
  ],
  assumptions: [
    "생활비와 국민연금은 현재 구매력 기준 입력이며 가정한 물가상승률로 함께 증가합니다. 국민연금은 입력한 개시 나이부터 받습니다.",
    "기타 월소득은 퇴직 시점부터 받는 고정 명목금액입니다. 추가 납입은 퇴직 직전까지 월말에 이루어집니다.",
    "퇴직 후 월초에 부족생활비를 인출하고 남은 자산에 월복리 수익률을 적용합니다. 소득이 생활비보다 많아도 잉여소득은 재투자하지 않습니다.",
  ],
  limitations: [
    "계좌별 인출 제한·세금·건강보험료·수수료를 별도 계산하지 않습니다. 월수령액은 예상 실수령액, 수익률은 비용을 고려한 가정으로 입력하세요.",
    "자산을 퇴직 즉시 인출할 수 있다고 가정합니다. 연금수령 한도나 중도인출 제한은 금융회사에 확인하세요.",
    "매달 일정한 수익률을 가정하므로 손실 순서에 따른 위험, 의료비·주거비 일시 지출과 제도 변경을 반영하지 않습니다.",
  ],
} as const;

export function validateRetirementInput(input: RetirementInput): string[] {
  if (Object.values(input).some((v) => !Number.isFinite(v))) return ["빈칸 없이 유효한 숫자를 입력해 주세요."];
  const errors: string[] = [];
  for (const key of ["currentAge", "retirementAge", "targetAge", "pensionStartAge"] as const) {
    if (!Number.isInteger(input[key]) || input[key] < 18 || input[key] > 120) {
      errors.push("나이는 18~120세 정수로 입력해 주세요."); break;
    }
  }
  if (input.retirementAge < input.currentAge) errors.push("이미 퇴직했다면 퇴직 나이를 현재 나이와 같게 입력해 주세요.");
  if (input.targetAge <= input.retirementAge) errors.push("계산 종료 나이는 퇴직 나이보다 커야 합니다.");
  for (const key of ["assetsWon", "additionalAssetsWon", "monthlyContributionWon", "pensionMonthlyWon", "otherMonthlyWon", "spendingMonthlyWon"] as const) {
    if (input[key] < 0 || input[key] > 1e12) { errors.push("금액은 0원~1조원 범위로 입력해 주세요."); break; }
  }
  if (input.annualReturn < -20 || input.annualReturn > 15) errors.push("수익률은 -20~15% 범위로 입력해 주세요.");
  if (input.inflation < 0 || input.inflation > 10) errors.push("물가상승률은 0~10% 범위로 입력해 주세요.");
  return errors;
}

export type RetirementPoint = { age: number; assetsWon: number; realAssetsWon: number; spendingWon: number; pensionWon: number; otherWon: number };
export type RetirementResult = {
  retirementAssetsWon: number;
  firstMonthGapWon: number;
  firstMonthSpendingWon: number;
  pensionCoveragePercent: number;
  depletionAfterMonths: number | null;
  additionalNeededWon: number;
  points: RetirementPoint[];
};

export function calculateRetirementIncome(input: RetirementInput): RetirementResult {
  const errors = validateRetirementInput(input);
  if (errors.length) throw new RangeError(errors.join(" "));
  const accumulationMonths = (input.retirementAge - input.currentAge) * 12;
  const retirementMonths = (input.targetAge - input.retirementAge) * 12;
  const growth = Math.pow(1 + input.annualReturn / 100, 1 / 12);
  let assets = input.assetsWon + input.additionalAssetsWon;
  for (let m = 0; m < accumulationMonths; m++) assets = assets * growth + input.monthlyContributionWon;
  const retirementAssetsWon = assets;
  const cashflow = (month: number) => {
    const elapsed = accumulationMonths + month;
    const inflationFactor = Math.pow(1 + input.inflation / 100, elapsed / 12);
    const pension = input.retirementAge * 12 + month >= input.pensionStartAge * 12
      ? input.pensionMonthlyWon * inflationFactor : 0;
    const spending = input.spendingMonthlyWon * inflationFactor;
    return { spending, pension, deficit: Math.max(0, spending - pension - input.otherMonthlyWon), inflationFactor };
  };
  // Backward valuation matches beginning-of-month withdrawals in the forward simulation.
  let required = 0;
  for (let m = retirementMonths - 1; m >= 0; m--) required = cashflow(m).deficit + required / growth;
  const first = cashflow(0);
  const points: RetirementPoint[] = [];
  let depletionAfterMonths: number | null = null;
  for (let m = 0; m <= retirementMonths; m++) {
    const flow = cashflow(m);
    if (m % 12 === 0) points.push({ age: input.retirementAge + m / 12, assetsWon: assets,
      realAssetsWon: assets / flow.inflationFactor, spendingWon: flow.spending,
      pensionWon: flow.pension, otherWon: input.otherMonthlyWon });
    if (m === retirementMonths) break;
    if (depletionAfterMonths === null && flow.deficit > assets + 0.01) depletionAfterMonths = m;
    assets = Math.max(0, assets - flow.deficit) * growth;
  }
  return { retirementAssetsWon, firstMonthGapWon: first.deficit, firstMonthSpendingWon: first.spending,
    pensionCoveragePercent: first.spending > 0 ? Math.min(100, first.pension / first.spending * 100) : 0,
    depletionAfterMonths, additionalNeededWon: Math.max(0, required - retirementAssetsWon), points };
}
