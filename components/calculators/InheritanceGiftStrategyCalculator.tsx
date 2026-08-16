"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalculatorConsultCta } from "@/components/CalculatorConsultCta";
import { HomeAtozCta } from "@/components/HomeAtozCta";
import { CalculatorEstimateNotice } from "@/components/CalculatorEstimateNotice";
import { DecisionSummaryCard } from "@/components/calculators/DecisionSummaryCard";
import {
  formatGroupedNumericInput,
  formatKoreanMoneyFromManwonInput,
  parseNonNegativeManwonString,
  parsePositiveManwonString,
} from "@/lib/calculator-input";
import { calculateInheritanceGiftStrategy } from "@/lib/calculators/inheritance-gift-strategy";
import { trackSiteEvent } from "@/lib/site-track";

function won(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

function formatMoneyInput(raw: string): string {
  return formatGroupedNumericInput(raw);
}

function formatIntegerInput(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

function formatDecimalInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join("")}`;
}

function HelpTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex cursor-help items-center justify-center">
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#cbd5e1] text-[10px] font-bold text-[#64748b]">
        ?
      </span>
      <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 w-60 -translate-x-1/2 rounded-lg bg-[#0f1e3d] px-2.5 py-2 text-[11px] font-normal leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  tooltip,
  helpText,
  showAmountHint = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  tooltip?: string;
  helpText?: string;
  showAmountHint?: boolean;
}) {
  const amountHint = showAmountHint === false ? null : formatKoreanMoneyFromManwonInput(value);
  return (
    <label className="text-sm font-medium text-neutral-800">
      <span className="inline-flex items-center gap-1.5">
        {label}
        {tooltip ? <HelpTip text={tooltip} /> : null}
      </span>
      <input
        inputMode="numeric"
        className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-brand focus:outline-none"
        value={value}
        onChange={(e) => onChange(formatMoneyInput(e.target.value))}
        placeholder={placeholder ?? "숫자만 입력"}
      />
      {amountHint ? <p className="mt-1 text-xs font-medium text-neutral-500">{amountHint}</p> : null}
      {helpText ? <p className="mt-1 text-xs font-normal leading-relaxed text-neutral-500">{helpText}</p> : null}
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
  tooltip,
  mode = "int",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  tooltip?: string;
  mode?: "int" | "decimal";
}) {
  return (
    <label className="text-sm font-medium text-neutral-800">
      <span className="inline-flex items-center gap-1.5">
        {label}
        {tooltip ? <HelpTip text={tooltip} /> : null}
      </span>
      <input
        inputMode="decimal"
        className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-brand focus:outline-none"
        value={value}
        onChange={(e) =>
          onChange(mode === "decimal" ? formatDecimalInput(e.target.value) : formatIntegerInput(e.target.value))
        }
        placeholder={placeholder}
      />
    </label>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
  sub,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-3 hover:bg-neutral-50">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="min-w-0">
        <span className="text-sm font-medium text-neutral-800">{label}</span>
        {sub ? <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">{sub}</span> : null}
      </span>
    </label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-widest text-neutral-400">{children}</p>;
}

export function InheritanceGiftStrategyCalculator() {
  const [totalAsset, setTotalAsset] = useState("");
  const [plannedGiftNow, setPlannedGiftNow] = useState("");
  const [annualGrowthRate, setAnnualGrowthRate] = useState("3");
  const [yearsUntilInheritance, setYearsUntilInheritance] = useState("10");
  const [hasSpouse, setHasSpouse] = useState(true);
  const [childCount, setChildCount] = useState("1");
  const [adjustment, setAdjustment] = useState("");
  const lastTrackedKey = useRef<string | null>(null);

  const result = useMemo(() => {
    const parsedTotalAsset = parsePositiveManwonString(totalAsset);
    if (!parsedTotalAsset.ok) {
      return { err: totalAsset.trim() ? parsedTotalAsset.error : null, data: null };
    }

    const parsedGiftNow = plannedGiftNow.trim()
      ? parsePositiveManwonString(plannedGiftNow)
      : { ok: true as const, value: 0 };
    if (!parsedGiftNow.ok) return { err: parsedGiftNow.error, data: null };

    const parsedAdjustment = adjustment.trim()
      ? parseNonNegativeManwonString(adjustment)
      : { ok: true as const, value: 0 };
    if (!parsedAdjustment.ok) return { err: parsedAdjustment.error, data: null };

    const years = yearsUntilInheritance.trim() ? Number(yearsUntilInheritance) : 0;
    if (!Number.isFinite(years) || years <= 0) {
      return { err: "상속 예상 시점은 1년 이상으로 입력해 주세요.", data: null };
    }

    const rate = annualGrowthRate.trim() ? Number(annualGrowthRate) : 0;
    if (!Number.isFinite(rate) || rate < 0) {
      return { err: "자산 성장률은 0 이상 숫자로 입력해 주세요.", data: null };
    }

    const data = calculateInheritanceGiftStrategy({
      totalAssetWon: parsedTotalAsset.value,
      plannedGiftNowWon: parsedGiftNow.value,
      annualGrowthRatePct: rate,
      yearsUntilInheritance: years,
      hasSpouse,
      childCount: childCount.trim() ? Number(childCount) : 0,
      adjustmentWon: parsedAdjustment.value,
    });

    return { err: null as string | null, data };
  }, [adjustment, annualGrowthRate, childCount, hasSpouse, plannedGiftNow, totalAsset, yearsUntilInheritance]);

  const noGifteeWarning = useMemo(() => {
    const parsed = plannedGiftNow.trim() ? Number(plannedGiftNow.replace(/,/g, "")) : 0;
    return parsed > 0 && !hasSpouse && Number(childCount || "0") === 0;
  }, [plannedGiftNow, hasSpouse, childCount]);

  const headline = useMemo(() => {
    if (!result.data) return null;
    if (noGifteeWarning) {
      return "증여 대상을 정하지 않아 비교 시나리오가 제한되어 있어요.";
    }
    if (result.data.bestScenarioId === "gift_to_spouse") {
      return "현재 가정에서는 배우자 우선 증여가 가장 유리한 흐름으로 보여요.";
    }
    if (result.data.bestScenarioId === "gift_to_children") {
      return "현재 가정에서는 자녀 분산 증여가 더 유리할 가능성이 보여요.";
    }
    return "현재 가정에서는 바로 증여하기보다 상속 시점까지 구조를 더 보는 편이 유리해 보여요.";
  }, [result.data, noGifteeWarning]);

  const summary = useMemo(() => {
    if (!result.data) return null;
    return `${result.data.bestScenario.title} 기준으로 총 세금 부담을 ${won(
      result.data.bestScenario.totalTaxWon,
    )} 수준의 참고값으로 비교했어요.`;
  }, [result.data]);

  const shareableDecision = useMemo(() => {
    if (!result.data) return null;
    if (result.data.bestScenarioId === "gift_to_spouse") {
      return "현재 조건에서는 배우자에게 먼저 증여하는 쪽이 더 유리할 가능성이 있어 보여요.";
    }
    if (result.data.bestScenarioId === "gift_to_children") {
      return "현재 조건에서는 자녀에게 나눠 증여하는 쪽이 더 유리할 가능성이 있어 보여요.";
    }
    return "현재 조건에서는 지금 증여보다 상속 시점까지 구조를 더 살펴보는 편이 좋아 보여요.";
  }, [result.data]);

  const expertCheckPoints = useMemo(() => {
    if (!result.data) return [];
    const points: string[] = [];
    if (Number(yearsUntilInheritance || "0") <= 10 && Number(plannedGiftNow.replace(/,/g, "") || "0") > 0) {
      points.push("상속까지 10년 이내라면 사전증여 합산 여부가 실제 세액을 크게 바꿀 수 있어요.");
    }
    if (Number(totalAsset.replace(/,/g, "") || "0") >= 100000) {
      points.push("부동산 평가, 금융자산 구성, 채무 반영 여부에 따라 실제 상속·증여세가 크게 달라질 수 있어요.");
    }
    if (result.data.limitations.length > 0) {
      points.push("해외자산, 부담부증여, 특례 적용 여부는 실제 실행 전에 반드시 따로 확인하는 편이 좋아요.");
    }
    return points;
  }, [plannedGiftNow, result.data, totalAsset, yearsUntilInheritance]);

  useEffect(() => {
    if (!result.data) return;
    const key = [
      result.data.bestScenarioId,
      result.data.bestScenario.totalTaxWon,
      result.data.futureAssetIfUntouchedWon,
    ].join("|");
    if (lastTrackedKey.current === key) return;
    lastTrackedKey.current = key;
    trackSiteEvent("calculator_result_view", {
      calculator_type: "inheritance_gift_strategy",
      best_scenario_id: result.data.bestScenarioId,
      best_total_tax_won: result.data.bestScenario.totalTaxWon,
      scenario_count: result.data.scenarios.length,
    });
  }, [result.data]);

  return (
    <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
      <SectionTitle>입력 정보</SectionTitle>
      <p className="mb-4 text-sm leading-relaxed text-neutral-500">
        금액은 모두 <span className="font-medium text-neutral-700">만원 단위</span>로 입력해 주세요.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="현재 총자산"
          value={totalAsset}
          onChange={setTotalAsset}
          placeholder="예: 300000"
          tooltip="부동산, 금융자산, 현금 등을 합친 현재 기준 자산 규모예요."
          helpText="예: 30억원이면 300000"
        />
        <InputField
          label="지금 옮겨볼 금액"
          value={plannedGiftNow}
          onChange={setPlannedGiftNow}
          placeholder="예: 50000"
          tooltip="지금 증여해 볼 금액이에요. 비워두면 상속 중심 비교만 먼저 봅니다."
          helpText="예: 5억원이면 50000"
        />
        <NumberField
          label="연평균 자산 성장률 (%)"
          value={annualGrowthRate}
          onChange={setAnnualGrowthRate}
          placeholder="예: 3"
          tooltip="향후 10~20년 동안 자산이 얼마나 커질지 단순 추정하는 값이에요."
          mode="decimal"
        />
        <NumberField
          label="상속 예상 시점 (년)"
          value={yearsUntilInheritance}
          onChange={setYearsUntilInheritance}
          placeholder="예: 10"
          tooltip="지금부터 상속이 발생한다고 가정하는 시점이에요."
        />
        <NumberField
          label="자녀 수"
          value={childCount}
          onChange={setChildCount}
          placeholder="예: 2"
          tooltip="자녀 분산 증여 시나리오 계산에 사용해요."
        />
        <InputField
          label="채무·공제 등 차감액"
          value={adjustment}
          onChange={setAdjustment}
          placeholder="예: 3000"
          tooltip="증여세 계산에서 바로 뺄 수 있는 금액이 있다면 입력해 주세요."
          helpText="예: 3,000만원이면 3000. 현재는 비교용 단순 계산에만 제한적으로 반영돼요."
        />
        <div className="sm:col-span-2">
          <CheckRow
            checked={hasSpouse}
            onChange={setHasSpouse}
            label="배우자 있음"
            sub="배우자 상속공제와 배우자 증여 시나리오 계산에 반영합니다."
          />
        </div>
      </div>

      {result.err ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{result.err}</p> : null}

      {result.data ? (
        <>
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-lg font-bold text-neutral-900 sm:text-xl">{headline}</p>
            <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-800">
              {result.data.summary}
            </p>
            <div className="mt-4 rounded-2xl bg-brand-light px-4 py-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-dark/70">
                상속만 했을 때 예상 미래 자산
              </p>
              <p className="mt-2 text-3xl font-extrabold text-brand-dark sm:text-4xl">
                {won(result.data.futureAssetIfUntouchedWon)}
              </p>
              <p className="mt-2 text-sm text-brand-dark/80">{result.data.comparisonSummary}</p>
            </div>
          </div>

          {shareableDecision ? (
            <div className="mt-4">
              <DecisionSummaryCard
                summary={shareableDecision}
                description="상속·증여는 시점과 대상이 바뀌면 결과가 크게 달라질 수 있어요."
                onCopy={() =>
                  trackSiteEvent("calculator_summary_copy", {
                    calculator_type: "inheritance_gift_strategy",
                    summary_type: "shareable_decision",
                  })
                }
                onLinkCopy={() =>
                  trackSiteEvent("calculator_link_copy", {
                    calculator_type: "inheritance_gift_strategy",
                    summary_type: "shareable_decision",
                  })
                }
              />
            </div>
          ) : null}

          <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-neutral-900">상속 vs 증여 시나리오 비교</p>
            <div className="mt-3 space-y-3">
              {result.data.scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className={`rounded-xl border px-4 py-4 ${
                    result.data.bestScenarioId === scenario.id ? "border-brand bg-brand-light/50" : "border-neutral-200 bg-neutral-50"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-neutral-900">{scenario.title}</p>
                    {result.data.bestScenarioId === scenario.id ? (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-neutral-900">가장 유리</span>
                    ) : null}
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-white px-3 py-3">
                      <p className="text-xs uppercase tracking-widest text-neutral-500">총 세금</p>
                      <p className="mt-2 text-sm font-bold text-neutral-900">{won(scenario.totalTaxWon)}</p>
                    </div>
                    <div className="rounded-lg bg-white px-3 py-3">
                      <p className="text-xs uppercase tracking-widest text-neutral-500">현재 증여세</p>
                      <p className="mt-2 text-sm font-bold text-neutral-900">{won(scenario.giftTaxWon)}</p>
                    </div>
                    <div className="rounded-lg bg-white px-3 py-3">
                      <p className="text-xs uppercase tracking-widest text-neutral-500">미래 상속세</p>
                      <p className="mt-2 text-sm font-bold text-neutral-900">{won(scenario.inheritanceTaxWon)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">{scenario.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">현재 계산 가정</p>
            <div className="mt-2 space-y-1 text-xs leading-relaxed text-slate-700">
              {result.data.assumptions.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 shadow-sm">
            <p className="text-sm font-semibold text-red-900">이 계산에 반영되지 않는 항목</p>
            <p className="mt-1 text-xs leading-relaxed text-red-800">
              아래 항목에 따라 실제 상속·증여세는 크게 달라질 수 있어요.
            </p>
            <div className="mt-2 space-y-1 text-xs leading-relaxed text-red-800">
              {result.data.limitations.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>

          {result.data.warnings.length > 0 ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900">입력·판단 메모</p>
              <div className="mt-1 space-y-1 text-xs leading-relaxed text-amber-800">
                {result.data.warnings.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>
          ) : null}

          {expertCheckPoints.length > 0 ? (
            <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-neutral-900">전문가 확인이 특히 필요한 경우</p>
              <div className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-600">
                {expertCheckPoints.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>
          ) : null}

          <CalculatorEstimateNotice badge="사전 판단 시뮬레이션">
            <p>
              이 결과는 지금 증여할지, 나중에 상속받을지를 먼저 비교해 보는 판단용 화면이에요. 실제 실행 전에는 자산 평가, 가족관계, 합산 규정을 함께 확인해 주세요.
            </p>
          </CalculatorEstimateNotice>
        </>
      ) : (
        !result.err ? (
          <p className="mt-6 text-sm text-neutral-500">
            현재 자산과 예상 시점을 입력하면 상속만 하는 경우와 지금 일부를 증여하는 경우를 비교해 드릴게요.
          </p>
        ) : null
      )}

      {result.data ? (
        <div className="mt-6">
          <HomeAtozCta placement="inheritance_gift_result" />
        </div>
      ) : null}

      <CalculatorConsultCta
        calculatorLabel="상속·증여 사전 시뮬레이터"
        defaultSituation="inheritance"
        resultSummary={summary}
        disabled={!result.data}
        titleOverride="상속과 증여 중 어떤 구조가 맞는지 마지막으로 확인해 보세요."
        subtitleOverride="평가와 특례가 얽히는 영역이라 실제 실행 전에는 전문가 확인이 특히 중요해요."
        buttonLabelOverride="상속·증여 전략 상담 연결"
      />
    </div>
  );
}
