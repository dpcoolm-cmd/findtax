import type { GiftRecipientRelation } from "@/lib/calculators/gift-tax";

export const GIFT_CASE_RULE_VERSION = "gift-case-2026.1";

export type GiftAssetType =
  | "cash"
  | "securities"
  | "real_estate"
  | "business_interest"
  | "other";

export type GiftCaseInput = {
  giftValueWon: number;
  priorTenYearGiftsWon: number;
  relation: GiftRecipientRelation;
  recipientIsMinor: boolean;
  giftDate: string;
  assetType: GiftAssetType;
  isGenerationSkipping: boolean;
  isResident: boolean;
  knowsPriorGifts: boolean;
  hasTransferEvidence: boolean;
  hasRelationshipDocument: boolean;
  hasValuationEvidence: boolean;
};

export type GiftCaseAssessment = {
  deductionLimitWon: number;
  usedDeductionWon: number;
  remainingBeforeGiftWon: number;
  remainingAfterGiftWon: number;
  amountOverRemainingLimitWon: number;
  complexityScore: number;
  recommendation: "self" | "review" | "tax_accountant";
  filingDeadline: string;
  filingPeriodLabel: string;
  warnings: string[];
};

export function giftDeductionLimitWon(
  relation: GiftRecipientRelation,
  recipientIsMinor: boolean,
  isResident: boolean,
): number {
  if (!isResident) return 0;
  switch (relation) {
    case "spouse":
      return 600_000_000;
    case "lineal_descendant":
      return recipientIsMinor ? 20_000_000 : 50_000_000;
    case "lineal_ascendant":
      return 50_000_000;
    case "other_relative":
      return 10_000_000;
    default:
      return 0;
  }
}

export function giftFilingDeadline(giftDate: string): string {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(giftDate);
  if (!matched) return "";
  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  const valid = new Date(Date.UTC(year, month - 1, day));
  if (
    valid.getUTCFullYear() !== year ||
    valid.getUTCMonth() !== month - 1 ||
    valid.getUTCDate() !== day
  ) {
    return "";
  }
  const deadline = new Date(Date.UTC(year, month + 3, 0));
  return [
    deadline.getUTCFullYear(),
    String(deadline.getUTCMonth() + 1).padStart(2, "0"),
    String(deadline.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function assessGiftCase(input: GiftCaseInput): GiftCaseAssessment {
  const giftValueWon = Math.max(0, Math.floor(input.giftValueWon));
  const priorTenYearGiftsWon = Math.max(0, Math.floor(input.priorTenYearGiftsWon));
  const deductionLimitWon = giftDeductionLimitWon(
    input.relation,
    input.recipientIsMinor,
    input.isResident,
  );
  const usedDeductionWon = Math.min(deductionLimitWon, priorTenYearGiftsWon);
  const remainingBeforeGiftWon = Math.max(0, deductionLimitWon - usedDeductionWon);
  const remainingAfterGiftWon = Math.max(0, remainingBeforeGiftWon - giftValueWon);
  const amountOverRemainingLimitWon = Math.max(0, giftValueWon - remainingBeforeGiftWon);

  let complexityScore = 0;
  if (amountOverRemainingLimitWon > 0) complexityScore += 22;
  if (priorTenYearGiftsWon > 0) complexityScore += 14;
  if (!input.knowsPriorGifts) complexityScore += 20;
  if (input.assetType === "securities") complexityScore += 12;
  if (input.assetType === "real_estate") complexityScore += 26;
  if (input.assetType === "business_interest") complexityScore += 30;
  if (input.assetType === "other") complexityScore += 14;
  if (input.isGenerationSkipping) complexityScore += 18;
  if (!input.isResident) complexityScore += 24;
  if (!input.hasValuationEvidence && input.assetType !== "cash") complexityScore += 12;
  complexityScore = Math.min(100, complexityScore);

  const recommendation =
    complexityScore >= 55
      ? "tax_accountant"
      : complexityScore >= 25
        ? "review"
        : "self";

  const warnings: string[] = [];
  if (!input.knowsPriorGifts) {
    warnings.push("같은 증여자에게 받은 과거 10년 증여 내역을 먼저 확인해야 합니다.");
  }
  if (input.assetType !== "cash") {
    warnings.push("현금 외 재산은 증여일의 세법상 평가액이 입력 금액과 달라질 수 있습니다.");
  }
  if (input.isGenerationSkipping) {
    warnings.push("세대생략 증여는 할증과 예외 요건을 별도로 확인해야 합니다.");
  }
  if (!input.isResident) {
    warnings.push("비거주자·해외 관련 증여는 과세 범위와 공제 적용을 별도로 확인해야 합니다.");
  }

  return {
    deductionLimitWon,
    usedDeductionWon,
    remainingBeforeGiftWon,
    remainingAfterGiftWon,
    amountOverRemainingLimitWon,
    complexityScore,
    recommendation,
    filingDeadline: giftFilingDeadline(input.giftDate),
    filingPeriodLabel: `${input.giftDate} 증여`,
    warnings,
  };
}

