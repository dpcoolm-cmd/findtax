/**
 * 계산기 결과 구간(result_band) → CTA 강도.
 * 임계값은 `config/calculator-policy`에서 조정(법적 판단 아님, 전환 UX용).
 */

import {
  CALCULATOR_CTA_BAND_COPY,
  CTA_BAND_COMPREHENSIVE_INCOME,
  CTA_BAND_GIFT_TAX,
  CTA_BAND_TRANSFER_TAX,
  CTA_BAND_VAT,
} from "@/config/calculator-policy";

export type CalculatorCtaSlug =
  | "comprehensive_income"
  | "income_decision"
  | "bookkeeping_decision"
  | "advisor_roi"
  | "gift_tax"
  | "side_hustle"
  | "transfer_tax"
  | "vat"
  | "vat_decision"
  | "year_end_tax_optimization";

export type ResultBand = "low" | "mid" | "high";

export function bandComprehensiveIncome(
  taxWon: number,
  taxableWon: number,
): ResultBand {
  const t = Math.max(0, taxWon);
  const b = Math.max(0, taxableWon);
  const hi = CTA_BAND_COMPREHENSIVE_INCOME.high;
  const mid = CTA_BAND_COMPREHENSIVE_INCOME.mid;
  if (t >= hi.minTaxWon || b >= hi.minTaxableWon) return "high";
  if (t >= mid.minTaxWon || b >= mid.minTaxableWon) return "mid";
  return "low";
}

export function bandGiftTax(taxWon: number, taxableWon: number): ResultBand {
  const t = Math.max(0, taxWon);
  const b = Math.max(0, taxableWon);
  const hi = CTA_BAND_GIFT_TAX.high;
  const mid = CTA_BAND_GIFT_TAX.mid;
  if (t >= hi.minTaxWon || b >= hi.minTaxableWon) return "high";
  if (t >= mid.minTaxWon || b >= mid.minTaxableWon) return "mid";
  return "low";
}

export function bandTransferTax(
  estimatedTaxWon: number,
  taxableGainWon: number,
): ResultBand {
  const t = Math.max(0, estimatedTaxWon);
  const g = Math.max(0, taxableGainWon);
  const hi = CTA_BAND_TRANSFER_TAX.high;
  const mid = CTA_BAND_TRANSFER_TAX.mid;
  if (t >= hi.minTaxWon || g >= hi.minGainWon) return "high";
  if (t >= mid.minTaxWon || g >= mid.minGainWon) return "mid";
  return "low";
}

export function bandVat(vatWon: number): ResultBand {
  const v = Math.max(0, vatWon);
  const hi = CTA_BAND_VAT.high;
  const mid = CTA_BAND_VAT.mid;
  if (v >= hi.minVatWon) return "high";
  if (v >= mid.minVatWon) return "mid";
  return "low";
}

export function getCalculatorCtaCopy(band: ResultBand): {
  title: string;
  buttonLabel: string;
} {
  if (band === "high") return { ...CALCULATOR_CTA_BAND_COPY.high };
  if (band === "mid") return { ...CALCULATOR_CTA_BAND_COPY.mid };
  return { ...CALCULATOR_CTA_BAND_COPY.low };
}
