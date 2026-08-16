"use client";

import { useMemo, useState } from "react";
import { CalculatorConsultCta } from "@/components/CalculatorConsultCta";
import { CalculatorEstimateNotice } from "@/components/CalculatorEstimateNotice";
import { CalculatorTrustSection } from "@/components/calculators/CalculatorTrustSection";
import { parseNonNegativeWonString, parsePositiveWonString } from "@/lib/calculator-input";
import {
  calculateSeverancePay,
  explainSeverancePayLines,
  parseYmd,
} from "@/lib/calculators/severance-pay";

function won(n: number) {
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

export function SeverancePayCalculator() {
  const [hire, setHire] = useState("");
  const [resign, setResign] = useState("");
  const [sum3, setSum3] = useState("");
  const [bonus, setBonus] = useState("");
  const [annual, setAnnual] = useState("");

  const result = useMemo(() => {
    const totalP = parsePositiveWonString(sum3);
    if (!totalP.ok) return { err: sum3.trim() ? totalP.error : null, data: null as null };
    const bonusP = parseNonNegativeWonString(bonus);
    const annualP = parseNonNegativeWonString(annual);
    if (!bonusP.ok) return { err: bonusP.error, data: null };
    if (!annualP.ok) return { err: annualP.error, data: null };
    const h = parseYmd(hire);
    const r = parseYmd(resign);
    if (!h || !r) return { err: "입사일·퇴사일을 선택하세요.", data: null };
    if (h.getTime() > r.getTime()) {
      return { err: "입사일은 퇴사일과 같거나 이전이어야 합니다.", data: null };
    }
    const calc = calculateSeverancePay({
      hireYmd: hire,
      resignYmd: resign,
      lastThreeMonthsSalaryTotal: totalP.value,
      bonusInPeriodWon: bonusP.value,
      annualLeaveAllowanceInPeriodWon: annualP.value,
    });
    return { err: null as string | null, data: calc };
  }, [hire, resign, sum3, bonus, annual]);

  const summary =
    result.data != null
      ? `근속 ${result.data.serviceDays}일, 퇴직금 참고 ${won(result.data.severanceGross)}, 실수령(간이) ${won(result.data.netAfterTax)}`
      : null;

  const formulaBody = useMemo(() => {
    if (!result.data) return null;
    return (
      <pre className="whitespace-pre-wrap font-sans text-sm">
        {explainSeverancePayLines(result.data).join("\n")}
      </pre>
    );
  }, [result.data]);

  return (
    <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-neutral-800">
          입사일
          <input
            type="date"
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5"
            value={hire}
            onChange={(e) => setHire(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-neutral-800">
          퇴사일
          <input
            type="date"
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5"
            value={resign}
            onChange={(e) => setResign(e.target.value)}
          />
        </label>
      </div>
      <label className="mt-4 block text-sm font-medium text-neutral-800">
        퇴직 전 3개월 기본급·임금 총액 (원, 세전)
        <input
          inputMode="numeric"
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5"
          value={sum3}
          onChange={(e) => setSum3(e.target.value)}
          placeholder="예: 9000000 (3개월 세전 기본급 합산)"
        />
      </label>
      <p className="mt-1.5 text-xs text-neutral-500">
        세전 금액으로 입력하세요. 상여금·연차수당은 아래에서 따로 입력해요.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-neutral-800">
          상여금 (원, 선택)
          <input
            inputMode="numeric"
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5"
            value={bonus}
            onChange={(e) => setBonus(e.target.value)}
            placeholder="0"
          />
          <span className="mt-1 block text-xs font-normal text-neutral-400">연간 상여금 ÷ 12 × 3개월 분 입력</span>
        </label>
        <label className="block text-sm font-medium text-neutral-800">
          연차수당 (원, 선택)
          <input
            inputMode="numeric"
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5"
            value={annual}
            onChange={(e) => setAnnual(e.target.value)}
            placeholder="0"
          />
          <span className="mt-1 block text-xs font-normal text-neutral-400">퇴직 전 1년간 지급된 미사용 연차수당 총액</span>
        </label>
      </div>
      {result.err ? <p className="mt-2 text-sm text-red-600">{result.err}</p> : null}
      <p className="mt-2 text-xs text-neutral-500">
        평균임금 = 위 임금 총액 ÷ 퇴직일 기준 직전 3개월 달력일수. 퇴직금 = 평균임금 × 30일 × (근속일수
        ÷ 365) 참고 산식입니다.
      </p>

      {result.data ? (
        <>
          <CalculatorTrustSection
            show
            headlineLabel="예상 퇴직금 총액:"
            amountWon={result.data.severanceGross}
            basisLines={[
              `산정기간 ${result.data.referencePeriodDays}일, 임금총액 ${won(result.data.wageTotalForAverage)}`,
              `근속 약 ${result.data.serviceYears.toFixed(2)}년 (${result.data.serviceDays}일)`,
            ]}
            formulaModalBody={formulaBody}
            extraDisclaimer="※ 본 계산은 평균임금 기준이며, 통상임금이 더 높을 경우 결과가 달라질 수 있습니다."
          />
          <dl className="mt-4 space-y-2 rounded-xl bg-brand-light p-4 text-sm">
            <div className="flex justify-between">
              <dt>근속일수</dt>
              <dd className="font-semibold text-brand">
                {result.data.serviceDays.toLocaleString("ko-KR")}일 (약{" "}
                {result.data.serviceYears.toFixed(2)}년 환산)
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>산정기간 일수</dt>
              <dd className="font-semibold">{result.data.referencePeriodDays}일</dd>
            </div>
            <div className="flex justify-between">
              <dt>일평균임금 (참고)</dt>
              <dd className="font-semibold">{won(result.data.dailyAverageWage)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>퇴직소득세 추정액 (간이)</dt>
              <dd className="font-semibold">{won(result.data.estimatedIncomeTax)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>실수령액 (참고)</dt>
              <dd className="font-semibold">{won(result.data.netAfterTax)}</dd>
            </div>
          </dl>
          <CalculatorEstimateNotice>
            <p>
              퇴직소득세는 근속연수 공제·분할연금·중간정산 등에 따라 달라집니다. 표시 세액은
              퇴직금의 약 5%를 가정한 매우 간략한 참고치입니다.
            </p>
          </CalculatorEstimateNotice>
        </>
      ) : (
        <p className="mt-4 text-sm text-neutral-600">
          입사·퇴사일과 3개월 임금 합계를 올바르게 입력하세요.
        </p>
      )}

      <CalculatorConsultCta
        calculatorLabel="퇴직금"
        defaultSituation="income_tax"
        resultSummary={summary}
        disabled={!result.data}
      />
    </div>
  );
}
