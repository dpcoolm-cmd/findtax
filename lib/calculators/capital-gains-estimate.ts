import {
  TRANSFER_TAX_SUGGESTED_RATE_FALLBACK_PCT,
  TRANSFER_TAX_SUGGESTED_RATE_HOLDING_THRESHOLDS,
} from "../../config/calculator-policy.ts";
import { parseYmd } from "./severance-pay.ts";

export type CapitalGainsEstimateInput = {
  transferPriceWon: number;
  acquisitionCostWon: number;
  necessaryExpenseWon: number;
  basicDeductionWon: number;
  appliedRate: number;
};

export type CapitalGainsEstimateResult = {
  transferGainWon: number;
  basicDeductionAppliedWon: number;
  taxableGainWon: number;
  estimatedTaxWon: number;
};

export function calculateCapitalGainsTaxEstimate(
  input: CapitalGainsEstimateInput,
): CapitalGainsEstimateResult {
  const price = Math.max(0, Math.floor(input.transferPriceWon));
  const cost = Math.max(0, Math.floor(input.acquisitionCostWon));
  const expense = Math.max(0, Math.floor(input.necessaryExpenseWon));
  const basicDeduction = Math.max(0, Math.floor(input.basicDeductionWon));
  const appliedRate = Math.min(1, Math.max(0, input.appliedRate));

  const transferGain = Math.max(0, price - cost - expense);
  const taxableGain = Math.max(0, transferGain - basicDeduction);
  const estimatedTax = Math.floor(taxableGain * appliedRate);

  return {
    transferGainWon: transferGain,
    basicDeductionAppliedWon: basicDeduction,
    taxableGainWon: taxableGain,
    estimatedTaxWon: estimatedTax,
  };
}

export function suggestedTransferTaxRatePercentFromHoldingYears(
  holdingYears: number,
): number {
  if (!Number.isFinite(holdingYears) || holdingYears < 0) {
    return TRANSFER_TAX_SUGGESTED_RATE_FALLBACK_PCT;
  }

  for (const row of TRANSFER_TAX_SUGGESTED_RATE_HOLDING_THRESHOLDS) {
    if (holdingYears < row.belowYears) {
      return row.ratePct;
    }
  }

  return TRANSFER_TAX_SUGGESTED_RATE_FALLBACK_PCT;
}

export type AssetType = "land" | "house" | "other";

export type JudgmentType = "exempt" | "unregistered" | "multi_home_adjustment" | "normal";

export type CapitalGainsFullInput = {
  acquisitionDate: string;
  transferDate: string;
  assetType: AssetType;
  transferPriceWon: number;
  acquisitionCostWon: number;
  necessaryExpenseWon: number;
  isOneHouseholdOneHome: boolean;
  hasVerifiedExemptionRequirements?: boolean;
  isUnregistered: boolean;
  isMultiHome: boolean;
  isAdjustmentZone: boolean;
  isInherited: boolean;
  isJointOwnership?: boolean;
};

export type CapitalGainsFullResult = {
  holdingDays: number;
  holdingYears: number;
  holdingDisplay: string;
  transferGainWon: number;
  taxableTransferGainWon: number;
  ltdRatePct: number;
  ltdDeductionWon: number;
  transferIncomeWon: number;
  basicDeductionWon: number;
  taxBaseWon: number;
  appliedRatePct: number;
  isFlat: boolean;
  calculatedTaxWon: number;
  localIncomeTaxWon: number;
  finalTaxWon: number;
  isExempt: boolean;
  isHighPriceHouse: boolean;
  judgment: JudgmentType;
  warnings: string[];
  limitations: string[];
  assumptions: string[];
  highPriceApportionmentNote: string | null;
  ltdDeductionReason: string;
};

const PROGRESSIVE_BRACKETS = [
  { limit: 14_000_000, rate: 0.06, deduction: 0 },
  { limit: 50_000_000, rate: 0.15, deduction: 1_260_000 },
  { limit: 88_000_000, rate: 0.24, deduction: 5_760_000 },
  { limit: 150_000_000, rate: 0.35, deduction: 15_440_000 },
  { limit: 300_000_000, rate: 0.38, deduction: 19_940_000 },
  { limit: 500_000_000, rate: 0.4, deduction: 25_940_000 },
  { limit: 1_000_000_000, rate: 0.42, deduction: 35_940_000 },
  { limit: Infinity, rate: 0.45, deduction: 65_940_000 },
] as const;

const BASIC_DEDUCTION = 2_500_000;
const HIGH_PRICE_THRESHOLD = 1_200_000_000;

function progressiveTax(taxBase: number): number {
  if (taxBase <= 0) return 0;

  for (const bracket of PROGRESSIVE_BRACKETS) {
    if (taxBase <= bracket.limit) {
      return Math.max(0, Math.floor(taxBase * bracket.rate - bracket.deduction));
    }
  }

  return 0;
}

function effectiveRatePct(tax: number, base: number): number {
  if (base <= 0) return 6;
  return Math.round((tax / base) * 100);
}

function holdingDisplayString(days: number): string {
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);

  if (years === 0) {
    return months <= 0 ? "1개월 미만" : `${months}개월`;
  }

  if (months === 0) {
    return `${years}년`;
  }

  return `${years}년 ${months}개월`;
}

export function addMonthsToYmd(ymd: string, months: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) return ymd;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const totalMonths = year * 12 + monthIndex + months;
  const nextYear = Math.floor(totalMonths / 12);
  const nextMonthIndex = totalMonths % 12;
  const lastDayOfMonth = new Date(nextYear, nextMonthIndex + 1, 0).getDate();
  const nextDay = Math.min(day, lastDayOfMonth);

  return `${nextYear.toString().padStart(4, "0")}-${String(nextMonthIndex + 1).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`;
}

export function calculateCapitalGainsFull(
  input: CapitalGainsFullInput,
): CapitalGainsFullResult | null {
  const acquisitionDate = parseYmd(input.acquisitionDate);
  const transferDate = parseYmd(input.transferDate);

  if (!acquisitionDate || !transferDate) return null;
  if (transferDate <= acquisitionDate) return null;

  const holdingDays = Math.floor(
    (transferDate.getTime() - acquisitionDate.getTime()) / 86_400_000,
  );
  const holdingYears = holdingDays / 365.25;

  const price = Math.max(0, Math.floor(input.transferPriceWon));
  const cost = Math.max(0, Math.floor(input.acquisitionCostWon));
  const expense = Math.max(0, Math.floor(input.necessaryExpenseWon));
  const ownershipDivisor = input.isJointOwnership ? 2 : 1;

  const transferGain = Math.max(0, Math.floor((price - cost - expense) / ownershipDivisor));
  const isHouse = input.assetType === "house";
  const isHighPriceHouse = isHouse && price > HIGH_PRICE_THRESHOLD;
  const isExemptQualified =
    input.isOneHouseholdOneHome &&
    input.hasVerifiedExemptionRequirements === true &&
    isHouse &&
    holdingYears >= 2 &&
    !input.isUnregistered;

  let taxableTransferGain = transferGain;
  let isExempt = false;
  let judgment: JudgmentType = "normal";

  const warnings: string[] = [];
  const limitations: string[] = [];
  const assumptions: string[] = [
    "필요경비와 취득가액은 입력한 값을 그대로 반영합니다.",
  ];

  if (isExemptQualified) {
    if (price <= HIGH_PRICE_THRESHOLD) {
      isExempt = true;
      judgment = "exempt";
      taxableTransferGain = 0;
    } else {
      taxableTransferGain = Math.floor(
        transferGain * ((price - HIGH_PRICE_THRESHOLD) / price),
      );
    }
  }

  if (input.isInherited) {
    warnings.push("상속 특례는 현재 계산에 미반영입니다.");
  }

  if (input.acquisitionCostWon === 0) {
    warnings.push("취득가액이 0원으로 입력되어 결과가 크게 왜곡될 수 있습니다.");
  }

  if (input.isOneHouseholdOneHome) {
    if (input.hasVerifiedExemptionRequirements) {
      assumptions.push(
        "사용자가 세대·보유·거주 요건을 모두 확인한 경우에만 1세대 1주택 비과세를 간이 반영합니다.",
      );
    } else {
      limitations.push(
        "1세대 1주택을 선택했지만 세대·보유·거주 요건 확인이 완료되지 않아 비과세를 반영하지 않았습니다.",
      );
    }
  }

  if (input.isJointOwnership) {
    assumptions.push("부부 공동명의 50:50 기준으로 계산했습니다.");
    warnings.push("지분 비율이 다를 경우 실제 세액과 차이가 날 수 있어요.");
  }

  if (input.isMultiHome && input.isAdjustmentZone) {
    limitations.push("다주택자 조정대상지역 중과·예외는 현재 세액에는 미반영입니다.");
  }

  const highPriceApportionmentNote =
    isExemptQualified && isHighPriceHouse
      ? `고가주택 안분 적용: 과세대상 양도차익 = 전체 양도차익 × (양도가액 - ${HIGH_PRICE_THRESHOLD.toLocaleString("ko-KR")}원) / 양도가액`
      : null;

  if (isExempt) {
    return {
      holdingDays,
      holdingYears,
      holdingDisplay: holdingDisplayString(holdingDays),
      transferGainWon: transferGain,
      taxableTransferGainWon: 0,
      ltdRatePct: 0,
      ltdDeductionWon: 0,
      transferIncomeWon: 0,
      basicDeductionWon: 0,
      taxBaseWon: 0,
      appliedRatePct: 0,
      isFlat: false,
      calculatedTaxWon: 0,
      localIncomeTaxWon: 0,
      finalTaxWon: 0,
      isExempt: true,
      isHighPriceHouse,
      judgment: "exempt",
      warnings,
      limitations,
      assumptions,
      highPriceApportionmentNote,
      ltdDeductionReason: "1세대 1주택 비과세로 장기보유특별공제를 적용하지 않습니다.",
    };
  }

  if (input.isUnregistered) {
    judgment = "unregistered";
  } else if (input.isMultiHome && input.isAdjustmentZone) {
    judgment = "multi_home_adjustment";
  }

  let ltdRatePct = 0;
  let ltdDeductionReason =
    "보유기간 또는 자산 조건에 따라 장기보유특별공제가 적용되지 않습니다.";

  if (!input.isUnregistered && holdingYears >= 3) {
    if (
      input.isOneHouseholdOneHome &&
      input.hasVerifiedExemptionRequirements === true &&
      isHouse
    ) {
      ltdRatePct = Math.min(Math.floor(holdingYears) * 4, 80);
      ltdDeductionReason = `1세대 1주택 간이 규칙으로 보유 ${Math.floor(holdingYears)}년 × 연 4%를 적용했습니다.`;
    } else {
      ltdRatePct = Math.min(Math.floor(holdingYears) * 2, 30);
      ltdDeductionReason = `일반 자산 간이 규칙으로 보유 ${Math.floor(holdingYears)}년 × 연 2%를 적용했습니다.`;
    }
  } else if (input.isUnregistered) {
    ltdDeductionReason = "미등기 양도는 장기보유특별공제를 적용하지 않습니다.";
  } else if (holdingYears < 3) {
    ltdDeductionReason = "보유기간 3년 미만으로 장기보유특별공제를 적용하지 않습니다.";
  }

  const ltdDeduction = Math.floor((taxableTransferGain * ltdRatePct) / 100);
  const transferIncome = Math.max(0, taxableTransferGain - ltdDeduction);
  const basicDeduction = Math.min(BASIC_DEDUCTION, transferIncome);
  const taxBase = Math.max(0, transferIncome - basicDeduction);

  let appliedRatePct = 0;
  let isFlat = false;
  let calculatedTax = 0;

  if (input.isUnregistered) {
    appliedRatePct = 70;
    isFlat = true;
    calculatedTax = Math.floor(taxBase * 0.7);
  } else if (holdingYears < 1) {
    appliedRatePct = 70;
    isFlat = true;
    calculatedTax = Math.floor(taxBase * 0.7);
  } else if (holdingYears < 2) {
    appliedRatePct = 60;
    isFlat = true;
    calculatedTax = Math.floor(taxBase * 0.6);
  } else {
    calculatedTax = progressiveTax(taxBase);
    appliedRatePct = effectiveRatePct(calculatedTax, taxBase);
    isFlat = false;
  }

  const localIncomeTax = Math.floor(calculatedTax * 0.1);
  const finalTax = calculatedTax + localIncomeTax;

  return {
    holdingDays,
    holdingYears,
    holdingDisplay: holdingDisplayString(holdingDays),
    transferGainWon: transferGain,
    taxableTransferGainWon: taxableTransferGain,
    ltdRatePct,
    ltdDeductionWon: ltdDeduction,
    transferIncomeWon: transferIncome,
    basicDeductionWon: basicDeduction,
    taxBaseWon: taxBase,
    appliedRatePct,
    isFlat,
    calculatedTaxWon: calculatedTax,
    localIncomeTaxWon: localIncomeTax,
    finalTaxWon: finalTax,
    isExempt: false,
    isHighPriceHouse,
    judgment,
    warnings,
    limitations,
    assumptions,
    highPriceApportionmentNote,
    ltdDeductionReason,
  };
}
