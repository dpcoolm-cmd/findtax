"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalculatorConsultCta } from "@/components/CalculatorConsultCta";
import { CalculatorEstimateNotice } from "@/components/CalculatorEstimateNotice";
import {
  formatGroupedNumericInput,
  formatKoreanMoneyFromManwonInput,
  parseNonNegativeManwonString,
} from "@/lib/calculator-input";
import type { ResultBand } from "@/lib/calculator-cta-bands";
import {
  calculateIncomeFilingDecision,
  type IncomeFilingRecommendation,
  type IncomeFilingSource,
} from "@/lib/calculators/income-filing-decision";
import { trackSiteEvent } from "@/lib/site-track";

const sourceLabels: Record<IncomeFilingSource, string> = {
  employment_only: "근로소득 중심",
  freelance: "프리랜서·3.3%",
  business: "개인사업자",
  side_hustle: "직장인 부업",
  rental: "임대소득",
  mixed: "여러 소득 혼합",
};

const toneByRecommendation: Record<
  IncomeFilingRecommendation,
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

function MoneyInput({
  label,
  value,
  onChange,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string | null;
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
      {helper ? <span className="mt-1 block text-xs font-normal text-neutral-500">{helper}</span> : null}
    </label>
  );
}

function CountInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
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
          placeholder="1"
        />
        <span className="flex items-center border-l border-neutral-200 bg-[#F8FAF8] px-3 text-sm text-neutral-500">
          곳
        </span>
      </div>
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

export function IncomeFilingDecisionCalculator() {
  const trackedResultRef = useRef<string | null>(null);
  const [source, setSource] = useState<IncomeFilingSource>("side_hustle");
  const [annualIncome, setAnnualIncome] = useState("");
  const [annualExpense, setAnnualExpense] = useState("");
  const [withholding, setWithholding] = useState("");
  const [incomePayersCount, setIncomePayersCount] = useState("1");
  const [hasBookkeepingNotice, setHasBookkeepingNotice] = useState(false);
  const [hasVatBusiness, setHasVatBusiness] = useState(false);
  const [hasEmployees, setHasEmployees] = useState(false);
  const [hasPlatformOrForeignIncome, setHasPlatformOrForeignIncome] = useState(true);
  const [hasMissingReceipts, setHasMissingReceipts] = useState(false);
  const [isNearDeadline, setIsNearDeadline] = useState(false);

  const parsedIncome = useMemo(() => parseNonNegativeManwonString(annualIncome), [annualIncome]);
  const parsedExpense = useMemo(() => parseNonNegativeManwonString(annualExpense), [annualExpense]);
  const parsedWithholding = useMemo(() => parseNonNegativeManwonString(withholding), [withholding]);
  const payers = Number(incomePayersCount.replace(/,/g, "")) || 0;

  const result = useMemo(() => {
    if (!parsedIncome.ok || !parsedExpense.ok || !parsedWithholding.ok) return null;
    return calculateIncomeFilingDecision({
      source,
      annualIncomeWon: parsedIncome.value,
      annualExpenseWon: parsedExpense.value,
      withholdingWon: parsedWithholding.value,
      incomePayersCount: payers,
      hasBookkeepingNotice,
      hasVatBusiness,
      hasEmployees,
      hasPlatformOrForeignIncome,
      hasMissingReceipts,
      isNearDeadline,
    });
  }, [
    source,
    parsedIncome,
    parsedExpense,
    parsedWithholding,
    payers,
    hasBookkeepingNotice,
    hasVatBusiness,
    hasEmployees,
    hasPlatformOrForeignIncome,
    hasMissingReceipts,
    isNearDeadline,
  ]);

  const tone = result ? toneByRecommendation[result.recommendation] : toneByRecommendation.review;
  const resultSummary = result
    ? `종합소득세 신고 판단: ${result.title}. 난이도 점수 ${result.score}/100. 소득 유형: ${sourceLabels[source]}. 주요 사유: ${result.reasons.join(" / ")}`
    : null;

  useEffect(() => {
    if (!result) return;
    const trackingKey = `${result.recommendation}:${result.score}:${source}:${annualIncome}:${annualExpense}:${withholding}:${incomePayersCount}`;
    if (trackedResultRef.current === trackingKey) return;
    trackedResultRef.current = trackingKey;

    trackSiteEvent("calculator_result_view", {
      calculatorType: "income_decision",
      resultBand: tone.band,
      recommendation: result.recommendation,
      score: result.score,
      source,
      annualIncomeManwon: annualIncome,
      annualExpenseManwon: annualExpense,
      withholdingManwon: withholding,
      incomePayersCount: payers,
    });
  }, [
    annualExpense,
    annualIncome,
    incomePayersCount,
    payers,
    result,
    source,
    tone.band,
    withholding,
  ]);

  return (
    <section className="rounded-xl bg-white p-4 shadow-md sm:p-6">
      <div className="flex flex-col gap-3 border-b border-neutral-100 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-warning-content">Income filing decision</p>
          <h2 className="mt-2 text-2xl font-bold text-neutral-950">
            종합소득세, 직접 신고할지 세무사에게 맡길지 판단
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            부업, 프리랜서, 개인사업자, 임대소득처럼 소득원이 섞일수록 신고 난이도가 올라갑니다.
            수입·비용·원천징수·증빙 상태를 넣고 직접 신고 가능성을 먼저 확인하세요.
          </p>
        </div>
        {result ? (
          <div className={`rounded-xl border px-4 py-3 text-right ${tone.bg}`}>
            <p className={`text-xs font-bold ${tone.text}`}>{tone.badge}</p>
            <p className="mt-1 text-2xl font-black text-neutral-950">{result.score}/100</p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="grid gap-4">
          <label className="block text-sm font-medium text-neutral-800">
            주된 소득 유형
            <select
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5"
              value={source}
              onChange={(e) => setSource(e.target.value as IncomeFilingSource)}
            >
              {Object.entries(sourceLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MoneyInput
              label="연 수입금액"
              value={annualIncome}
              onChange={setAnnualIncome}
              helper={annualIncome ? formatKoreanMoneyFromManwonInput(annualIncome) : "매출·프리랜서 수입 합계"}
            />
            <MoneyInput
              label="연 비용"
              value={annualExpense}
              onChange={setAnnualExpense}
              helper={annualExpense ? formatKoreanMoneyFromManwonInput(annualExpense) : "업무 관련 경비"}
            />
            <MoneyInput
              label="원천징수액"
              value={withholding}
              onChange={setWithholding}
              helper={withholding ? formatKoreanMoneyFromManwonInput(withholding) : "3.3% 등 이미 뗀 세금"}
            />
            <CountInput label="소득 지급처" value={incomePayersCount} onChange={setIncomePayersCount} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleCheck checked={hasBookkeepingNotice} onChange={setHasBookkeepingNotice} label="기장의무·장부 안내를 받았다" />
            <ToggleCheck checked={hasVatBusiness} onChange={setHasVatBusiness} label="부가세 신고 대상 사업소득이 있다" />
            <ToggleCheck checked={hasEmployees} onChange={setHasEmployees} label="직원·외주 인건비 지급이 있다" />
            <ToggleCheck checked={hasPlatformOrForeignIncome} onChange={setHasPlatformOrForeignIncome} label="플랫폼·해외 정산 소득이 있다" />
            <ToggleCheck checked={hasMissingReceipts} onChange={setHasMissingReceipts} label="증빙 없는 비용이 섞여 있다" />
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
        <div className="mt-5 rounded-xl border border-neutral-200 bg-[#F8FAF8] p-4">
          <p className="text-sm font-bold text-neutral-950">상담·신고 전 준비자료</p>
          <div className="mt-3 grid gap-2 text-sm text-neutral-700 md:grid-cols-2">
            {result.documents.map((document) => (
              <p key={document}>- {document}</p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5">
        <CalculatorEstimateNotice>
          <p>
            이 진단은 신고 난이도와 자료 누락 가능성을 보는 참고 도구입니다. 실제 기장의무,
            경비 인정, 세액공제, 분리과세 여부는 홈택스 신고 안내문과 세부 사실관계에 따라 달라질 수 있습니다.
          </p>
        </CalculatorEstimateNotice>
      </div>

      <div className="mt-5">
        <CalculatorConsultCta
          calculatorLabel="종합소득세 신고 판단"
          defaultSituation="income_tax"
          resultSummary={resultSummary}
          disabled={!result}
          emailCapture={false}
          calculatorSlug="income_decision"
          resultBand={tone.band}
          titleOverride={
            result?.recommendation === "self"
              ? "직접 신고 전 마지막 체크만 받아도 충분할 수 있어요"
              : "종합소득세 자료를 세무사에게 바로 검토받아 보세요"
          }
          subtitleOverride="소득 유형과 증빙 상태를 함께 보내면 직접 신고 가능성과 절세 포인트를 빠르게 확인할 수 있습니다."
          buttonLabelOverride={
            result?.recommendation === "self" ? "직접 신고 체크 상담하기" : "종합소득세 상담 요청하기"
          }
        />
      </div>
    </section>
  );
}
