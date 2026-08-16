"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalculatorConsultCta } from "@/components/CalculatorConsultCta";
import { CalculatorEstimateNotice } from "@/components/CalculatorEstimateNotice";
import {
  formatGroupedNumericInput,
  parseNonNegativeManwonString,
} from "@/lib/calculator-input";
import {
  calculateAdvisorCostBenefit,
  type AdvisorCostBenefitResult,
} from "@/lib/calculators/advisor-cost-benefit";
import type { ResultBand } from "@/lib/calculator-cta-bands";
import { trackSiteEvent } from "@/lib/site-track";

type AdvisorCostBenefitCalculatorProps = {
  contextLabel: string;
  defaultSituation?: string;
  defaultTaxRatePercent?: number;
  defaultAdvisorFeeManwon?: string;
  defaultMissedDeductionManwon?: string;
};

function won(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

function manwonInputToWon(raw: string) {
  return parseNonNegativeManwonString(raw);
}

function tone(result: AdvisorCostBenefitResult): {
  badge: string;
  bg: string;
  text: string;
  band: ResultBand;
} {
  if (result.recommendation === "advisor") {
    return {
      badge: "전문가 검토 유리",
      bg: "bg-red-50 border-negative",
      text: "text-negative-deep",
      band: "high",
    };
  }
  if (result.recommendation === "borderline") {
    return {
      badge: "비교견적 구간",
      bg: "bg-[#FFFBEb] border-warning",
      text: "text-warning-content",
      band: "mid",
    };
  }
  return {
    badge: "직접 처리 검토",
    bg: "bg-positive-pale border-positive",
    text: "text-positive-deep",
    band: "low",
  };
}

function MoneyInput({
  label,
  value,
  onChange,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper: string;
}) {
  return (
    <label className="block text-sm font-medium text-neutral-800">
      {label}
      <div className="mt-1 flex overflow-hidden rounded-xl border border-neutral-200 bg-white focus-within:border-[#1F4D3A]">
        <input
          inputMode="numeric"
          className="min-w-0 flex-1 px-3 py-2.5 outline-none"
          value={value}
          onChange={(e) => onChange(formatGroupedNumericInput(e.target.value))}
          placeholder="0"
        />
        <span className="flex items-center border-l border-neutral-200 bg-[#F8FAF8] px-3 text-sm text-neutral-500">
          만원
        </span>
      </div>
      <span className="mt-1 block text-xs font-normal text-neutral-500">{helper}</span>
    </label>
  );
}

export function AdvisorCostBenefitCalculator({
  contextLabel,
  defaultSituation = "income_tax",
  defaultTaxRatePercent = 10,
  defaultAdvisorFeeManwon = "30",
  defaultMissedDeductionManwon = "100",
}: AdvisorCostBenefitCalculatorProps) {
  const trackedResultRef = useRef<string | null>(null);
  const [advisorFee, setAdvisorFee] = useState(defaultAdvisorFeeManwon);
  const [missedDeduction, setMissedDeduction] = useState(defaultMissedDeductionManwon);
  const [taxRatePercent, setTaxRatePercent] = useState(String(defaultTaxRatePercent));
  const [penaltyRisk, setPenaltyRisk] = useState("0");
  const [timeHours, setTimeHours] = useState("4");
  const [hourlyValue, setHourlyValue] = useState("3");

  const result = useMemo(() => {
    const fee = manwonInputToWon(advisorFee);
    const missed = manwonInputToWon(missedDeduction);
    const penalty = manwonInputToWon(penaltyRisk);
    const hourly = manwonInputToWon(hourlyValue);
    if (!fee.ok || !missed.ok || !penalty.ok || !hourly.ok) return null;
    return calculateAdvisorCostBenefit({
      advisorFeeWon: fee.value,
      missedDeductionWon: missed.value,
      taxRatePercent: Number(taxRatePercent.replace(/[^0-9.]/g, "")) || 0,
      penaltyRiskWon: penalty.value,
      timeHours: Number(timeHours.replace(/[^0-9.]/g, "")) || 0,
      hourlyValueWon: hourly.value,
    });
  }, [advisorFee, missedDeduction, penaltyRisk, taxRatePercent, timeHours, hourlyValue]);

  const currentTone = result ? tone(result) : null;
  const resultSummary =
    result != null
      ? `${contextLabel} 세무사비 손익 판단: ${result.title}. 기대 이익 ${won(result.estimatedBenefitWon)}, 순이익 ${won(result.netBenefitWon)}.`
      : null;

  useEffect(() => {
    if (!result || !currentTone) return;
    const trackingKey = `${contextLabel}:${result.recommendation}:${result.netBenefitWon}:${advisorFee}:${missedDeduction}:${taxRatePercent}:${penaltyRisk}:${timeHours}:${hourlyValue}`;
    if (trackedResultRef.current === trackingKey) return;
    trackedResultRef.current = trackingKey;

    trackSiteEvent("calculator_result_view", {
      calculatorType: "advisor_roi",
      resultBand: currentTone.band,
      contextLabel,
      recommendation: result.recommendation,
      estimatedBenefitWon: result.estimatedBenefitWon,
      netBenefitWon: result.netBenefitWon,
    });
  }, [
    advisorFee,
    contextLabel,
    currentTone,
    hourlyValue,
    missedDeduction,
    penaltyRisk,
    result,
    taxRatePercent,
    timeHours,
  ]);

  return (
    <section className="rounded-xl bg-white p-4 shadow-md sm:p-6">
      <div className="border-b border-neutral-100 pb-5">
        <p className="text-xs font-bold uppercase text-warning-content">Advisor ROI</p>
        <h2 className="mt-2 text-2xl font-bold text-neutral-950">세무사비, 쓰는 게 이득인지 계산</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
          세무사 비용을 단순 지출로 보지 않고, 공제 누락 방지·가산세 리스크·직접 처리 시간까지
          합산해 손익을 비교합니다.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <MoneyInput
              label="예상 세무사 비용"
              value={advisorFee}
              onChange={setAdvisorFee}
              helper="부가세 단건, 종소세 신고, 1회 검토 비용 등"
            />
            <MoneyInput
              label="놓칠 수 있는 비용·공제"
              value={missedDeduction}
              onChange={setMissedDeduction}
              helper="매입자료, 경비, 공제 항목 중 누락 가능 금액"
            />
            <label className="block text-sm font-medium text-neutral-800">
              적용 세율
              <div className="mt-1 flex overflow-hidden rounded-xl border border-neutral-200 bg-white focus-within:border-[#1F4D3A]">
                <input
                  inputMode="decimal"
                  className="min-w-0 flex-1 px-3 py-2.5 outline-none"
                  value={taxRatePercent}
                  onChange={(e) => setTaxRatePercent(e.target.value)}
                />
                <span className="flex items-center border-l border-neutral-200 bg-[#F8FAF8] px-3 text-sm text-neutral-500">
                  %
                </span>
              </div>
              <span className="mt-1 block text-xs font-normal text-neutral-500">부가세는 10%, 종소세는 예상 구간 세율 입력</span>
            </label>
            <MoneyInput
              label="가산세·오류 리스크"
              value={penaltyRisk}
              onChange={setPenaltyRisk}
              helper="신고 지연, 자료 누락, 수정신고 가능성을 금액으로 반영"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-neutral-800">
              직접 처리 예상 시간
              <div className="mt-1 flex overflow-hidden rounded-xl border border-neutral-200 bg-white focus-within:border-[#1F4D3A]">
                <input
                  inputMode="decimal"
                  className="min-w-0 flex-1 px-3 py-2.5 outline-none"
                  value={timeHours}
                  onChange={(e) => setTimeHours(e.target.value)}
                />
                <span className="flex items-center border-l border-neutral-200 bg-[#F8FAF8] px-3 text-sm text-neutral-500">
                  시간
                </span>
              </div>
            </label>
            <MoneyInput
              label="내 시간가치"
              value={hourlyValue}
              onChange={setHourlyValue}
              helper="직접 처리에 쓰는 1시간의 기회비용"
            />
          </div>
        </div>

        {result && currentTone ? (
          <div className={`rounded-xl border p-5 ${currentTone.bg}`}>
            <p className={`inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold ${currentTone.text}`}>
              {currentTone.badge}
            </p>
            <h3 className="mt-4 text-xl font-bold text-neutral-950">{result.title}</h3>
            <p className="mt-2 text-sm leading-6 text-neutral-700">{result.summary}</p>
            <dl className="mt-5 grid gap-3 rounded-xl bg-white/75 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">기대 이익</dt>
                <dd className="font-bold text-neutral-950">{won(result.estimatedBenefitWon)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">세무사비 차감 후</dt>
                <dd className={`font-bold ${result.netBenefitWon >= 0 ? "text-positive-deep" : "text-negative-deep"}`}>
                  {won(result.netBenefitWon)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">공제 누락 방지 효과</dt>
                <dd className="font-semibold text-neutral-800">{won(result.taxSavingFromDeductionWon)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">시간가치</dt>
                <dd className="font-semibold text-neutral-800">{won(result.timeValueWon)}</dd>
              </div>
            </dl>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-neutral-700">
              {result.reasons.map((reason) => (
                <li key={reason}>- {reason}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="mt-5">
        <CalculatorEstimateNotice>
          <p>
            이 계산은 세무사 비용 대비 기대 손익을 보는 의사결정 도구입니다. 실제 절세액은 소득구간,
            공제 가능 여부, 증빙 상태, 신고 방식에 따라 달라질 수 있습니다.
          </p>
        </CalculatorEstimateNotice>
      </div>

      <div className="mt-5">
        <CalculatorConsultCta
          calculatorLabel={`${contextLabel} 세무사비 손익`}
          defaultSituation={defaultSituation}
          resultSummary={resultSummary}
          disabled={!result}
          emailCapture={false}
          calculatorSlug="advisor_roi"
          resultBand={currentTone?.band ?? "low"}
          titleOverride="세무사비가 이득인지 실제 견적으로 확인해 보세요"
          subtitleOverride="예상 비용과 자료 상태를 보내면 직접 처리, 단건 검토, 월 기장 중 어떤 선택이 나은지 비교할 수 있습니다."
          buttonLabelOverride="세무사비 손익 상담 받기"
        />
      </div>
    </section>
  );
}
