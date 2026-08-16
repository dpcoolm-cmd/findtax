import { GIFT_TAX_REFERENCE_YEAR } from "../../config/tax-display.ts";

export { GIFT_TAX_REFERENCE_YEAR };

export const GIFT_TAX_BRACKETS = [
  { upper: 100_000_000, rate: 0.1, deduction: 0 },
  { upper: 500_000_000, rate: 0.2, deduction: 10_000_000 },
  { upper: 1_000_000_000, rate: 0.3, deduction: 60_000_000 },
  { upper: 3_000_000_000, rate: 0.4, deduction: 160_000_000 },
  { upper: Number.POSITIVE_INFINITY, rate: 0.5, deduction: 460_000_000 },
] as const;

export type GiftRecipientRelation =
  | "spouse"
  | "lineal_descendant"
  | "lineal_ascendant"
  | "other_relative"
  | "other";

export type GiftTaxDetailedInput = {
  giftValueWon: number;
  adjustmentWon: number;
  relation: GiftRecipientRelation;
  isGenerationSkipping: boolean;
  isResident: boolean;
};

export type GiftTaxDetailedResult = {
  giftValueWon: number;
  adjustmentWon: number;
  relationDeductionWon: number;
  totalDeductionWon: number;
  taxableBaseWon: number;
  appliedRatePct: number;
  progressiveDeductionWon: number;
  baseGiftTaxWon: number;
  generationSkippingSurchargeWon: number;
  finalGiftTaxWon: number;
};

export function calculateGiftTaxableBase(
  giftPropertyValueWon: number,
  totalDeductionsWon: number,
): number {
  const giftValueWon = Math.max(0, Math.floor(giftPropertyValueWon));
  const totalDeductionWon = Math.max(0, Math.floor(totalDeductionsWon));
  return Math.max(0, giftValueWon - totalDeductionWon);
}

export function calculateGiftTax(taxableBaseWon: number): number {
  const taxableWon = Math.max(0, Math.floor(taxableBaseWon));
  for (const bracket of GIFT_TAX_BRACKETS) {
    if (taxableWon <= bracket.upper) {
      return Math.max(0, Math.floor(taxableWon * bracket.rate - bracket.deduction));
    }
  }

  const last = GIFT_TAX_BRACKETS[GIFT_TAX_BRACKETS.length - 1];
  return Math.max(0, Math.floor(taxableWon * last.rate - last.deduction));
}

export function getGiftTaxBracketInfo(taxableBaseWon: number) {
  const taxableWon = Math.max(0, Math.floor(taxableBaseWon));
  for (const bracket of GIFT_TAX_BRACKETS) {
    if (taxableWon <= bracket.upper) {
      return {
        ratePct: bracket.rate * 100,
        progressiveDeductionWon: bracket.deduction,
      };
    }
  }

  const last = GIFT_TAX_BRACKETS[GIFT_TAX_BRACKETS.length - 1];
  return {
    ratePct: last.rate * 100,
    progressiveDeductionWon: last.deduction,
  };
}

export function getGiftRelationLabel(relation: GiftRecipientRelation): string {
  switch (relation) {
    case "spouse":
      return "배우자";
    case "lineal_descendant":
      return "직계비속(자녀 등)";
    case "lineal_ascendant":
      return "직계존속(부모 등)";
    case "other_relative":
      return "기타 친족";
    case "other":
    default:
      return "기타";
  }
}

export function getGiftRelationDeduction(
  relation: GiftRecipientRelation,
  isResident: boolean,
): number {
  if (!isResident) return 0;

  switch (relation) {
    case "spouse":
      return 600_000_000;
    case "lineal_descendant":
      return 50_000_000;
    case "lineal_ascendant":
      return 50_000_000;
    case "other_relative":
      return 10_000_000;
    case "other":
    default:
      return 0;
  }
}

export function calculateGiftTaxDetailed(input: GiftTaxDetailedInput): GiftTaxDetailedResult {
  const giftValueWon = Math.max(0, Math.floor(input.giftValueWon));
  const adjustmentWon = Math.max(0, Math.floor(input.adjustmentWon));
  const relationDeductionWon = getGiftRelationDeduction(input.relation, input.isResident);
  const totalDeductionWon = adjustmentWon + relationDeductionWon;
  const taxableBaseWon = calculateGiftTaxableBase(giftValueWon, totalDeductionWon);
  const baseGiftTaxWon = calculateGiftTax(taxableBaseWon);
  const bracketInfo = getGiftTaxBracketInfo(taxableBaseWon);
  const generationSkippingSurchargeWon = input.isGenerationSkipping
    ? Math.floor(baseGiftTaxWon * 0.3)
    : 0;
  const finalGiftTaxWon = baseGiftTaxWon + generationSkippingSurchargeWon;

  return {
    giftValueWon,
    adjustmentWon,
    relationDeductionWon,
    totalDeductionWon,
    taxableBaseWon,
    appliedRatePct: bracketInfo.ratePct,
    progressiveDeductionWon: bracketInfo.progressiveDeductionWon,
    baseGiftTaxWon,
    generationSkippingSurchargeWon,
    finalGiftTaxWon,
  };
}

export function explainGiftTaxLines(taxableBaseWon: number): string[] {
  const taxableWon = Math.max(0, Math.floor(taxableBaseWon));
  const taxWon = calculateGiftTax(taxableWon);
  const info = getGiftTaxBracketInfo(taxableWon);
  const progressiveDeductionLabel =
    info.progressiveDeductionWon > 0
      ? `${info.progressiveDeductionWon.toLocaleString("ko-KR")}원`
      : "0원";

  return [
    `산출세액 = max(0, floor(과세표준 × ${info.ratePct}% - 누진공제))`,
    `         = max(0, floor(${taxableWon.toLocaleString("ko-KR")} × ${info.ratePct}% - ${progressiveDeductionLabel}))`,
    `         = ${taxWon.toLocaleString("ko-KR")}원`,
  ];
}

export const computeGiftTax = calculateGiftTax;
