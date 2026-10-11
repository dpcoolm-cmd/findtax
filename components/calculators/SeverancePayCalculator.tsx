"use client";

import { useMemo, useRef, useState } from "react";
import { CalculatorConsultCta } from "@/components/CalculatorConsultCta";
import { CalculatorEstimateNotice } from "@/components/CalculatorEstimateNotice";
import { CalculatorTrustSection } from "@/components/calculators/CalculatorTrustSection";
import { parseNonNegativeWonString, parsePositiveWonString } from "@/lib/calculator-input";
import {
  calculateSeverancePay,
  explainSeverancePayLines,
  parseYmd,
  wageReferencePeriod,
} from "@/lib/calculators/severance-pay";

function won(n: number) {
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

export function SeverancePayCalculator() {
  const [confirmed, setConfirmed] = useState(false);
  const [eligible, setEligible] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
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
    const anniversary = new Date(h.getFullYear() + 1, h.getMonth(), h.getDate());
    if (r < anniversary) return { err: "계속근로 1년 미만입니다. 법정 퇴직금 대상 여부부터 확인하세요.", data: null };
    const calc = calculateSeverancePay({
      hireYmd: hire,
      resignYmd: resign,
      lastThreeMonthsSalaryTotal: totalP.value,
      bonusInPeriodWon: bonusP.value / 4,
      annualLeaveAllowanceInPeriodWon: annualP.value / 4,
    });
    return { err: null as string | null, data: calc };
  }, [hire, resign, sum3, bonus, annual]);

  const retirementDate = parseYmd(resign);
  const period = retirementDate ? wageReferencePeriod(retirementDate) : null;
  const dateText = (d: Date) => `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}`;
  const summary =
    result.data != null
      ? `근속 ${result.data.serviceDays}일, 퇴직금 참고 ${won(result.data.severanceGross)}, 세전 금액`
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
    <div onChangeCapture={() => setConfirmed(false)} className="rounded-xl bg-white p-4 shadow-md sm:p-6">
      <p className="mb-5 rounded-lg bg-surface-muted p-4 text-sm leading-7">입퇴사 날짜와 급여명세서를 준비하세요. ① 날짜 → ② 세전 임금 → ③ 적용 조건 순서로 입력한 뒤 결과를 확인합니다.</p>
      <h2 className="mb-3 text-lg font-bold">1. 언제 입사하고 퇴직하나요?</h2>
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
          퇴직일 · 마지막 재직일 다음 날
          <input
            type="date"
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5"
            value={resign}
            onChange={(e) => setResign(e.target.value)}
          />
        </label>
      </div>
      <p className="mt-2 text-sm leading-7">예: 9월 30일까지 재직했다면 퇴직일은 10월 1일입니다. 마지막 출근일과 재직 종료일은 다를 수 있으니 회사에 확인하세요.</p>
      {period && <p className="mt-3 rounded-lg bg-surface-muted p-3 font-bold">임금 합산 기간: {dateText(period.start)} ~ {dateText(period.end)} · {period.days}일</p>}
      <h2 className="mt-6 text-lg font-bold">2. 표시된 기간의 세전 임금을 합산하세요</h2>
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
      <details className="mt-4 rounded-lg border border-line p-4"><summary className="min-h-11 cursor-pointer font-bold">선택: 연간 상여금·연차수당 추가 · 미입력은 0원</summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-neutral-800">
          반영 대상 연간 상여금 총액 (원)
          <input
            inputMode="numeric"
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5"
            value={bonus}
            onChange={(e) => setBonus(e.target.value)}
            placeholder="0"
          />
          <span className="mt-1 block text-xs font-normal text-neutral-400">연간 총액을 입력하면 3/12만 자동 반영합니다.</span>
        </label>
        <label className="block text-sm font-medium text-neutral-800">
          반영 대상 연차수당 연간 총액 (원)
          <input
            inputMode="numeric"
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5"
            value={annual}
            onChange={(e) => setAnnual(e.target.value)}
            placeholder="0"
          />
          <span className="mt-1 block text-xs font-normal text-neutral-400">평균임금 반영 대상 총액의 3/12만 자동 반영합니다. 퇴직으로 새로 발생한 미사용 연차수당은 일괄 입력하지 마세요.</span>
        </label>
      </div>
      </details>
      <h2 className="mt-6 text-lg font-bold">3. 간이 계산의 적용 조건을 확인하세요</h2>
      <label className="mt-3 flex items-start gap-3 rounded-lg border border-line p-4 text-sm leading-7"><input type="checkbox" checked={eligible} onChange={e=>setEligible(e.target.checked)} className="mt-1 h-5 w-5"/>근로자로 계속근로 1년 이상, 4주 평균 주 소정근로시간 15시간 이상이며 중간정산·근속 제외기간·평균임금 산정 제외기간이 없는 단순한 경우입니다.</label>
      <p className="mt-2 text-sm leading-7">육아휴직 등 제외기간이 있거나 통상임금이 더 높다면 <a className="underline" href="https://www.moel.go.kr/retirementpayCal.do" target="_blank" rel="noopener noreferrer">고용노동부 공식 계산기</a>를 이용하세요.</p>
      {result.err ? <p role="alert" className="mt-2 text-sm text-red-600">{result.err}</p> : null}
      <p className="mt-2 text-xs text-neutral-500">
        평균임금 = 위 임금 총액 ÷ 퇴직일 기준 직전 3개월 달력일수. 퇴직금 = 평균임금 × 30일 × (근속일수
        ÷ 365) 참고 산식입니다.
      </p>

      <button type="button" className="btn-primary mt-5 min-h-12 w-full" disabled={!result.data || !eligible} onClick={() => { setConfirmed(true); requestAnimationFrame(() => { resultRef.current?.focus(); resultRef.current?.scrollIntoView({behavior:"smooth",block:"start"}); }); }}>내 세전 퇴직금 확인하기</button>
      <div ref={resultRef} tabIndex={-1} className="mt-5 scroll-mt-24 outline-none">
      {result.data && confirmed ? (
        <>
          <CalculatorTrustSection
            show
            headlineLabel="예상 퇴직금 · 세전:"
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
          </dl>
          <CalculatorEstimateNotice>
            <p>
              세금 차감 전 참고 금액입니다. 실제 퇴직소득세와 실수령액은 계산하지 않습니다. 연간 상여·연차수당은 반영 대상인지 회사에 확인한 뒤 입력하세요.
            </p>
          </CalculatorEstimateNotice>
        </>
      ) : (
        <p className="mt-4 text-sm text-neutral-600">
          입사·퇴사일과 3개월 임금 합계를 올바르게 입력하세요.
        </p>
      )}

      </div>
      <CalculatorConsultCta
        calculatorLabel="퇴직금"
        defaultSituation="income_tax"
        resultSummary={summary}
        disabled={!result.data || !confirmed}
      />
    </div>
  );
}
