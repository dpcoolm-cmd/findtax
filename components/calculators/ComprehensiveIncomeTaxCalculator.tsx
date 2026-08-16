"use client";

import { useMemo, useState } from "react";
import { CalculatorConsultCta } from "@/components/CalculatorConsultCta";
import { CalculatorEstimateNotice } from "@/components/CalculatorEstimateNotice";
import { AdvisorCostBenefitCalculator } from "@/components/calculators/AdvisorCostBenefitCalculator";
import { CalculatorTrustSection } from "@/components/calculators/CalculatorTrustSection";
import { IncomeFilingDecisionCalculator } from "@/components/calculators/IncomeFilingDecisionCalculator";
import { ResultInsightCard } from "@/components/calculators/ResultInsightCard";
import { comprehensiveIncomeInsight } from "@/lib/calculator-insights";
import { parsePositiveWonString } from "@/lib/calculator-input";
import { bandComprehensiveIncome } from "@/lib/calculator-cta-bands";
import {
  calculateComprehensiveIncomeTax,
  COMPREHENSIVE_INCOME_TAX_REFERENCE_YEAR,
  explainComprehensiveIncomeTaxLines,
  getComprehensiveIncomeTaxBracketHintLines,
} from "@/lib/calculators/comprehensive-income-tax";

function won(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

export function ComprehensiveIncomeTaxCalculator() {
  const [raw, setRaw] = useState("");

  const result = useMemo(() => {
    const parsed = parsePositiveWonString(raw);
    if (!parsed.ok) {
      return { error: raw.trim() === "" ? null : parsed.error, data: null as null };
    }
    const taxable = parsed.value;
    const tax = calculateComprehensiveIncomeTax(taxable);
    const eff = taxable > 0 ? (tax / taxable) * 100 : 0;
    return { error: null as string | null, data: { taxable, tax, eff } };
  }, [raw]);

  const summary =
    result.data != null
      ? `종합소득 과세표준 ${won(result.data.taxable)}, 산출세액 참고치(간이) ${won(result.data.tax)}, 유효세율 약 ${result.data.eff.toFixed(2)}% 범위 참고`
      : null;

  const bracketLines = useMemo(() => getComprehensiveIncomeTaxBracketHintLines(), []);

  const ctaBand = useMemo(
    () =>
      result.data != null
        ? bandComprehensiveIncome(result.data.tax, result.data.taxable)
        : "low",
    [result.data],
  );

  const formulaBody = useMemo(() => {
    if (!result.data) return null;
    return (
      <pre className="whitespace-pre-wrap font-sans text-sm">{explainComprehensiveIncomeTaxLines(result.data.taxable).join("\n")}</pre>
    );
  }, [result.data]);

  return (
    <div className="space-y-6">
      <IncomeFilingDecisionCalculator />
      <AdvisorCostBenefitCalculator
        contextLabel="종합소득세"
        defaultSituation="income_tax"
        defaultTaxRatePercent={15}
        defaultAdvisorFeeManwon="50"
        defaultMissedDeductionManwon="300"
      />
      <section className="rounded-xl bg-white p-4 shadow-md sm:p-6">
        <div className="mb-5 border-b border-neutral-100 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B7791F]">Income tax amount</p>
          <h2 className="mt-2 text-2xl font-bold text-neutral-950">종합소득세 산출세액 간이 계산</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            신고 판단 후 과세표준 기준 산출세액과 유효세율을 참고용으로 확인합니다.
          </p>
        </div>
      <label className="block text-sm font-medium text-neutral-800">
        <span className="inline-flex items-center gap-1.5">
          종합소득 과세표준 (원)
          <span className="group relative inline-flex cursor-help items-center justify-center">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#cbd5e1] text-[10px] font-bold text-[#64748b]">
              ?
            </span>
            <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 w-64 -translate-x-1/2 rounded-lg bg-[#0f1e3d] px-2.5 py-2 text-[11px] font-normal leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              총소득이 아닌, 인적공제·연금·의료비·신용카드 등 모든 소득공제를 뺀 금액이에요. 홈택스 종합소득세 신고서에서 확인할 수 있어요.
            </span>
          </span>
        </span>
        <input
          inputMode="numeric"
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="소득공제 모두 뺀 금액 입력 (예: 32000000)"
        />
      </label>
      {result.error ? <p className="mt-2 text-sm text-red-600">{result.error}</p> : null}
      <p className="mt-2 text-xs text-neutral-500">
        소득세법 시행령 [별표 4] 산출세율·누진공제 기준 간이 산출({COMPREHENSIVE_INCOME_TAX_REFERENCE_YEAR}년). 세액공제·분리과세·조세특례 미반영.
      </p>
      <details className="mt-3 text-xs text-neutral-600">
        <summary className="cursor-pointer font-medium text-brand">구간별 세율·누진공제</summary>
        <ul className="mt-2 list-inside list-disc space-y-1">
          {bracketLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>
      {result.data ? (
        <>
          <CalculatorTrustSection
            show
            headlineLabel="예상 세금:"
            amountWon={result.data.tax}
            basisLines={[
              `과세표준 ${won(result.data.taxable)} 구간에 2026년 산출세율·누진공제 적용`,
              `유효세율(참고) 약 ${result.data.eff.toFixed(2)}%`,
            ]}
            formulaModalBody={formulaBody}
          />
          <dl className="mt-4 space-y-2 rounded-xl bg-brand-light p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt>과세표준</dt>
              <dd className="font-semibold">{won(result.data.taxable)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>유효세율(참고)</dt>
              <dd className="font-semibold">{result.data.eff.toFixed(2)}%</dd>
            </div>
          </dl>
          <ResultInsightCard insight={comprehensiveIncomeInsight(result.data.taxable)} />
          <CalculatorEstimateNotice>
            <p>
              과세표준만으로 산출세율표를 적용한 참고치입니다. 세액공제·분리과세·조세특례 등이
              반영되지 않아 신고서상 세액과 다를 수 있으며, 최종 납부액은 전문가 확인이
              필요합니다.
            </p>
          </CalculatorEstimateNotice>
        </>
      ) : (
        <p className="mt-4 text-sm text-neutral-600">과세표준을 입력하세요.</p>
      )}
      <CalculatorConsultCta
        calculatorLabel="종합소득세"
        defaultSituation="income_tax"
        resultSummary={summary}
        disabled={!result.data}
        calculatorSlug="comprehensive_income"
        resultBand={ctaBand}
        estimatedTaxWon={result.data?.tax ?? null}
      />
      </section>
    </div>
  );
}
