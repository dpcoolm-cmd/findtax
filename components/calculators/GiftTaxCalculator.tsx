"use client";

import { useMemo, useState } from "react";
import { CalculatorConsultCta } from "@/components/CalculatorConsultCta";
import { CalculatorEstimateNotice } from "@/components/CalculatorEstimateNotice";
import { GiftTaxCaseStart } from "@/components/GiftTaxCaseStart";
import {
  formatGroupedNumericInput,
  formatKoreanMoneyFromManwonInput,
  parseNonNegativeManwonString,
  parsePositiveManwonString,
} from "@/lib/calculator-input";
import { bandGiftTax } from "@/lib/calculator-cta-bands";
import {
  calculateGiftTaxDetailed,
  explainGiftTaxLines,
  getGiftRelationLabel,
  type GiftRecipientRelation,
} from "@/lib/calculators/gift-tax";

function won(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

function formatMoneyInput(raw: string): string {
  return formatGroupedNumericInput(raw);
}

function HelpTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex cursor-help items-center justify-center">
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#cbd5e1] text-[10px] font-bold text-[#64748b]">
        ?
      </span>
      <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 w-56 -translate-x-1/2 rounded-lg bg-[#0f1e3d] px-2.5 py-2 text-[11px] font-normal leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
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

function SelectField({
  label,
  value,
  onChange,
  tooltip,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  tooltip?: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="text-sm font-medium text-neutral-800">
      <span className="inline-flex items-center gap-1.5">
        {label}
        {tooltip ? <HelpTip text={tooltip} /> : null}
      </span>
      <select
        className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-brand focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
  sub,
  tooltip,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub?: string;
  tooltip?: string;
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
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-800">
          {label}
          {tooltip ? <HelpTip text={tooltip} /> : null}
        </span>
        {sub ? <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">{sub}</span> : null}
      </span>
    </label>
  );
}

function ResultRow({
  label,
  value,
  sub,
  highlight,
  bold,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-3 py-2.5 ${
        highlight ? "rounded-lg bg-brand-light px-3" : ""
      }`}
    >
      <dt className={`text-sm ${bold ? "font-semibold text-neutral-900" : "text-neutral-600"}`}>
        {label}
        {sub ? <span className="ml-1 block text-xs text-neutral-400 sm:inline">{sub}</span> : null}
      </dt>
      <dd
        className={`shrink-0 text-right text-sm ${
          bold ? "font-bold text-neutral-900" : "font-medium text-neutral-700"
        } ${highlight ? "text-brand-dark" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-widest text-neutral-400">
      {children}
    </p>
  );
}

type GiftCalculatorViewData = ReturnType<typeof calculateGiftTaxDetailed> & {
  warnings: string[];
  assumptions: string[];
  limitations: string[];
};

export function GiftTaxCalculator() {
  const [giftValue, setGiftValue] = useState("");
  const [adjustment, setAdjustment] = useState("");
  const [relation, setRelation] = useState<GiftRecipientRelation>("lineal_descendant");
  const [isGenerationSkipping, setIsGenerationSkipping] = useState(false);
  const [isResident, setIsResident] = useState(true);

  const result = useMemo(() => {
    const parsedGiftValue = parsePositiveManwonString(giftValue);
    const parsedAdjustment = parseNonNegativeManwonString(adjustment);

    if (!parsedGiftValue.ok) {
      return { err: giftValue.trim() ? parsedGiftValue.error : null, data: null as GiftCalculatorViewData | null };
    }
    if (!parsedAdjustment.ok) {
      return { err: parsedAdjustment.error, data: null as GiftCalculatorViewData | null };
    }

    const base = calculateGiftTaxDetailed({
      giftValueWon: parsedGiftValue.value,
      adjustmentWon: parsedAdjustment.value,
      relation,
      isGenerationSkipping,
      isResident,
    });

    const warnings: string[] = [];
    if (isGenerationSkipping) {
      warnings.push("세대생략 여부에 따라 세금이 달라질 수 있어요.");
    }
    if (parsedAdjustment.value >= Math.floor(parsedGiftValue.value * 0.2)) {
      warnings.push("차감액이 크면 실제 신고 기준과 차이가 날 수 있어요.");
    }
    if (!isResident) {
      warnings.push("거주자 여부에 따라 공제 적용이 달라질 수 있어요.");
    }
    warnings.push("관계 선택에 따라 공제 금액이 달라져요.");

    const assumptions = [
      "입력한 증여재산가액 기준으로 계산했어요.",
      "입력한 차감액 기준으로 계산했어요.",
      `${getGiftRelationLabel(relation)} 선택 기준으로 공제를 반영했어요.`,
      "평가차익, 가산세, 세무조정은 반영하지 않았어요.",
    ];

    const limitations = [
      "실제 증여재산 평가 이슈",
      "10년 합산 여부의 세부 판정",
      "세대생략 할증의 복잡 사례",
      "부담부증여 관련 양도세 이슈",
      "해외자산·비거주자 특수 케이스",
      "신고 지연 가산세",
    ];

    return {
      err: null as string | null,
      data: {
        ...base,
        warnings,
        assumptions,
        limitations,
      },
    };
  }, [adjustment, giftValue, isGenerationSkipping, isResident, relation]);

  const summary = useMemo(() => {
    if (!result.data) return null;
    return `과세표준 ${won(result.data.taxableBaseWon)}, 예상 증여세 ${won(result.data.finalGiftTaxWon)} 기준으로 계산했어요.`;
  }, [result.data]);

  const headline = useMemo(() => {
    if (!result.data) return null;
    const tax = result.data.finalGiftTaxWon;
    const taxable = result.data.taxableBaseWon;

    if (tax >= 20_000_000) {
      return "이번 증여는 세금 부담이 큰 편이라 미리 구조를 살펴보는 게 좋아요.";
    }
    if (tax === 0 || taxable <= 50_000_000) {
      return "현재 입력 기준으로는 세금 부담이 크지 않은 편이에요.";
    }
    return "증여 대상과 공제 구조에 따라 세액 차이가 날 수 있는 케이스예요.";
  }, [result.data]);

  const oneLineSummary = useMemo(() => {
    if (!result.data) return null;
    if (result.data.finalGiftTaxWon === 0) {
      return "이번 케이스 한 줄 요약: 현재 입력 기준으로는 공제 범위 안에서 계산됐어요.";
    }
    if (result.data.finalGiftTaxWon >= 20_000_000) {
      return "이번 케이스 한 줄 요약: 누구에게 어떻게 증여할지 먼저 비교해 볼 만해요.";
    }
    return "이번 케이스 한 줄 요약: 관계와 분산 방식에 따라 결과가 달라질 수 있어요.";
  }, [result.data]);

  const whyThis = useMemo(() => {
    if (!result.data) return null;
    const surchargeText =
      result.data.generationSkippingSurchargeWon > 0
        ? `세대생략 할증 ${won(result.data.generationSkippingSurchargeWon)}이 추가됐어요.`
        : "세대생략 할증은 반영하지 않았어요.";

    return `증여재산가액 ${won(result.data.giftValueWon)}에서 차감액과 관계별 공제를 반영해 과세표준 ${won(result.data.taxableBaseWon)}을 계산했고, 여기에 세율과 누진공제를 적용했어요. ${surchargeText}`;
  }, [result.data]);

  const confidenceLabel = useMemo(() => {
    if (!result.data) return null;
    if (
      isGenerationSkipping ||
      !isResident ||
      result.data.adjustmentWon >= Math.floor(result.data.giftValueWon * 0.2)
    ) {
      return "보수적으로 볼 필요 있음";
    }
    return "보통";
  }, [isGenerationSkipping, isResident, result.data]);

  const formulaBody = useMemo(() => {
    if (!result.data) return null;
    return (
      <pre className="whitespace-pre-wrap font-sans text-sm">
        {explainGiftTaxLines(result.data.taxableBaseWon).join("\n")}
      </pre>
    );
  }, [result.data]);

  const simulations = useMemo(() => {
    if (!result.data) return null;

    const spouseScenario = calculateGiftTaxDetailed({
      giftValueWon: result.data.giftValueWon,
      adjustmentWon: result.data.adjustmentWon,
      relation: "spouse",
      isGenerationSkipping: false,
      isResident,
    });

    const childHalfScenario = calculateGiftTaxDetailed({
      giftValueWon: Math.floor(result.data.giftValueWon / 2),
      adjustmentWon: Math.floor(result.data.adjustmentWon / 2),
      relation: "lineal_descendant",
      isGenerationSkipping: false,
      isResident,
    });

    const childSplitTaxWon = childHalfScenario.finalGiftTaxWon * 2;
    const spouseDiffWon = Math.max(0, result.data.finalGiftTaxWon - spouseScenario.finalGiftTaxWon);
    const childSplitDiffWon = Math.max(0, result.data.finalGiftTaxWon - childSplitTaxWon);
    const maxDiffWon = Math.max(spouseDiffWon, childSplitDiffWon);
    const bestScenario =
      maxDiffWon <= 0 ? null : spouseDiffWon >= childSplitDiffWon ? "spouse" : "child_split";

    return {
      currentTaxWon: result.data.finalGiftTaxWon,
      spouseTaxWon: spouseScenario.finalGiftTaxWon,
      spouseDiffWon,
      childSplitTaxWon,
      childSplitDiffWon,
      maxDiffWon,
      bestScenario,
      showLargeDifferenceWarning: maxDiffWon >= 5_000_000,
    };
  }, [isResident, result.data]);

  const ctaBand = useMemo(
    () => (result.data ? bandGiftTax(result.data.finalGiftTaxWon, result.data.taxableBaseWon) : "low"),
    [result.data],
  );

  return (
    <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
      <SectionTitle>입력 정보</SectionTitle>
      <p className="mb-4 text-sm leading-relaxed text-neutral-500">
        금액은 모두 <span className="font-medium text-neutral-700">만원 단위</span>로 입력해 주세요.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="증여재산가액"
          value={giftValue}
          onChange={setGiftValue}
          placeholder="예: 30000"
          tooltip="증여하려는 재산의 현재 평가 금액이에요."
          helpText="예: 3억원이면 30000으로 입력해요. 현금, 부동산, 주식 등 실제로 넘길 재산 금액을 기준으로 넣어 주세요."
        />
        <InputField
          label="공제·채무 등 차감액"
          value={adjustment}
          onChange={setAdjustment}
          placeholder="예: 1000"
          tooltip="증여재산가액에서 빼서 계산할 금액이에요."
          helpText="예: 1,000만원이면 1000으로 입력해요. 채무 인수나 별도 차감 사유가 있으면 합산해 입력해 주세요."
        />
        <SelectField
          label="증여자와의 관계"
          value={relation}
          onChange={(v) => setRelation(v as GiftRecipientRelation)}
          tooltip="관계에 따라 공제 기준이 달라져요."
          options={[
            { value: "spouse", label: "배우자" },
            { value: "lineal_descendant", label: "직계비속(자녀 등)" },
            { value: "lineal_ascendant", label: "직계존속(부모 등)" },
            { value: "other_relative", label: "기타 친족" },
            { value: "other", label: "기타" },
          ]}
        />
        <div className="grid gap-2">
          <CheckRow
            checked={isGenerationSkipping}
            onChange={setIsGenerationSkipping}
            label="세대생략 여부"
            tooltip="부모를 건너뛰고 자녀나 손자녀에게 증여하는 경우처럼 할증 이슈가 생길 수 있어요."
            sub="세대생략이면 세액이 더 커질 수 있어요."
          />
          <CheckRow
            checked={isResident}
            onChange={setIsResident}
            label="거주자 여부"
            tooltip="거주자 여부에 따라 공제 적용이 달라질 수 있어요."
            sub="기본값은 거주자로 보고 계산해요."
          />
        </div>
      </div>

      {result.err ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{result.err}</p> : null}

      {result.data ? (
        <>
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-lg font-bold text-neutral-900 sm:text-xl">{headline}</p>
            {oneLineSummary ? (
              <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-800">
                {oneLineSummary}
              </p>
            ) : null}
            <div className="mt-4 rounded-2xl bg-brand-light px-4 py-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-dark/70">예상 증여세</p>
              <p className="mt-2 text-3xl font-extrabold text-brand-dark sm:text-4xl">
                {won(result.data.finalGiftTaxWon)}
              </p>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">{whyThis}</p>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">숫자 신뢰도 안내</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">간이 계산 기준</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">일반적인 상황 기준</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">정확도</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{confidenceLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">복잡 조건 반영</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">일부 특례는 미반영</p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">현재 계산 가정</p>
                <div className="mt-1 space-y-1 text-xs leading-relaxed text-slate-700">
                  {result.data.assumptions.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 shadow-sm">
                <p className="text-sm font-semibold text-red-900">이 계산에 반영되지 않는 항목</p>
                <p className="mt-1 text-xs leading-relaxed text-red-800">
                  아래 항목에 따라 실제 신고 세액은 달라질 수 있어요.
                </p>
                <div className="mt-2 space-y-1 text-xs leading-relaxed text-red-800">
                  {result.data.limitations.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>

              {result.data.warnings.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm font-semibold text-amber-900">입력·판정 경고</p>
                  <div className="mt-1 space-y-1 text-xs leading-relaxed text-amber-800">
                    {result.data.warnings.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-neutral-900">계산 근거</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
                <p className="text-xs text-neutral-500">증여재산가액</p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">{won(result.data.giftValueWon)}</p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
                <p className="text-xs text-neutral-500">차감 후 과세표준</p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">{won(result.data.taxableBaseWon)}</p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
                <p className="text-xs text-neutral-500">적용 공제</p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">
                  {won(result.data.relationDeductionWon)}
                </p>
                <p className="mt-1 text-xs text-neutral-500">{getGiftRelationLabel(relation)} 공제 기준 반영</p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
                <p className="text-xs text-neutral-500">적용 세율 / 누진공제</p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">
                  {result.data.appliedRatePct}% / {won(result.data.progressiveDeductionWon)}
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 sm:col-span-2">
                <p className="text-xs text-neutral-500">예상 증여세</p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">{won(result.data.finalGiftTaxWon)}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {result.data.generationSkippingSurchargeWon > 0 ? "세대생략 할증 반영" : "세대생략 할증 미반영"}
                </p>
              </div>
            </div>
            {formulaBody ? (
              <div className="mt-4 rounded-lg bg-neutral-50 px-3 py-3">
                <p className="mb-2 text-xs font-semibold text-neutral-500">간단 계산식</p>
                {formulaBody}
              </div>
            ) : null}
          </div>

          <dl className="mt-4 divide-y divide-neutral-100 rounded-xl border border-neutral-200 px-4">
            <ResultRow label="증여재산가액" value={won(result.data.giftValueWon)} />
            <ResultRow label="차감액" value={won(result.data.adjustmentWon)} />
            <ResultRow label="관계별 공제" value={won(result.data.relationDeductionWon)} />
            <ResultRow label="과세표준" value={won(result.data.taxableBaseWon)} bold />
            <ResultRow
              label="산출세액"
              value={won(result.data.baseGiftTaxWon)}
              sub={`${result.data.appliedRatePct}% 세율 적용`}
            />
            <ResultRow
              label="세대생략 할증"
              value={won(result.data.generationSkippingSurchargeWon)}
              sub={result.data.generationSkippingSurchargeWon > 0 ? "30% 할증 반영" : "해당 없음"}
            />
            <ResultRow label="최종 증여세" value={won(result.data.finalGiftTaxWon)} bold highlight />
          </dl>

          {simulations ? (
            <div className="mt-5 rounded-2xl border border-[#d6e4ff] bg-[#f7faff] p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#163d7a]">유득 시뮬레이션</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#365b96]">
                    누구에게 어떻게 나누는지에 따라 세금 차이가 얼마나 날 수 있는지 비교했어요.
                  </p>
                </div>
                {simulations.maxDiffWon > 0 ? (
                  <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#163d7a]">
                    최대 약 {won(simulations.maxDiffWon)} 차이 가능
                  </div>
                ) : null}
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-[#d6e4ff] bg-white/80 px-4 py-3">
                  <p className="text-sm font-semibold text-neutral-900">현재 기준</p>
                  <p className="mt-1 text-sm text-neutral-700">세액: {won(simulations.currentTaxWon)}</p>
                </div>

                <div
                  className={`rounded-xl border px-4 py-3 ${
                    simulations.bestScenario === "spouse"
                      ? "border-[#93c5fd] bg-white shadow-sm"
                      : "border-[#d6e4ff] bg-white/80"
                  }`}
                >
                  <p className="text-sm font-semibold text-neutral-900">배우자에게 증여 시</p>
                  <p className="mt-1 text-sm text-neutral-700">
                    세액: {won(simulations.spouseTaxWon)}
                    {simulations.spouseDiffWon > 0 ? ` (↓ ${won(simulations.spouseDiffWon)})` : ""}
                  </p>
                </div>

                <div
                  className={`rounded-xl border px-4 py-3 ${
                    simulations.bestScenario === "child_split"
                      ? "border-[#93c5fd] bg-white shadow-sm"
                      : "border-[#d6e4ff] bg-white/80"
                  }`}
                >
                  <p className="text-sm font-semibold text-neutral-900">자녀 2명에게 나눠 증여 시</p>
                  <p className="mt-1 text-sm text-neutral-700">
                    세액: {won(simulations.childSplitTaxWon)}
                    {simulations.childSplitDiffWon > 0 ? ` (↓ ${won(simulations.childSplitDiffWon)})` : ""}
                  </p>
                </div>

                <div className="rounded-xl border border-[#d6e4ff] bg-white px-4 py-4">
                  <p className="text-sm font-semibold text-[#163d7a]">10년 분산 증여 참고</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#365b96]">
                    10년 단위로 공제를 다시 활용할 가능성이 있어요. 다만 합산 규정과 일정 설계는 따로 확인이 필요해요.
                  </p>
                </div>
              </div>

              {simulations.showLargeDifferenceWarning ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm font-semibold text-amber-900">
                    이 조건이면 세금 차이가 크게 벌어질 수 있어요.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <CalculatorEstimateNotice badge="참고용 간이 추정">
            <p>
              증여는 누구에게 어떻게 나누느냐에 따라 결과가 달라질 수 있어요. 정확한 금액은 세무사와 한 번 더 확인해 보세요.
            </p>
          </CalculatorEstimateNotice>
        </>
      ) : (
        <p className="mt-6 text-sm text-neutral-500">
          금액과 관계를 입력하면 참고용 증여세를 바로 확인할 수 있어요.
        </p>
      )}

      {result.data ? (
        <GiftTaxCaseStart
          giftValueWon={result.data.giftValueWon}
          relation={relation}
          isGenerationSkipping={isGenerationSkipping}
          isResident={isResident}
        />
      ) : null}

      <CalculatorConsultCta
        calculatorLabel="증여세"
        defaultSituation="inheritance"
        resultSummary={summary}
        disabled={!result.data}
        calculatorSlug="gift_tax"
        resultBand={ctaBand}
        estimatedTaxWon={result.data?.finalGiftTaxWon ?? null}
      />
    </div>
  );
}
