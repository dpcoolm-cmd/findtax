export const DEFAULT_INTEREST_WITHHOLDING_RATE = 15.4;

export type SavingsProductType = "deposit" | "installment";
export type InterestTaxType = "taxable" | "tax-exempt";

export type SavingsInterestInput = {
  productType: SavingsProductType;
  principalWon: number;
  monthlyPaymentWon: number;
  annualRatePercent: number;
  months: number;
  taxType: InterestTaxType;
};

export type SavingsInterestResult = {
  paidPrincipalWon: number;
  grossInterestWon: number;
  withholdingTaxWon: number;
  netInterestWon: number;
  maturityAmountWon: number;
};

/**
 * Estimates a bank deposit or fixed monthly installment savings product.
 * Installments are assumed to be paid at the beginning of each month and earn
 * simple interest for 1..n months. Actual bank day-count and rounding differ.
 */
export function calculateSavingsInterest(input: SavingsInterestInput): SavingsInterestResult {
  const months = Math.floor(input.months);
  const annualRate = input.annualRatePercent / 100;
  const monthlyRate = annualRate / 12;
  const paidPrincipalWon = input.productType === "deposit"
    ? Math.round(input.principalWon)
    : Math.round(input.monthlyPaymentWon) * months;

  const rawInterest = input.productType === "deposit"
    ? input.principalWon * annualRate * months / 12
    : input.monthlyPaymentWon * monthlyRate * (months * (months + 1) / 2);

  const grossInterestWon = Math.max(0, Math.round(rawInterest));
  const withholdingTaxWon = input.taxType === "taxable"
    ? Math.round(grossInterestWon * DEFAULT_INTEREST_WITHHOLDING_RATE / 100)
    : 0;
  const netInterestWon = grossInterestWon - withholdingTaxWon;

  return {
    paidPrincipalWon,
    grossInterestWon,
    withholdingTaxWon,
    netInterestWon,
    maturityAmountWon: paidPrincipalWon + netInterestWon,
  };
}

export function validateSavingsInterestInput(input: SavingsInterestInput): string | null {
  const amount = input.productType === "deposit" ? input.principalWon : input.monthlyPaymentWon;
  if (!Number.isFinite(amount) || amount < 1 || amount > 10_000_000_000) {
    return "납입 금액은 1원 이상 100억 원 이하로 입력해 주세요.";
  }
  if (!Number.isFinite(input.annualRatePercent) || input.annualRatePercent < 0 || input.annualRatePercent > 30) {
    return "연이율은 0% 이상 30% 이하로 입력해 주세요.";
  }
  if (!Number.isFinite(input.months) || input.months < 1 || input.months > 1200) {
    return "기간은 1개월 이상 1,200개월 이하로 입력해 주세요.";
  }
  return null;
}

export const SAVINGS_INTEREST_REFERENCE = {
  lastVerifiedAt: "2026-09-24",
  sources: [
    { title: "국가법령정보센터: 소득세법 제129조(원천징수세율)", url: "https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1032880463" },
    { title: "국세청: 금융(이자·배당)소득 안내", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7896&mi=6471" },
    { title: "국세청: 이자소득 원천징수 안내", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=8058" },
  ],
} as const;
