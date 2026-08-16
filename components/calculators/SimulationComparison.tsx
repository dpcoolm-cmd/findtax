"use client";

import {
  addMonthsToYmd,
  calculateCapitalGainsFull,
  type CapitalGainsFullInput,
  type CapitalGainsFullResult,
} from "@/lib/calculators/capital-gains-estimate";

function won(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

export type SimulationScenario = {
  id: "current" | "hold_more" | "gift";
  title: string;
  taxWon: number;
  netWon: number;
  description: string;
  isBest: boolean;
};

export type TimingSimulationScenario = {
  id: "now" | "plus_6m" | "plus_1y" | "plus_2y";
  title: string;
  taxWon: number;
  diffWon: number;
  note: string;
  isBest: boolean;
};

function estimateSimpleGiftTax(priceWon: number): number {
  const giftBaseWon = Math.max(0, Math.floor(priceWon) - 50_000_000);
  if (giftBaseWon <= 0) return 0;
  if (giftBaseWon <= 100_000_000) return Math.floor(giftBaseWon * 0.1);
  return Math.floor(giftBaseWon * 0.2 - 10_000_000);
}

export function buildSimulationScenarios({
  input,
  currentResult,
  oneYearLaterResult,
}: {
  input: CapitalGainsFullInput;
  currentResult: CapitalGainsFullResult;
  oneYearLaterResult: CapitalGainsFullResult | null;
}): SimulationScenario[] {
  const currentTaxWon = currentResult.finalTaxWon;
  const currentNetWon = Math.max(0, input.transferPriceWon - currentTaxWon);

  const oneYearLaterTaxWon = oneYearLaterResult?.finalTaxWon ?? currentTaxWon;
  const oneYearLaterNetWon = Math.max(0, input.transferPriceWon - oneYearLaterTaxWon);

  const giftTaxWon = estimateSimpleGiftTax(input.transferPriceWon);
  const giftNetWon = Math.max(0, input.transferPriceWon - giftTaxWon);

  const scenarios: SimulationScenario[] = [
    {
      id: "current",
      title: "지금 매도",
      taxWon: currentTaxWon,
      netWon: currentNetWon,
      description: `${Math.floor(currentResult.holdingYears * 10) / 10}년 보유 기준`,
      isBest: false,
    },
    {
      id: "hold_more",
      title: "1년 더 보유",
      taxWon: oneYearLaterTaxWon,
      netWon: oneYearLaterNetWon,
      description: "보유기간 증가에 따른 세율과 공제 변화를 비교했어요.",
      isBest: false,
    },
    {
      id: "gift",
      title: "증여 비교",
      taxWon: giftTaxWon,
      netWon: giftNetWon,
      description: "양도 대신 증여를 선택했을 때의 참고용 비교예요.",
      isBest: false,
    },
  ];

  const bestNetWon = Math.max(...scenarios.map((scenario) => scenario.netWon));
  return scenarios.map((scenario) => ({
    ...scenario,
    isBest: scenario.netWon === bestNetWon,
  }));
}

function buildTimingNote(current: CapitalGainsFullResult, simulated: CapitalGainsFullResult): string {
  if (simulated.isExempt && !current.isExempt) {
    return "비과세 가능성이 반영된 결과예요.";
  }
  if (simulated.ltdRatePct > current.ltdRatePct) {
    return "장기보유특별공제율이 더 높아졌어요.";
  }
  if (simulated.appliedRatePct < current.appliedRatePct) {
    return "보유기간 변화로 적용 세율이 낮아졌어요.";
  }
  if (simulated.finalTaxWon === current.finalTaxWon) {
    return "현재 기준과 큰 차이 없이 계산됐어요.";
  }
  return "같은 금액 기준으로 매도 시점만 바꿔 비교했어요.";
}

export function buildTimingSimulationScenarios({
  input,
  currentResult,
}: {
  input: CapitalGainsFullInput;
  currentResult: CapitalGainsFullResult;
}): TimingSimulationScenario[] {
  const rows = [
    { id: "now" as const, title: "지금", months: 0 },
    { id: "plus_6m" as const, title: "6개월 후", months: 6 },
    { id: "plus_1y" as const, title: "1년 후", months: 12 },
    { id: "plus_2y" as const, title: "2년 후", months: 24 },
  ];

  const scenarios = rows.map((row) => {
    const simulationInput =
      row.months === 0
        ? input
        : {
            ...input,
            transferDate: addMonthsToYmd(input.transferDate, row.months),
          };

    const simulationResult =
      row.months === 0 ? currentResult : calculateCapitalGainsFull(simulationInput);
    const safeResult = simulationResult ?? currentResult;

    return {
      id: row.id,
      title: row.title,
      taxWon: safeResult.finalTaxWon,
      diffWon: safeResult.finalTaxWon - currentResult.finalTaxWon,
      note: buildTimingNote(currentResult, safeResult),
      isBest: false,
    };
  });

  const bestTaxWon = Math.min(...scenarios.map((scenario) => scenario.taxWon));
  return scenarios.map((scenario) => ({
    ...scenario,
    isBest: scenario.taxWon === bestTaxWon,
  }));
}

export function SimulationComparison({ scenarios }: { scenarios: SimulationScenario[] }) {
  if (scenarios.length === 0) return null;

  return (
    <section className="rounded-xl border border-[#D5D9D2] bg-white p-8">
      <div className="space-y-2">
        <h3 className="text-2xl font-semibold text-neutral-900">유득 시뮬레이션</h3>
        <p className="text-sm text-neutral-600">지금, 기다리기, 다른 선택을 같은 조건으로 비교해 봤어요.</p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className="rounded-xl border border-[#D5D9D2] bg-[#F8FAFC] px-5 py-6"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-neutral-900">{scenario.title}</p>
              {scenario.isBest ? (
                <span className="rounded-full bg-[#F59E0B] px-2.5 py-1 text-[11px] font-semibold text-white">
                  U-DEUK BEST
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">{scenario.description}</p>
            <div className="mt-6 space-y-5">
              <div>
                <p className="text-sm text-neutral-600">예상 세금</p>
                <p className="mt-2 text-2xl font-semibold text-neutral-900">{won(scenario.taxWon)}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-600">실수령액</p>
                <p className="mt-2 text-2xl font-semibold text-neutral-900">{won(scenario.netWon)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TimingSimulationComparison({
  scenarios,
}: {
  scenarios: TimingSimulationScenario[];
}) {
  if (scenarios.length === 0) return null;

  const currentScenario = scenarios.find((scenario) => scenario.id === "now") ?? scenarios[0];
  const bestScenario = scenarios.find((scenario) => scenario.isBest) ?? currentScenario;
  const maxGapWon = Math.max(...scenarios.map((scenario) => Math.abs(scenario.diffWon)));

  let summary = "파는 시점에 따라 세금이 얼마나 달라질 수 있는지 참고용으로 비교한 결과예요.";
  if (bestScenario.id !== "now" && bestScenario.taxWon < currentScenario.taxWon) {
    summary = `${bestScenario.title} 매도 쪽이 더 유리해 보이고, 현재 기준보다 최대 약 ${won(currentScenario.taxWon - bestScenario.taxWon)} 차이가 날 수 있어요.`;
  } else if (bestScenario.id === "now") {
    summary = "현재 입력 기준에서는 지금 매도가 가장 유리하거나 큰 차이가 없게 계산됐어요.";
  } else if (maxGapWon > 0) {
    summary = `현재 기준보다 최대 약 ${won(maxGapWon)} 차이 날 수 있어요.`;
  }

  return (
    <section className="rounded-xl border border-[#D5D9D2] bg-white p-8">
      <div className="space-y-2">
        <h3 className="text-2xl font-semibold text-neutral-900">매도 시점 비교</h3>
        <p className="text-sm text-neutral-600">
          파는 시점에 따라 세금이 얼마나 달라질 수 있는지 비교해 봤어요.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-[#D5D9D2] bg-[#F8FAFC] px-4 py-4 text-sm leading-relaxed text-neutral-700">
        {summary}
      </div>

      <div className="mt-6 space-y-3">
        {scenarios.map((scenario) => {
          const diffLabel =
            scenario.diffWon === 0
              ? "현재 기준과 같아요."
              : scenario.diffWon < 0
                ? `현재보다 ${won(Math.abs(scenario.diffWon))} 줄어들 수 있어요.`
                : `현재보다 ${won(scenario.diffWon)} 늘어날 수 있어요.`;

          return (
            <div
              key={scenario.id}
              className="rounded-xl border border-[#D5D9D2] bg-[#F8FAFC] px-5 py-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-neutral-900">{scenario.title}</p>
                    {scenario.isBest ? (
                      <span className="rounded-full border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-2.5 py-1 text-[11px] font-semibold text-[#B36B00]">
                        가장 유리
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm leading-relaxed text-neutral-600">{scenario.note}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-sm text-neutral-600">예상 세액</p>
                  <p className="mt-1 text-xl font-semibold text-neutral-900">{won(scenario.taxWon)}</p>
                  <p className="mt-2 text-sm text-neutral-600">{diffLabel}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
