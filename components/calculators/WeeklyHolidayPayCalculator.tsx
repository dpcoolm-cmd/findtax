"use client";

import { useMemo, useState } from "react";
import { CalculatorConsultCta } from "@/components/CalculatorConsultCta";
import { CalculatorEstimateNotice } from "@/components/CalculatorEstimateNotice";
import { CalculatorTrustSection } from "@/components/calculators/CalculatorTrustSection";
import {
  parsePositiveDecimalString,
  parsePositiveIntString,
  parsePositiveWonString,
} from "@/lib/calculator-input";
import {
  calculateWeeklyHolidayPay,
  explainWeeklyHolidayPayLines,
} from "@/lib/calculators/weekly-holiday-pay";

function won(n: number) {
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

export function WeeklyHolidayPayCalculator() {
  const [hourly, setHourly] = useState("");
  const [weeklyHours, setWeeklyHours] = useState("");
  const [weeklyDays, setWeeklyDays] = useState("");

  const result = useMemo(() => {
    const h = parsePositiveWonString(hourly);
    const wh = parsePositiveDecimalString(weeklyHours, 168);
    const wd = parsePositiveIntString(weeklyDays, 7);
    if (!h.ok) return { err: hourly.trim() ? h.error : null, data: null, inputs: null };
    if (!wh.ok) return { err: wh.error, data: null, inputs: null };
    if (!wd.ok) return { err: wd.error, data: null, inputs: null };
    const inputs = { hourlyWon: h.value, weeklyWorkHours: wh.value, weeklyWorkDays: wd.value };
    const data = calculateWeeklyHolidayPay(inputs);
    return { err: null as string | null, data, inputs };
  }, [hourly, weeklyHours, weeklyDays]);

  const formulaBody = useMemo(() => {
    if (!result.data || !result.inputs) return null;
    return (
      <pre className="whitespace-pre-wrap font-sans text-sm">
        {explainWeeklyHolidayPayLines(result.inputs, result.data).join("\n")}
      </pre>
    );
  }, [result.data, result.inputs]);

  const summary =
    result.data && result.inputs
      ? `시급 ${won(result.inputs.hourlyWon)}, 주 ${result.inputs.weeklyWorkHours}시간 ${result.inputs.weeklyWorkDays}일, 주휴 ${won(result.data.weeklyHolidayPay)}`
      : null;

  return (
    <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
      <label className="block text-sm font-medium text-neutral-800">
        시급 (원)
        <input
          inputMode="numeric"
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5"
          value={hourly}
          onChange={(e) => setHourly(e.target.value)}
        />
      </label>
      <label className="mt-4 block text-sm font-medium text-neutral-800">
        주 소정근로시간 (시간/주)
        <input
          inputMode="decimal"
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5"
          value={weeklyHours}
          onChange={(e) => setWeeklyHours(e.target.value)}
          placeholder="예: 40"
        />
      </label>
      <p className="mt-1.5 text-xs text-neutral-500">실제 일한 시간이 아닌, 근로계약서에 정한 주당 근무시간을 입력하세요.</p>
      <label className="mt-4 block text-sm font-medium text-neutral-800">
        주 근무일수 (일/주)
        <input
          inputMode="numeric"
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5"
          value={weeklyDays}
          onChange={(e) => setWeeklyDays(e.target.value)}
          placeholder="예: 5"
        />
      </label>
      {result.err ? <p className="mt-2 text-sm text-red-600">{result.err}</p> : null}
      <p className="mt-2 text-xs text-neutral-500">
        주 15시간 이상·소정근로일 개근을 가정한 참고치입니다. 1일 소정근로시간 = 주 근무시간 ÷ 근무일수.
      </p>

      {result.data && result.inputs ? (
        <>
          <CalculatorTrustSection
            show
            headlineLabel="예상 주휴수당 (주당):"
            amountWon={result.data.weeklyHolidayPay}
            basisLines={[
              `1일 소정근로시간: ${result.data.dailyPrescribedHours.toFixed(2)}시간`,
              result.data.qualifies ? "주 15시간 이상으로 주휴 발생(간이)" : "주 15시간 미만으로 주휴 미발생(간이)",
            ]}
            formulaModalBody={formulaBody}
          />
          <dl className="mt-4 space-y-2 rounded-xl bg-brand-light p-4 text-sm">
            <div className="flex justify-between">
              <dt>주휴 적용</dt>
              <dd className="font-semibold text-brand">
                {result.data.qualifies ? "해당 (15시간 이상)" : "미해당 (15시간 미만)"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>주휴포함 실질 시급 (참고)</dt>
              <dd className="font-semibold">
                {Math.round(result.data.effectiveHourlyWithHoliday).toLocaleString("ko-KR")}원/시간
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>주휴포함 월급 추정 (4.345주)</dt>
              <dd className="font-semibold">{won(result.data.monthlyEstimateWithHoliday)}</dd>
            </div>
          </dl>
          <CalculatorEstimateNotice>
            <p>
              주휴일·소정근로일 배치에 따라 실지급액이 달라질 수 있습니다. 월 환산은 주당 금액에
              4.345를 곱한 참고치입니다.
            </p>
          </CalculatorEstimateNotice>
        </>
      ) : (
        <p className="mt-4 text-sm text-neutral-600">시급·주 근무시간·근무일수를 입력하세요.</p>
      )}

      <CalculatorConsultCta
        calculatorLabel="주휴수당"
        defaultSituation="income_tax"
        resultSummary={summary}
        disabled={!result.data}
      />
    </div>
  );
}
