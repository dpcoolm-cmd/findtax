"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalculatorConsultCta } from "@/components/CalculatorConsultCta";
import { HomeAtozCta } from "@/components/HomeAtozCta";
import { DecisionSummaryCard } from "@/components/calculators/DecisionSummaryCard";
import { RedFlagHints, type RedFlagHint } from "@/components/calculators/RedFlagHints";
import {
  buildSimulationScenarios,
  buildTimingSimulationScenarios,
  SimulationComparison,
  TimingSimulationComparison,
} from "@/components/calculators/SimulationComparison";
import {
  formatGroupedNumericInput,
  formatKoreanMoneyFromManwonInput,
  parseNonNegativeManwonString,
  parsePositiveManwonString,
} from "@/lib/calculator-input";
import { bandTransferTax } from "@/lib/calculator-cta-bands";
import {
  type AssetType,
  calculateCapitalGainsFull,
  type CapitalGainsFullInput,
} from "@/lib/calculators/capital-gains-estimate";
import { parseYmd } from "@/lib/calculators/severance-pay";
import { trackSiteEvent } from "@/lib/site-track";

type RecommendationItem = {
  id:
    | "hold_longer"
    | "joint_ownership"
    | "expense_review"
    | "exemption_review"
    | "special_rules";
  title: string;
  description: string;
  impactHint?: string;
};

function won(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

function formatMoneyInput(raw: string): string {
  return formatGroupedNumericInput(raw);
}

function HelpTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex cursor-help items-center justify-center">
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#D5D9D2] text-[10px] font-semibold text-neutral-500">
        ?
      </span>
      <span className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-20 w-56 -translate-x-1/2 rounded-xl border border-[#D5D9D2] bg-white px-3 py-2 text-[11px] leading-relaxed text-neutral-600 opacity-0 transition-opacity group-hover:opacity-100">
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
  required,
  tooltip,
  helpText,
  showAmountHint = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  tooltip?: string;
  helpText?: string;
  showAmountHint?: boolean;
}) {
  const amountHint = showAmountHint ? formatKoreanMoneyFromManwonInput(value) : null;

  return (
    <label className="block space-y-2">
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-800">
        {label}
        {required ? <span className="text-[#F59E0B]">*</span> : null}
        {tooltip ? <HelpTip text={tooltip} /> : null}
      </span>
      <input
        inputMode="numeric"
        className="h-14 w-full rounded-xl border border-[#D5D9D2] bg-white px-4 text-base text-neutral-900 outline-none transition focus:border-[#F59E0B]"
        value={value}
        onChange={(e) => onChange(formatMoneyInput(e.target.value))}
        placeholder={placeholder ?? "숫자만 입력"}
      />
      {amountHint ? <p className="text-xs font-medium text-neutral-500">{amountHint}</p> : null}
      {helpText ? <p className="text-sm leading-relaxed text-neutral-600">{helpText}</p> : null}
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
    <label className="flex items-start gap-3 rounded-xl border border-[#D5D9D2] bg-white px-4 py-4">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 shrink-0 accent-[#F59E0B]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="space-y-1">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-900">
          {label}
          {tooltip ? <HelpTip text={tooltip} /> : null}
        </span>
        {sub ? <span className="block text-sm leading-relaxed text-neutral-600">{sub}</span> : null}
      </span>
    </label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-semibold text-neutral-900">{children}</h2>;
}

function ResultRow({
  label,
  value,
  sub,
  emphasize,
}: {
  label: string;
  value: string;
  sub?: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 py-4 ${
        emphasize ? "rounded-xl bg-[#F8FAFC] px-4" : ""
      }`}
    >
      <div>
        <dt className={`text-sm ${emphasize ? "font-semibold text-neutral-900" : "text-neutral-600"}`}>
          {label}
        </dt>
        {sub ? <dd className="mt-1 text-sm text-neutral-500">{sub}</dd> : null}
      </div>
      <dd
        className={`shrink-0 text-right ${
          emphasize ? "text-base font-semibold text-neutral-900" : "text-sm font-medium text-neutral-700"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function addYearsToYmd(ymd: string, years: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) return ymd;
  const year = Number(match[1]) + years;
  return `${year.toString().padStart(4, "0")}-${match[2]}-${match[3]}`;
}

export function TransferTaxCalculator() {
  const resultViewTrackedRef = useRef<string | null>(null);

  const [acquisitionDate, setAcquisitionDate] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("house");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [expense, setExpense] = useState("");
  const [isOneHouseholdOneHome, setIsOneHouseholdOneHome] = useState(false);
  const [hasVerifiedExemptionRequirements, setHasVerifiedExemptionRequirements] =
    useState(false);
  const [isUnregistered, setIsUnregistered] = useState(false);
  const [isMultiHome, setIsMultiHome] = useState(false);
  const [isAdjustmentZone, setIsAdjustmentZone] = useState(false);
  const [isInherited, setIsInherited] = useState(false);
  const [isJointOwnership, setIsJointOwnership] = useState(false);

  const result = useMemo(() => {
    if (!acquisitionDate || !transferDate) {
      return {
        err: null as string | null,
        data: null as ReturnType<typeof calculateCapitalGainsFull> | null,
        input: null as CapitalGainsFullInput | null,
      };
    }

    const parsedPrice = parsePositiveManwonString(price);
    if (!parsedPrice.ok) {
      return { err: price.trim() ? parsedPrice.error : null, data: null, input: null };
    }

    const parsedCost = parseNonNegativeManwonString(cost);
    if (!parsedCost.ok) {
      return { err: parsedCost.error, data: null, input: null };
    }

    const parsedExpense = parseNonNegativeManwonString(expense);
    if (!parsedExpense.ok) {
      return { err: parsedExpense.error, data: null, input: null };
    }

    const input: CapitalGainsFullInput = {
      acquisitionDate,
      transferDate,
      assetType,
      transferPriceWon: parsedPrice.value,
      acquisitionCostWon: parsedCost.value,
      necessaryExpenseWon: parsedExpense.value,
      isOneHouseholdOneHome,
      hasVerifiedExemptionRequirements,
      isUnregistered,
      isMultiHome,
      isAdjustmentZone,
      isInherited,
      isJointOwnership,
    };

    const data = calculateCapitalGainsFull(input);
    if (!data) {
      return {
        err: "양도일은 취득일보다 뒤여야 해요.",
        data: null,
        input: null,
      };
    }

    return { err: null as string | null, data, input };
  }, [
    acquisitionDate,
    assetType,
    cost,
    expense,
    hasVerifiedExemptionRequirements,
    isAdjustmentZone,
    isInherited,
    isJointOwnership,
    isMultiHome,
    isOneHouseholdOneHome,
    isUnregistered,
    price,
    transferDate,
  ]);

  const ctaBand = useMemo(
    () =>
      result.data ? bandTransferTax(result.data.finalTaxWon, result.data.taxableTransferGainWon) : "low",
    [result.data],
  );

  const summary = useMemo(() => {
    if (!result.data) return null;
    if (result.data.isExempt) {
      return `현재 입력 기준으로는 1세대 1주택 비과세 가능성이 있어 보여요. 보유기간은 ${result.data.holdingDisplay}로 계산했어요.`;
    }

    return `${isJointOwnership ? "본인 지분 기준으로 " : ""}양도차익 ${won(result.data.transferGainWon)}, 과세표준 ${won(result.data.taxBaseWon)}, 예상 세액 ${won(result.data.finalTaxWon)} 기준으로 계산했어요.`;
  }, [isJointOwnership, result.data]);

  const strategicSummary = useMemo(() => {
    if (!result.data) return null;
    if (result.data.isExempt) return "이번 거래는 비과세 가능성이 높은 케이스로 보여요.";
    if (result.data.finalTaxWon >= 50_000_000) {
      return "이번 거래는 세금 부담이 큰 편이라 조건을 꼼꼼히 보는 게 좋아 보여요.";
    }
    return "이번 거래는 조건에 따라 세액 차이가 커질 수 있는 케이스예요.";
  }, [result.data]);

  const heroSupport = useMemo(() => {
    if (!result.data) return null;
    if (result.data.finalTaxWon === 0) {
      if (result.data.isExempt) {
        return "현재 입력 기준으로는 1세대 1주택 비과세 조건을 충족한 것으로 간이 판단됐어요.";
      }
      return "현재 입력 기준으로는 과세표준 또는 산출세액이 0원으로 계산됐어요.";
    }

    if (result.data.judgment === "multi_home_adjustment") {
      return "다주택 여부와 조정대상지역 해당 여부에 따라 실제 세액이 더 달라질 수 있어요.";
    }

    return `${result.data.holdingDisplay} 보유, 양도차익 ${won(result.data.transferGainWon)} 기준의 참고용 계산이에요.`;
  }, [result.data]);

  const confidenceLabel = useMemo(() => {
    if (!result.data) return null;
    if (result.data.limitations.length > 0 || result.data.warnings.length > 1) {
      return "보수적으로 봐야 함";
    }
    return "보통";
  }, [result.data]);

  const acquisitionCostWarning =
    cost.trim() !== "" &&
    !!result.data?.warnings.some((warning) => warning.includes("취득가액이 0원"));

  const redFlagHints = useMemo<RedFlagHint[]>(() => {
    const hints: RedFlagHint[] = [];

    const acquisition = acquisitionDate ? parseYmd(acquisitionDate) : null;
    const transfer = transferDate ? parseYmd(transferDate) : null;

    if (acquisition && transfer && transfer.getTime() > acquisition.getTime()) {
      const holdingDays = Math.floor((transfer.getTime() - acquisition.getTime()) / 86_400_000);
      const holdingYears = holdingDays / 365.25;

      if (holdingYears < 2) {
        hints.push({
          id: "holding-period",
          message: "잠깐 확인해보세요. 2년을 넘기면 세율이 낮아질 수 있어요.",
        });
      }
    }

    const parsedPrice = parsePositiveManwonString(price);
    const parsedCost = parseNonNegativeManwonString(cost);
    if (cost.trim() !== "" && parsedCost.ok) {
      const isVeryLowCost =
        parsedCost.value === 0 ||
        (parsedPrice.ok && parsedCost.value > 0 && parsedCost.value <= parsedPrice.value * 0.1);

      if (isVeryLowCost) {
        hints.push({
          id: "low-cost",
          message: "취득가액이 낮으면 세금이 크게 계산될 수 있어요. 한 번 더 확인해보세요.",
        });
      }
    }

    const parsedExpense = parseNonNegativeManwonString(expense);
    if (parsedExpense.ok && parsedExpense.value === 0) {
      hints.push({
        id: "missing-expense",
        message: "중개비, 수리비 등을 입력하면 세금을 줄일 수 있을 것 같아요.",
      });
    }

    if (isOneHouseholdOneHome) {
      hints.push({
        id: "one-home-check",
        message: "비과세 조건은 정확히 확인해야 해요. 잠깐만 다시 살펴보세요.",
      });
    }

    return hints;
  }, [acquisitionDate, cost, expense, isOneHouseholdOneHome, price, transferDate]);

  const simulationScenarios = useMemo(() => {
    if (!result.data || !result.input) return [];

    const holdMoreInput: CapitalGainsFullInput = {
      ...result.input,
      acquisitionDate: addYearsToYmd(result.input.acquisitionDate, -1),
    };
    const holdMoreData = calculateCapitalGainsFull(holdMoreInput);

    return buildSimulationScenarios({
      input: result.input,
      currentResult: result.data,
      oneYearLaterResult: holdMoreData,
    });
  }, [result.data, result.input]);

  const timingSimulationScenarios = useMemo(() => {
    if (!result.data || !result.input) return [];

    return buildTimingSimulationScenarios({
      input: result.input,
      currentResult: result.data,
    });
  }, [result.data, result.input]);

  const jointOwnershipSimulation = useMemo(() => {
    if (!result.data || !result.input || isJointOwnership) return null;

    return calculateCapitalGainsFull({
      ...result.input,
      isJointOwnership: true,
    });
  }, [isJointOwnership, result.data, result.input]);

  const betterTimingScenario = useMemo(() => {
    if (!result.data) return null;
    const currentTaxWon = result.data.finalTaxWon;
    return timingSimulationScenarios
      .filter((scenario) => scenario.id !== "now" && scenario.taxWon < currentTaxWon)
      .sort((a, b) => a.taxWon - b.taxWon)[0] ?? null;
  }, [result.data, timingSimulationScenarios]);

  const recommendationItems = useMemo<RecommendationItem[]>(() => {
    if (!result.data || !result.input) return [];

    const items: RecommendationItem[] = [];
    const currentTaxWon = result.data.finalTaxWon;

    if (betterTimingScenario || result.data.holdingYears < 2.2) {
      items.push({
        id: "hold_longer",
        title: betterTimingScenario ? `${betterTimingScenario.title}까지 보유 검토` : "보유 기간 더 보기",
        description: "보유 기간을 더 늘리면 세금이 줄어들 수 있어요.",
        impactHint: betterTimingScenario
          ? `현재 기준보다 약 ${won(currentTaxWon - betterTimingScenario.taxWon)} 차이 날 수 있어요.`
          : result.data.holdingYears < 2
            ? "2년 보유 여부에 따라 세율이나 비과세 판단이 달라질 수 있어요."
            : undefined,
      });
    }

    if (
      !isJointOwnership &&
      jointOwnershipSimulation &&
      jointOwnershipSimulation.finalTaxWon < currentTaxWon
    ) {
      items.push({
        id: "joint_ownership",
        title: "공동명의 검토",
        description: "공동명의 구조를 검토하면 세금이 달라질 수 있어요.",
        impactHint: `단순 50:50 기준으로 약 ${won(
          currentTaxWon - jointOwnershipSimulation.finalTaxWon,
        )} 차이 날 수 있어요.`,
      });
    }

    if (
      result.input.necessaryExpenseWon === 0 ||
      result.input.necessaryExpenseWon <= result.input.transferPriceWon * 0.01
    ) {
      items.push({
        id: "expense_review",
        title: "필요경비 다시 확인하기",
        description: "중개보수, 취득세, 법무비, 자본적 지출 등을 다시 확인해 보세요.",
        impactHint:
          result.input.necessaryExpenseWon === 0
            ? "비용 누락이 있으면 세금이 더 크게 계산될 수 있어요."
            : undefined,
      });
    }

    if (
      isOneHouseholdOneHome ||
      (assetType === "house" && !isUnregistered && result.data.holdingYears >= 1.8)
    ) {
      items.push({
        id: "exemption_review",
        title: "비과세 요건 재확인",
        description: "비과세 요건은 세대 기준, 보유·거주 요건까지 함께 확인해야 해요.",
        impactHint: result.data.isExempt
          ? "현재 결과는 간이 비과세 판정 기준을 반영한 값이에요."
          : undefined,
      });
    }

    if (result.data.limitations.length > 0) {
      items.push({
        id: "special_rules",
        title: "특례·예외 검토",
        description: "현재 계산에 반영되지 않은 특례나 예외가 실제 세액을 바꿀 수 있어요.",
        impactHint: "다주택, 조정대상지역, 상속 특례처럼 따로 확인이 필요한 항목이 있어요.",
      });
    }

    return items;
  }, [
    assetType,
    betterTimingScenario,
    isJointOwnership,
    isOneHouseholdOneHome,
    isUnregistered,
    jointOwnershipSimulation,
    result.data,
    result.input,
  ]);

  const recommendationSummary = useMemo(() => {
    if (recommendationItems.length >= 2) {
      return "현재 조건에서는 몇 가지 조정 포인트가 보여요.";
    }
    if (recommendationItems.length === 1) {
      return "입력값을 다시 확인하면 세금 차이가 생길 수 있어요.";
    }
    return "현재 입력 기준에서는 바로 눈에 띄는 조정 포인트가 많지 않지만, 실제 적용 가능성은 한 번 더 확인해 보세요.";
  }, [recommendationItems]);

  const shareableSummary = useMemo(() => {
    if (!result.data) return null;

    if (result.data.isExempt) {
      return "현재 기준으로는 비과세 가능성이 높아 보여요.";
    }

    if (betterTimingScenario) {
      return `${betterTimingScenario.title} 매도 쪽이 현재보다 더 유리해 보여요.`;
    }

    if (
      !isJointOwnership &&
      jointOwnershipSimulation &&
      jointOwnershipSimulation.finalTaxWon < result.data.finalTaxWon
    ) {
      return "공동명의 구조를 함께 검토해 볼 만한 케이스예요.";
    }

    if (result.data.limitations.length > 0) {
      return "특례와 예외 여부에 따라 실제 세액 차이가 생길 수 있어요.";
    }

    return "현재 기준으로는 비용과 비과세 요건을 다시 확인해 보는 편이 좋아 보여요.";
  }, [betterTimingScenario, isJointOwnership, jointOwnershipSimulation, result.data]);

  const specialistCheckItems = useMemo(() => {
    if (!result.data) return [];

    const items: string[] = [];

    if (isJointOwnership) {
      items.push("공동명의 지분 비율이 50:50이 아닌 경우");
    }
    if (isOneHouseholdOneHome || result.data.isExempt) {
      items.push("1세대 1주택 비과세의 세대·보유·거주 요건을 함께 확인해야 하는 경우");
    }
    if (isMultiHome || isAdjustmentZone) {
      items.push("다주택 또는 조정대상지역 여부로 중과·예외 판단이 필요한 경우");
    }
    if (isInherited) {
      items.push("상속 취득이나 상속 특례가 실제 세액에 영향을 줄 수 있는 경우");
    }
    if (result.input?.necessaryExpenseWon === 0) {
      items.push("중개보수, 취득세, 법무비, 자본적 지출 등 누락 비용이 있을 수 있는 경우");
    }
    if (betterTimingScenario) {
      items.push("매도 시점을 조금만 조정해도 세액 차이가 커질 수 있는 경우");
    }

    return items;
  }, [
    betterTimingScenario,
    isAdjustmentZone,
    isInherited,
    isJointOwnership,
    isMultiHome,
    isOneHouseholdOneHome,
    result.data,
    result.input,
  ]);

  useEffect(() => {
    if (!result.data || !result.input) return;

    const trackingKey = [
      result.input.acquisitionDate,
      result.input.transferDate,
      result.data.finalTaxWon,
      result.data.judgment,
      result.data.isExempt ? "exempt" : "taxable",
      isJointOwnership ? "joint" : "single",
    ].join(":");

    if (resultViewTrackedRef.current === trackingKey) return;
    resultViewTrackedRef.current = trackingKey;

    trackSiteEvent("calculator_result_view", {
      calculatorType: "transfer_tax",
      resultBand: ctaBand,
      finalTaxWon: result.data.finalTaxWon,
      taxableTransferGainWon: result.data.taxableTransferGainWon,
      recommendationCount: recommendationItems.length,
      timingBestScenario: betterTimingScenario?.id ?? "now",
      isExempt: result.data.isExempt,
      isJointOwnership,
    });
  }, [
    betterTimingScenario,
    ctaBand,
    isJointOwnership,
    recommendationItems.length,
    result.data,
    result.input,
  ]);

  const handleSummaryCopy = () => {
    if (!result.data || !shareableSummary) return;

    trackSiteEvent("calculator_summary_copy", {
      calculatorType: "transfer_tax",
      resultBand: ctaBand,
      finalTaxWon: result.data.finalTaxWon,
      summary: shareableSummary,
    });
  };

  return (
    <div className="rounded-xl border border-[#D5D9D2] bg-white px-6 py-16 shadow-card sm:px-10">
      <div className="space-y-16">
        <section className="space-y-8">
          <SectionTitle>기본 정보</SectionTitle>
          <div className="grid gap-8 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-neutral-800">
                취득일<span className="text-[#F59E0B]">*</span>
              </span>
              <input
                type="date"
                className="h-14 w-full rounded-xl border border-[#D5D9D2] bg-white px-4 text-base text-neutral-900 outline-none transition focus:border-[#F59E0B]"
                value={acquisitionDate}
                onChange={(e) => setAcquisitionDate(e.target.value)}
                max={transferDate || undefined}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-neutral-800">
                양도일<span className="text-[#F59E0B]">*</span>
              </span>
              <input
                type="date"
                className="h-14 w-full rounded-xl border border-[#D5D9D2] bg-white px-4 text-base text-neutral-900 outline-none transition focus:border-[#F59E0B]"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                min={acquisitionDate || undefined}
              />
            </label>

            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-neutral-800">
                양도 자산 종류<span className="text-[#F59E0B]">*</span>
              </span>
              <select
                className="h-14 w-full rounded-xl border border-[#D5D9D2] bg-white px-4 text-base text-neutral-900 outline-none transition focus:border-[#F59E0B]"
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as AssetType)}
              >
                <option value="house">주택</option>
                <option value="land">토지</option>
                <option value="other">기타</option>
              </select>
            </label>
          </div>
        </section>

        <section className="space-y-8">
          <SectionTitle>금액 입력</SectionTitle>
          <p className="text-sm leading-relaxed text-neutral-500">
            금액은 모두 <span className="font-medium text-neutral-700">만원 단위</span>로 입력해 주세요.
          </p>

          <div className="grid gap-8 md:grid-cols-2">
            <InputField
              label="양도가액"
              value={price}
              onChange={setPrice}
              required
              tooltip="매도 계약서에 적힌 실제 거래금액이에요."
              placeholder="예: 85000"
              helpText="예: 8억 5천만원이면 85000으로 입력해요."
            />

            <InputField
              label="취득가액"
              value={cost}
              onChange={setCost}
              tooltip="처음 살 때 지급한 실제 금액이에요."
              placeholder="예: 62000"
              helpText="예: 6억 2천만원이면 62000으로 입력해요. 취득세나 법무비를 따로 볼지 여부는 기준을 맞춰 주세요."
            />

            <InputField
              label="필요경비"
              value={expense}
              onChange={setExpense}
              tooltip="양도차익 계산에서 뺄 수 있는 비용이에요."
              placeholder="예: 1500"
              helpText="예: 1,500만원이면 1500으로 입력해요. 중개보수, 취득세, 법무비, 자본적 지출 등이 포함될 수 있어요."
            />

            <div className="rounded-xl border border-[#D5D9D2] bg-[#F8FAFC] px-5 py-4">
              <p className="text-sm text-neutral-600">
                기본공제 <span className="font-semibold text-neutral-900">2,500,000원</span>은 자동으로 반영돼요.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <SectionTitle>기본 조건</SectionTitle>
          <div className="grid gap-4">
            <CheckRow
              checked={isOneHouseholdOneHome}
              onChange={(checked) => {
                setIsOneHouseholdOneHome(checked);
                if (!checked) setHasVerifiedExemptionRequirements(false);
              }}
              label="1세대 1주택에 해당"
              tooltip="세대 기준 1주택, 보유·거주 요건 등을 충족해야 하는 조건이에요."
              sub="직접 요건을 확인한 경우에만 선택해 주세요. 헷갈리면 체크하지 않고 참고용으로 먼저 보셔도 괜찮아요."
            />
            {isOneHouseholdOneHome ? (
              <div className="space-y-4 rounded-xl border border-[#D5D9D2] bg-[#F8FAFC] px-5 py-4">
                <p className="text-sm font-medium text-neutral-900">체크 전에 꼭 확인해 주세요</p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  취득 당시 조정대상지역 여부와 세대 기준 주택 수에 따라 2년 거주 요건 등이
                  달라질 수 있어요. 아래 확인까지 마쳐야 비과세를 계산에 반영합니다.
                </p>
                <CheckRow
                  checked={hasVerifiedExemptionRequirements}
                  onChange={setHasVerifiedExemptionRequirements}
                  label="세대·보유·거주 요건을 모두 확인했어요"
                  sub="일시적 2주택, 상속·혼인 등 특례가 있다면 선택하지 말고 전문가 확인을 권장해요."
                />
              </div>
            ) : null}

            <CheckRow
              checked={isJointOwnership}
              onChange={setIsJointOwnership}
              label="부부 공동명의 (50:50 기준)"
              sub="공동명의라면 본인 지분 기준 세액을 따로 확인할 수 있어요."
            />
          </div>
        </section>

        <details className="rounded-xl border border-[#D5D9D2] bg-[#F8FAFC] px-5 py-5">
          <summary className="cursor-pointer text-sm font-medium text-neutral-900">
            추가 조건 · 고급 옵션
          </summary>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <CheckRow
              checked={isUnregistered}
              onChange={(v) => {
                setIsUnregistered(v);
                if (v) {
                  setIsOneHouseholdOneHome(false);
                  setHasVerifiedExemptionRequirements(false);
                }
              }}
              label="미등기 양도"
              sub="세율과 공제 적용이 크게 달라질 수 있어요."
            />
            <CheckRow
              checked={isMultiHome}
              onChange={setIsMultiHome}
              label="다주택 여부"
              sub="세대 기준으로 주택 수를 판단해 주세요."
            />
            <CheckRow
              checked={isAdjustmentZone}
              onChange={setIsAdjustmentZone}
              label="조정대상지역"
              sub="중과 여부와 예외 판단에 영향을 줄 수 있어요."
            />
            <CheckRow
              checked={isInherited}
              onChange={setIsInherited}
              label="상속 자산"
              sub="상속 특례는 현재 계산에 직접 반영되지 않아요."
            />
          </div>
        </details>

        {result.err ? (
          <p className="rounded-xl border border-[#D5D9D2] bg-[#F8FAFC] px-5 py-4 text-sm text-neutral-700">
            {result.err}
          </p>
        ) : null}

        {acquisitionCostWarning ? (
          <p className="rounded-xl border border-[#D5D9D2] bg-[#F8FAFC] px-5 py-4 text-sm text-neutral-700">
            취득가액이 0원으로 입력되어 결과가 크게 왜곡될 수 있어요.
          </p>
        ) : null}

        <RedFlagHints hints={redFlagHints} />

        {result.data ? (
          <div className="space-y-10">
            <section className="rounded-xl border border-[#D5D9D2] bg-white px-6 py-10 sm:px-8 sm:py-12">
              <div className="space-y-4">
                <p className="text-sm font-medium text-neutral-500">이번 케이스 한 줄 요약</p>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-semibold text-neutral-900">{strategicSummary}</h3>
                  {isJointOwnership ? (
                    <span className="inline-flex rounded-full border border-[#D5D9D2] bg-[#F8FAFC] px-3 py-1 text-xs font-medium text-neutral-700">
                      공동명의 적용 결과
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <p className="text-sm text-neutral-600">
                  {isJointOwnership ? "본인 기준 세액 (지분 기준)" : "예상 세액"}
                </p>
                <p className="text-5xl font-bold tracking-tight text-neutral-900">
                  {won(result.data.finalTaxWon)}
                </p>
                {heroSupport ? (
                  <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">{heroSupport}</p>
                ) : null}
              </div>
            </section>

            {shareableSummary ? (
              <DecisionSummaryCard
                summary={shareableSummary}
                description={summary ?? undefined}
                onCopy={handleSummaryCopy}
                onLinkCopy={() => {
                  if (!result.data) return;
                  trackSiteEvent("calculator_link_copy", {
                    calculatorType: "transfer_tax",
                    resultBand: ctaBand,
                    finalTaxWon: result.data.finalTaxWon,
                  });
                }}
              />
            ) : null}

            <SimulationComparison scenarios={simulationScenarios} />

            <TimingSimulationComparison scenarios={timingSimulationScenarios} />

            <section className="rounded-xl border border-[#D5D9D2] bg-white p-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-neutral-900">세금 줄이는 방법 추천</h3>
                <p className="text-sm text-neutral-600">
                  현재 입력 기준으로 세금이 달라질 수 있는 포인트를 정리했어요.
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-[#D5D9D2] bg-[#F8FAFC] px-4 py-4 text-sm leading-relaxed text-neutral-700">
                {recommendationSummary}
              </div>

              <div className="mt-6 space-y-3">
                {recommendationItems.length > 0 ? (
                  recommendationItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[#D5D9D2] bg-[#F8FAFC] px-5 py-5"
                    >
                      <div className="space-y-2">
                        <p className="text-base font-semibold text-neutral-900">{item.title}</p>
                        <p className="text-sm leading-relaxed text-neutral-600">{item.description}</p>
                        {item.impactHint ? (
                          <p className="text-sm font-medium text-neutral-700">{item.impactHint}</p>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-[#D5D9D2] bg-[#F8FAFC] px-5 py-5">
                    <p className="text-sm leading-relaxed text-neutral-600">
                      현재 입력 기준으로는 바로 눈에 띄는 조정 포인트가 많지 않아요. 다만 실제 적용 가능성은 보유, 비과세, 공동명의 구조에 따라 달라질 수 있어요.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-[#D5D9D2] bg-white p-8">
              <div className="space-y-8">
                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold text-neutral-900">이 계산에 반영되지 않는 항목</h3>
                  <p className="text-sm text-neutral-600">
                    아래 항목에 따라 실제 신고 세액은 달라질 수 있어요.
                  </p>
                  {result.data.limitations.length > 0 ? (
                    <div className="space-y-2 border-t border-[#D5D9D2] pt-4 text-sm leading-relaxed text-neutral-700">
                      {result.data.limitations.map((item) => (
                        <p key={item}>{item}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="border-t border-[#D5D9D2] pt-4 text-sm leading-relaxed text-neutral-600">
                      현재 확인된 큰 제한 항목은 없지만, 개별 특례와 예외는 별도로 확인해 주세요.
                    </p>
                  )}

                  {result.data.warnings.length > 0 ? (
                    <div className="space-y-2 rounded-xl bg-[#F8FAFC] px-4 py-4 text-sm leading-relaxed text-neutral-700">
                      {result.data.warnings.map((item) => (
                        <p key={item}>{item}</p>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3 border-t border-[#D5D9D2] pt-8">
                  <h3 className="text-2xl font-semibold text-neutral-900">현재 계산 가정</h3>
                  <div className="space-y-2 text-sm leading-relaxed text-neutral-700">
                    {result.data.assumptions.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 border-t border-[#D5D9D2] pt-8">
                  <h3 className="text-2xl font-semibold text-neutral-900">전문가 확인이 특히 필요한 경우</h3>
                  <div className="space-y-2 text-sm leading-relaxed text-neutral-700">
                    {specialistCheckItems.length > 0 ? (
                      specialistCheckItems.map((item) => <p key={item}>{item}</p>)
                    ) : (
                      <p>현재 입력 기준에서는 큰 특이사항이 두드러지지 않지만, 실제 신고 전에는 한 번 더 점검해 보세요.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 border-t border-[#D5D9D2] pt-8">
                  <h3 className="text-2xl font-semibold text-neutral-900">숫자 신뢰도 안내</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-[#D5D9D2] bg-[#F8FAFC] px-5 py-5">
                      <p className="text-sm text-neutral-600">간이 계산 기준</p>
                      <p className="mt-2 text-sm font-medium text-neutral-900">일반적인 상황 기준</p>
                    </div>
                    <div className="rounded-xl border border-[#D5D9D2] bg-[#F8FAFC] px-5 py-5">
                      <p className="text-sm text-neutral-600">정확도</p>
                      <p className="mt-2 text-sm font-medium text-neutral-900">{confidenceLabel}</p>
                    </div>
                    <div className="rounded-xl border border-[#D5D9D2] bg-[#F8FAFC] px-5 py-5">
                      <p className="text-sm text-neutral-600">복잡 조건 반영</p>
                      <p className="mt-2 text-sm font-medium text-neutral-900">일부 특례는 미반영</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[#D5D9D2] bg-white p-8">
              <div className="space-y-8">
                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold text-neutral-900">계산 근거</h3>
                  <p className="text-sm text-neutral-600">
                    보유기간과 비과세 여부, 장기보유특별공제, 핵심 숫자를 한 번에 정리했어요.
                  </p>
                </div>

                <div className="grid gap-6 border-t border-[#D5D9D2] pt-8 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm text-neutral-600">보유기간</p>
                    <p className="text-sm font-medium text-neutral-900">{result.data.holdingDisplay}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-neutral-600">비과세 여부</p>
                    <p className="text-sm font-medium text-neutral-900">
                      {result.data.isExempt ? "비과세 가능성 있음" : "과세 대상"}
                    </p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <p className="text-sm text-neutral-600">장기보유특별공제 이유</p>
                    <p className="text-sm font-medium leading-relaxed text-neutral-900">
                      {result.data.ltdDeductionReason}
                    </p>
                  </div>
                  {result.data.highPriceApportionmentNote ? (
                    <div className="space-y-2 md:col-span-2">
                      <p className="text-sm text-neutral-600">고가주택 안분</p>
                      <p className="text-sm font-medium leading-relaxed text-neutral-900">
                        {result.data.highPriceApportionmentNote}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-[#D5D9D2] pt-8">
                  <dl className="divide-y divide-[#E2E8F0]">
                    <ResultRow label="양도차익" value={won(result.data.transferGainWon)} emphasize />
                    {result.data.taxableTransferGainWon !== result.data.transferGainWon ? (
                      <ResultRow
                        label="과세대상 양도차익"
                        value={won(result.data.taxableTransferGainWon)}
                        sub="고가주택 안분을 반영한 금액이에요."
                      />
                    ) : null}
                    <ResultRow
                      label="장기보유특별공제"
                      value={
                        result.data.ltdRatePct > 0
                          ? `${won(result.data.ltdDeductionWon)} (${result.data.ltdRatePct}%)`
                          : "해당 없음"
                      }
                    />
                    <ResultRow label="양도소득금액" value={won(result.data.transferIncomeWon)} />
                    <ResultRow label="기본공제" value={won(result.data.basicDeductionWon)} />
                    <ResultRow label="과세표준" value={won(result.data.taxBaseWon)} emphasize />
                    <ResultRow
                      label="산출세액"
                      value={won(result.data.calculatedTaxWon)}
                      sub={result.data.isFlat ? `${result.data.appliedRatePct}% 단일세율 적용` : "누진세율 적용"}
                    />
                    <ResultRow
                      label="지방소득세"
                      value={won(result.data.localIncomeTaxWon)}
                      sub="산출세액의 10%"
                    />
                    <ResultRow
                      label={isJointOwnership ? "본인 기준 세액 (지분 기준)" : "최종 세액"}
                      value={won(result.data.finalTaxWon)}
                      emphasize
                    />
                  </dl>
                </div>
              </div>
            </section>

            {assetType === "house" ? <HomeAtozCta placement="transfer_tax_result" /> : null}

            <CalculatorConsultCta
              calculatorLabel="양도세"
              calculatorSlug="transfer_tax"
              defaultSituation="inheritance"
              resultSummary={summary}
              resultBand={ctaBand}
              estimatedTaxWon={result.data.finalTaxWon}
              titleOverride="양도세 시점 판단이 실제로 맞는지 한 번 더 확인해 보세요."
              subtitleOverride="보유기간, 비과세 요건, 공동명의 구조에 따라 실제 세액은 더 달라질 수 있어요."
              buttonLabelOverride="양도세 시점 판단 함께 보기"
            />
          </div>
        ) : !result.err ? (
          <p className="text-sm leading-relaxed text-neutral-600">
            취득일, 양도일, 양도가액을 입력하면 참고용 세액을 바로 확인할 수 있어요.
          </p>
        ) : null}
      </div>
    </div>
  );
}
