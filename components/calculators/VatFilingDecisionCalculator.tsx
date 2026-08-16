"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalculatorConsultCta } from "@/components/CalculatorConsultCta";
import { CalculatorEstimateNotice } from "@/components/CalculatorEstimateNotice";
import { VatReadinessCheck } from "@/components/VatReadinessCheck";
import {
  formatGroupedNumericInput,
  formatKoreanMoneyFromManwonInput,
  parseNonNegativeManwonString,
} from "@/lib/calculator-input";
import {
  calculateVatFilingDecision,
  type VatFilingRecommendation,
  type VatTaxpayerType,
} from "@/lib/calculators/vat-filing-decision";
import type { ResultBand } from "@/lib/calculator-cta-bands";
import { trackSiteEvent } from "@/lib/site-track";

const recommendationTone: Record<
  VatFilingRecommendation,
  { badge: string; bg: string; text: string; band: ResultBand }
> = {
  self: {
    badge: "직접 신고 가능",
    bg: "bg-positive-pale border-positive",
    text: "text-positive-deep",
    band: "low",
  },
  review: {
    badge: "1회 검토 권장",
    bg: "bg-[#FFFBEb] border-warning",
    text: "text-warning-content",
    band: "mid",
  },
  tax_accountant: {
    badge: "세무사 의뢰 권장",
    bg: "bg-red-50 border-negative",
    text: "text-negative-deep",
    band: "high",
  },
};

function NumberInput({
  label,
  value,
  onChange,
  suffix,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  helper?: string | null;
}) {
  return (
    <label className="block text-sm font-medium text-neutral-800">
      {label}
      <div className="mt-1 flex overflow-hidden rounded-lg border border-line bg-white focus-within:border-positive-deep focus-within:ring-2 focus-within:ring-brand/40">
        <input
          inputMode="numeric"
          className="min-w-0 flex-1 px-3 py-2.5 outline-none"
          value={value}
          onChange={(e) => onChange(formatGroupedNumericInput(e.target.value))}
          placeholder="0"
        />
        {suffix ? (
          <span className="flex items-center border-l border-line bg-surface-muted px-3 text-sm text-ink-muted">
            {suffix}
          </span>
        ) : null}
      </div>
      {helper ? <span className="mt-1 block text-xs font-normal text-neutral-500">{helper}</span> : null}
    </label>
  );
}

function ToggleCheck({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium text-neutral-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[#1F4D3A]"
      />
      <span>{label}</span>
    </label>
  );
}

export function VatFilingDecisionCalculator() {
  const trackedResultRef = useRef<string | null>(null);
  const [taxpayerType, setTaxpayerType] = useState<VatTaxpayerType>("unknown");
  const [annualRevenue, setAnnualRevenue] = useState("");
  const [monthlySalesDocs, setMonthlySalesDocs] = useState("10");
  const [monthlyPurchaseDocs, setMonthlyPurchaseDocs] = useState("5");
  const [hasEmployees, setHasEmployees] = useState(false);
  const [hasPaperOrCashData, setHasPaperOrCashData] = useState(false);
  const [hasOnlineMarketplace, setHasOnlineMarketplace] = useState(true);
  const [hasCrossBorderSales, setHasCrossBorderSales] = useState(false);
  const [isNearDeadline, setIsNearDeadline] = useState(true);

  const revenue = useMemo(() => parseNonNegativeManwonString(annualRevenue), [annualRevenue]);
  const salesDocs = Number(monthlySalesDocs.replace(/,/g, "")) || 0;
  const purchaseDocs = Number(monthlyPurchaseDocs.replace(/,/g, "")) || 0;

  const result = useMemo(() => {
    if (!revenue.ok) return null;
    return calculateVatFilingDecision({
      taxpayerType,
      annualRevenueWon: revenue.value,
      monthlySalesDocs: salesDocs,
      monthlyPurchaseDocs: purchaseDocs,
      hasEmployees,
      hasPaperOrCashData,
      hasOnlineMarketplace,
      hasCrossBorderSales,
      isNearDeadline,
    });
  }, [
    taxpayerType,
    revenue,
    salesDocs,
    purchaseDocs,
    hasEmployees,
    hasPaperOrCashData,
    hasOnlineMarketplace,
    hasCrossBorderSales,
    isNearDeadline,
  ]);

  const tone = result ? recommendationTone[result.recommendation] : recommendationTone.review;
  const revenueHelper = annualRevenue ? formatKoreanMoneyFromManwonInput(annualRevenue) : "만원 단위로 입력";
  const resultSummary = result
    ? `부가세 신고 복잡도 진단: ${result.title}. 복잡도 지수 ${result.score}/100. 주요 사유: ${result.reasons.join(" / ")}`
    : null;
  const decisionInput = result
    ? {
        taxpayerType,
        annualRevenueWon: revenue.ok ? revenue.value : 0,
        monthlySalesDocs: salesDocs,
        monthlyPurchaseDocs: purchaseDocs,
        hasEmployees,
        hasPaperOrCashData,
        hasOnlineMarketplace,
        hasCrossBorderSales,
        isNearDeadline,
      }
    : null;

  useEffect(() => {
    if (!result) return;
    const trackingKey = `${result.recommendation}:${result.score}:${taxpayerType}:${annualRevenue}:${monthlySalesDocs}:${monthlyPurchaseDocs}`;
    if (trackedResultRef.current === trackingKey) return;
    trackedResultRef.current = trackingKey;

    trackSiteEvent("calculator_result_view", {
      calculatorType: "vat_decision",
      resultBand: tone.band,
      recommendation: result.recommendation,
      score: result.score,
      taxpayerType,
      annualRevenueManwon: annualRevenue,
      monthlySalesDocs: salesDocs,
      monthlyPurchaseDocs: purchaseDocs,
    });
  }, [
    annualRevenue,
    monthlyPurchaseDocs,
    monthlySalesDocs,
    purchaseDocs,
    result,
    salesDocs,
    taxpayerType,
    tone.band,
  ]);

  return (
    <section className="rounded-xl bg-white p-4 shadow-md sm:p-6">
      <div className="flex flex-col gap-3 border-b border-neutral-100 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-warning-content">VAT filing decision</p>
          <h2 className="mt-2 text-2xl font-bold text-neutral-950">부가세 신고 복잡도 진단</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            매출 규모보다 중요한 것은 자료 복잡도입니다. 과세유형, 매입자료, 플랫폼 정산, 직원 여부를 넣으면
            직접 신고 전 확인할 항목과 전문가 검토 필요성을 빠르게 구분합니다.
          </p>
        </div>
        {result ? (
          <div className={`rounded-xl border px-4 py-3 text-right ${tone.bg}`}>
            <p className={`text-xs font-bold ${tone.text}`}>{tone.badge}</p>
            <p className="mt-1 text-2xl font-black text-neutral-950">{result.score}/100</p>
            <p className="mt-1 text-xs text-neutral-600">복잡도 지수</p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          <label className="block text-sm font-medium text-neutral-800">
            과세 유형
            <select
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5"
              value={taxpayerType}
              onChange={(e) => setTaxpayerType(e.target.value as VatTaxpayerType)}
            >
              <option value="unknown">아직 모름</option>
              <option value="simplified">간이과세자</option>
              <option value="general">일반과세자</option>
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <NumberInput
              label="직전 연매출"
              value={annualRevenue}
              onChange={setAnnualRevenue}
              suffix="만원"
              helper={revenue.ok ? revenueHelper : revenue.error}
            />
            <NumberInput
              label="월 매출자료"
              value={monthlySalesDocs}
              onChange={setMonthlySalesDocs}
              suffix="건"
              helper="카드·현금영수증·세금계산서"
            />
            <NumberInput
              label="월 매입자료"
              value={monthlyPurchaseDocs}
              onChange={setMonthlyPurchaseDocs}
              suffix="건"
              helper="공제 검토할 영수증·계산서"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleCheck checked={hasEmployees} onChange={setHasEmployees} label="직원·원천세·4대보험이 있다" />
            <ToggleCheck checked={hasPaperOrCashData} onChange={setHasPaperOrCashData} label="종이 세금계산서나 현금매출이 있다" />
            <ToggleCheck checked={hasOnlineMarketplace} onChange={setHasOnlineMarketplace} label="스마트스토어·쿠팡 등 플랫폼 정산이 있다" />
            <ToggleCheck checked={hasCrossBorderSales} onChange={setHasCrossBorderSales} label="구매대행·역직구·해외판매가 있다" />
            <ToggleCheck checked={isNearDeadline} onChange={setIsNearDeadline} label="신고 마감이 임박했다" />
          </div>
        </div>

        {result ? (
          <div className={`rounded-xl border p-5 ${tone.bg}`}>
            <p className={`inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold ${tone.text}`}>
              {tone.badge}
            </p>
            <h3 className="mt-4 text-xl font-bold text-neutral-950">{result.title}</h3>
            <p className="mt-2 text-sm leading-6 text-neutral-700">{result.summary}</p>

            <div className="mt-5">
              <p className="text-sm font-bold text-neutral-950">판단 사유</p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-neutral-700">
                {result.reasons.slice(0, 4).map((reason) => (
                  <li key={reason}>- {reason}</li>
                ))}
              </ul>
            </div>

            <div className="mt-5">
              <p className="text-sm font-bold text-neutral-950">다음 행동</p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-neutral-700">
                {result.nextActions.map((action) => (
                  <li key={action}>- {action}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>

      {result ? (
        <div className="mt-5 grid gap-3 rounded-lg border border-line bg-surface-muted p-4 text-sm text-ink-muted md:grid-cols-3">
          {result.checkpoints.map((checkpoint) => (
            <p key={checkpoint}>{checkpoint}</p>
          ))}
        </div>
      ) : null}

      {result && decisionInput ? (
        <VatReadinessCheck decisionInput={decisionInput} decisionResult={result} />
      ) : null}

      <div className="mt-5">
        <CalculatorEstimateNotice>
          <p>
            이 진단은 신고 난이도와 자료 누락 가능성을 보는 참고 도구입니다. 실제 과세유형, 신고 의무, 납부세액,
            가산세 여부는 홈택스·국세청 기준과 세부 업종에 따라 달라질 수 있습니다.
          </p>
        </CalculatorEstimateNotice>
      </div>

      <div className="mt-5">
        <CalculatorConsultCta
          calculatorLabel="부가세 신고 판단"
          defaultSituation="income_tax"
          resultSummary={resultSummary}
          disabled={!result}
          emailCapture={false}
          calculatorSlug="vat_decision"
          resultBand={tone.band}
          titleOverride={
            result?.recommendation === "self"
              ? "직접 신고 전 마지막 점검만 받아도 충분할 수 있어요"
              : "부가세 신고 자료를 세무사에게 바로 검토받아 보세요"
          }
          subtitleOverride="매출·매입 자료 구조를 함께 보내면 누락 공제와 신고 리스크를 빠르게 확인할 수 있습니다."
          buttonLabelOverride={
            result?.recommendation === "self" ? "직접 신고 체크 상담하기" : "부가세 신고 상담 요청하기"
          }
        />
      </div>
    </section>
  );
}
