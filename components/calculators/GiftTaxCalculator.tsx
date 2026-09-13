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
  const [recipientIsMinor, setRecipientIsMinor] = useState(false);

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
      recipientIsMinor,
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
    warnings.push("과거 10년 증여로 이미 사용한 공제는 이 세액에 반영하지 않았습니다. 해당 내역이 있으면 아래 신고 준비에서 확인하세요.");

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
  }, [adjustment, giftValue, isGenerationSkipping, isResident, relation, recipientIsMinor]);

  const summary = useMemo(() => {
    if (!result.data) return null;
    return `과세표준 ${won(result.data.taxableBaseWon)}, 예상 증여세 ${won(result.data.finalGiftTaxWon)} 기준으로 계산했어요.`;
  }, [result.data]);

  const headline = useMemo(() => {
    if (!result.data) return null;
    const tax = result.data.finalGiftTaxWon;
    if (tax === 0) return "입력 조건에서 산출세액은 0원입니다. 과거 증여와 신고 대상 여부는 별도로 확인하세요.";
    return "입력 조건에 따른 산출세액입니다. 공제 이력과 신고세액공제에 따라 실제 납부액은 달라집니다.";
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
      return "별도 조건 검토 필요";
    }
    return "과거 증여 이력 확인";
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
      recipientIsMinor,
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
  }, [isResident, result.data, recipientIsMinor]);

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
          helpText="아래 관계별 기본공제는 자동 반영되므로 중복 입력하지 마세요. 채무 인수 등 별도 차감은 적용 요건을 확인해야 합니다."
        />
        <SelectField
          label="받는 사람은 주는 사람의 누구인가요?"
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
          {relation === "lineal_descendant" ? (
            <CheckRow checked={recipientIsMinor} onChange={setRecipientIsMinor} label="받는 사람이 미성년자예요" sub="직계존속에게 받는 미성년자 기본공제는 10년 2,000만원입니다." />
          ) : null}
          <CheckRow
            checked={isGenerationSkipping}
            onChange={setIsGenerationSkipping}
            label="세대생략 여부"
            tooltip="조부모가 손자녀에게 주는 경우 등입니다. 부모 사망에 따른 예외, 과거 증여 합산은 별도 검토가 필요합니다."
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
              <p className="text-sm font-semibold text-slate-900">계산 범위 안내</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">간이 계산 기준</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">일반적인 상황 기준</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">추가 확인</p>
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
            <ResultRow label="세액공제 전 추정액" value={won(result.data.finalGiftTaxWon)} bold highlight />
          </dl>

          {simulations ? (
            <div className="mt-5 rounded-2xl border border-[#d6e4ff] bg-[#f7faff] p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#163d7a]">증여 대상별 비교</p>
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
              신고세액공제·기납부세액공제·가산세는 반영하지 않습니다. 받는 사람을 바꾸는 비교는 재산의 실제 소유자가 달라지는 별개의 거래이며, 같은 사람에게 우회 증여하는 절세 방법이 아닙니다.
            </p>
            <a className="underline underline-offset-4" href="https://i.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7728&mi=2340" target="_blank" rel="noopener noreferrer">국세청 증여세 계산 기준 확인</a>
          </CalculatorEstimateNotice>
        </>
      ) : (
        <p className="mt-6 text-sm text-neutral-500">
          금액과 관계를 입력하면 참고용 증여세를 바로 확인할 수 있어요.
        </p>
      )}

      {result.data ? (
        <GiftTaxCaseStart
          recipientIsMinor={recipientIsMinor}
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
