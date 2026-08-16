"use client";

import { useMemo, useState } from "react";
import { CalculatorConsultCta } from "@/components/CalculatorConsultCta";
import { CalculatorEstimateNotice } from "@/components/CalculatorEstimateNotice";
import { AdvisorCostBenefitCalculator } from "@/components/calculators/AdvisorCostBenefitCalculator";
import { CalculatorTrustSection } from "@/components/calculators/CalculatorTrustSection";
import { ResultInsightCard } from "@/components/calculators/ResultInsightCard";
import { VatFilingDecisionCalculator } from "@/components/calculators/VatFilingDecisionCalculator";
import { vatInsight } from "@/lib/calculator-insights";
import { parsePositiveWonString } from "@/lib/calculator-input";
import {
  calculateVatFromGrossAmount,
  calculateVatFromSupplyAmount,
} from "@/lib/calculators/vat";
import { bandVat } from "@/lib/calculator-cta-bands";

function won(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

type VatInputMode = "supply" | "gross";

export function VatCalculator() {
  const [mode, setMode] = useState<VatInputMode>("supply");
  const [amount, setAmount] = useState("");

  const result = useMemo(() => {
    const p = parsePositiveWonString(amount);
    if (!p.ok) return { err: amount.trim() ? p.error : null, data: null as null };
    if (mode === "supply") {
      return { err: null as string | null, data: { mode, ...calculateVatFromSupplyAmount(p.value) } };
    }
    return { err: null as string | null, data: { mode, ...calculateVatFromGrossAmount(p.value) } };
  }, [amount, mode]);

  const summary =
    result.data != null
      ? result.data.mode === "supply"
        ? `공급가액 ${won(result.data.supplyAmount)}, 부가세 참고치(간이) ${won(result.data.vat)}, 합계 ${won(result.data.grossTotal)}`
        : `총액(세포함) ${won(result.data.grossTotal)}, 부가세 참고치(간이) ${won(result.data.vat)}, 공급가액(역산) ${won(result.data.supplyAmount)}`
      : null;

  const ctaBand = useMemo(
    () => (result.data != null ? bandVat(result.data.vat) : "low"),
    [result.data],
  );

  const formulaBody = useMemo(() => {
    if (!result.data) return null;
    if (result.data.mode === "supply") {
      return (
        <pre className="whitespace-pre-wrap font-sans text-sm">
          {`부가세 = floor(공급가액 × 10%)\n     = floor(${result.data.supplyAmount.toLocaleString("ko-KR")} × 0.1)\n     = ${result.data.vat.toLocaleString("ko-KR")}원\n합계 = 공급가액 + 부가세`}
        </pre>
      );
    }
    return (
      <pre className="whitespace-pre-wrap font-sans text-sm">
        {`부가세 = floor(총액 × 10 ÷ 110)\n     = floor(${result.data.grossTotal.toLocaleString("ko-KR")} × 10 ÷ 110)\n     = ${result.data.vat.toLocaleString("ko-KR")}원\n공급가액 = 총액 − 부가세`}
      </pre>
    );
  }, [result.data]);

  return (
    <div className="space-y-6">
      <VatFilingDecisionCalculator />
      <AdvisorCostBenefitCalculator
        contextLabel="부가세"
        defaultSituation="income_tax"
        defaultTaxRatePercent={10}
        defaultAdvisorFeeManwon="30"
        defaultMissedDeductionManwon="100"
      />
      <section className="rounded-xl bg-white p-4 shadow-md sm:p-6">
        <div className="mb-5 border-b border-neutral-100 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B7791F]">VAT amount</p>
          <h2 className="mt-2 text-2xl font-bold text-neutral-950">부가세 금액 간이 계산</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            신고 판단 후 실제 거래 금액의 공급가액·부가세·합계금액을 빠르게 역산합니다.
          </p>
        </div>
      <label className="block text-sm font-medium text-neutral-800">
        <span className="inline-flex items-center gap-1.5">
          입력 금액 기준
          <span className="group relative inline-flex cursor-help items-center justify-center">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#cbd5e1] text-[10px] font-bold text-[#64748b]">
              ?
            </span>
            <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 w-56 -translate-x-1/2 rounded-lg bg-[#0f1e3d] px-2.5 py-2 text-[11px] font-normal leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              공급가액만 입력하거나, 이미 부가세가 포함된 총액을 입력할 수 있습니다.
            </span>
          </span>
        </span>
        <select
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5"
          value={mode}
          onChange={(e) => setMode(e.target.value as VatInputMode)}
        >
          <option value="supply">공급가액 (과세표준, 부가세 별도)</option>
          <option value="gross">총액 (부가세 포함 110/110)</option>
        </select>
      </label>
      <label className="mt-4 block text-sm font-medium text-neutral-800">
        <span className="inline-flex items-center gap-1.5">
          {mode === "supply" ? "공급가액 (원)" : "총액·부가세 포함 금액 (원)"}
          <span className="group relative inline-flex cursor-help items-center justify-center">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#cbd5e1] text-[10px] font-bold text-[#64748b]">
              ?
            </span>
            <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 w-56 -translate-x-1/2 rounded-lg bg-[#0f1e3d] px-2.5 py-2 text-[11px] font-normal leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {mode === "supply"
                ? "공급가액에 10%를 곱해 부가세를 산출합니다."
                : "총액에서 부가세를 역산합니다(세액 = 총액×10÷110, 원 미만 절사)."}
            </span>
          </span>
        </span>
        <input
          inputMode="numeric"
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="10% 세율 적용"
        />
      </label>
      {result.err ? <p className="mt-2 text-sm text-red-600">{result.err}</p> : null}
      <p className="mt-2 text-xs text-neutral-500">
        일반 과세 10% 간이 계산. 영세·면세·매입세액공제·간이과세·불공제 미반영.
      </p>
      {result.data ? (
        <>
          <CalculatorTrustSection
            show
            headlineLabel="예상 세금:"
            amountWon={result.data.vat}
            basisLines={[
              mode === "supply" ? "공급가액 기준 10% 부가세" : "총액 기준 10/110 역산 부가세",
            ]}
            formulaModalBody={formulaBody}
          />
          <dl className="mt-4 space-y-2 rounded-xl bg-brand-light p-4 text-sm">
            <div className="flex justify-between">
              <dt>{result.data.mode === "supply" ? "합계 (공급가+세)" : "공급가액 (역산)"}</dt>
              <dd className="font-semibold">
                {won(result.data.mode === "supply" ? result.data.grossTotal : result.data.supplyAmount)}
              </dd>
            </div>
          </dl>
          <ResultInsightCard
            insight={vatInsight({ supplyWon: result.data.supplyAmount, vatWon: result.data.vat })}
          />
          <CalculatorEstimateNotice>
            <p>
              일반과세 10%와 원 미만 절사만 반영한 참고치입니다. 면세·영세·매입공제·카드·
              간이과세 등은 빠져 있어 세금계산서·신고서 금액과 다를 수 있으며, 실제 신고는
              전문가 확인이 필요합니다.
            </p>
          </CalculatorEstimateNotice>
        </>
      ) : (
        <p className="mt-4 text-sm text-neutral-600">금액을 입력하세요.</p>
      )}
      <CalculatorConsultCta
        calculatorLabel="부가세"
        defaultSituation="income_tax"
        resultSummary={summary}
        disabled={!result.data}
        calculatorSlug="vat"
        resultBand={ctaBand}
      />
      </section>
    </div>
  );
}
