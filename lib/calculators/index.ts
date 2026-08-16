export {
  calculateComprehensiveIncomeTax,
  computeComprehensiveIncomeTax,
  COMPREHENSIVE_INCOME_TAX_BRACKETS,
  COMPREHENSIVE_INCOME_TAX_REFERENCE_YEAR,
  explainComprehensiveIncomeTaxLines,
  getAppliedComprehensiveIncomeBracket,
} from "./comprehensive-income-tax";
export {
  calculateCapitalGainsTaxEstimate,
  suggestedTransferTaxRatePercentFromHoldingYears,
} from "./capital-gains-estimate";
export type {
  CapitalGainsEstimateInput,
  CapitalGainsEstimateResult,
} from "./capital-gains-estimate";
export {
  calculateVatFromSupplyAmount,
  calculateVatFromGrossAmount,
} from "./vat";
export type { VatFromSupplyResult, VatFromGrossResult } from "./vat";
export {
  calculateGiftTaxableBase,
  calculateGiftTax,
  computeGiftTax,
  GIFT_TAX_BRACKETS,
  GIFT_TAX_REFERENCE_YEAR,
} from "./gift-tax";
