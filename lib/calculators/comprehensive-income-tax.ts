import { COMPREHENSIVE_INCOME_TAX_REFERENCE_YEAR } from "../../config/tax-display.ts";

/**
 * 종합소득세 — 산출세액(과세표준 기준) 간이 계산
 *
 * - **2026년 기준** 소득세법 시행령 [별표 4] 과세표준별 산출세율·누진공제(원 미만 절사).
 * - **정식 신고용 아님**: 세액공제·분리과세·종합한도초과과세·조세특례·기타경비 한도 등 미반영.
 *
 * 세액 = max(0, floor(과세표준 × 세율 − 누진공제))
 */

export { COMPREHENSIVE_INCOME_TAX_REFERENCE_YEAR };

export type ComprehensiveIncomeTaxBracket = {
  /** 구간 상한(원, 이하). 마지막은 무한대 */
  upper: number;
  rate: number;
  deduction: number;
};

/** 과세표준 구간(이하) — 2026 산출세율·누진공제 */
export const COMPREHENSIVE_INCOME_TAX_BRACKETS: readonly ComprehensiveIncomeTaxBracket[] = [
  { upper: 14_000_000, rate: 0.06, deduction: 0 },
  { upper: 50_000_000, rate: 0.15, deduction: 1_260_000 },
  { upper: 88_000_000, rate: 0.24, deduction: 5_760_000 },
  { upper: 150_000_000, rate: 0.35, deduction: 15_440_000 },
  { upper: 300_000_000, rate: 0.38, deduction: 19_940_000 },
  { upper: 500_000_000, rate: 0.4, deduction: 25_940_000 },
  { upper: 1_000_000_000, rate: 0.42, deduction: 35_940_000 },
  { upper: Number.POSITIVE_INFINITY, rate: 0.45, deduction: 65_940_000 },
] as const;

export function getAppliedComprehensiveIncomeBracket(
  taxableIncomeWon: number,
): ComprehensiveIncomeTaxBracket {
  const t = Math.max(0, Math.floor(taxableIncomeWon));
  for (const b of COMPREHENSIVE_INCOME_TAX_BRACKETS) {
    if (t <= b.upper) return b;
  }
  return COMPREHENSIVE_INCOME_TAX_BRACKETS[COMPREHENSIVE_INCOME_TAX_BRACKETS.length - 1];
}

/**
 * 과세표준(원)에 대한 산출세액(간이). 음수 방지.
 */
export function calculateComprehensiveIncomeTax(taxableIncomeWon: number): number {
  const t = Math.max(0, Math.floor(taxableIncomeWon));
  const b = getAppliedComprehensiveIncomeBracket(t);
  return Math.max(0, Math.floor(t * b.rate - b.deduction));
}

/** @deprecated — `calculateComprehensiveIncomeTax`와 동일 */
export const computeComprehensiveIncomeTax = calculateComprehensiveIncomeTax;

function wonLabel(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}

/** UI·모달용 산식 설명 */
export function explainComprehensiveIncomeTaxLines(taxableIncomeWon: number): string[] {
  const t = Math.max(0, Math.floor(taxableIncomeWon));
  const b = getAppliedComprehensiveIncomeBracket(t);
  const tax = calculateComprehensiveIncomeTax(taxableIncomeWon);
  const ratePct = b.rate * 100;
  const dedStr = b.deduction > 0 ? wonLabel(b.deduction) : "0원";
  return [
    `산출세액 = max(0, floor(과세표준 × ${ratePct}% − 누진공제))`,
    `         = max(0, floor(${wonLabel(t)} × ${ratePct}% − ${dedStr}))`,
    `         = ${wonLabel(tax)}`,
  ];
}

/** UI `<details>`용 구간 안내 */
export function getComprehensiveIncomeTaxBracketHintLines(): string[] {
  const lines: string[] = [];
  let prev = 0;
  for (const b of COMPREHENSIVE_INCOME_TAX_BRACKETS) {
    const ratePct = b.rate * 100;
    const dedStr = b.deduction === 0 ? "0원" : `−${wonLabel(b.deduction)}`;
    if (b.upper === Number.POSITIVE_INFINITY) {
      lines.push(`${wonLabel(prev)} 초과: ${ratePct}%, 누진공제 ${dedStr}`);
    } else {
      const hi = wonLabel(b.upper);
      if (prev === 0) {
        lines.push(`${hi} 이하: ${ratePct}%, 누진공제 ${dedStr}`);
      } else {
        lines.push(
          `${wonLabel(prev)} 초과 ~ ${hi} 이하: ${ratePct}%, 누진공제 ${dedStr}`,
        );
      }
      prev = b.upper;
    }
  }
  return lines;
}
