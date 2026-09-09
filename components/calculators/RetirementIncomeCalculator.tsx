"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Calculator, Printer, RotateCcw } from "lucide-react";
import { calculateRetirementIncome, RETIREMENT_DEFAULTS, RETIREMENT_REFERENCE, validateRetirementInput, type RetirementInput } from "@/lib/calculators/retirement-income";
import { trackSiteEvent } from "@/lib/site-track";

type Field = { key: keyof RetirementInput; label: string; unit: string; min: number; max: number; step?: number; money?: boolean };
const fields: Field[] = [
  { key: "currentAge", label: "현재 나이", unit: "세", min: 18, max: 119 },
  { key: "retirementAge", label: "예상 퇴직 나이", unit: "세", min: 18, max: 119 },
  { key: "assetsWon", label: "현재 퇴직연금 자산", unit: "만원", min: 0, max: 100_000_000, money: true },
  { key: "spendingMonthlyWon", label: "월 생활비 · 현재 가치", unit: "만원", min: 0, max: 100_000_000, money: true },
  { key: "pensionMonthlyWon", label: "국민연금 예상 월액 · 현재 가치", unit: "만원", min: 0, max: 100_000_000, money: true },
  { key: "pensionStartAge", label: "국민연금 수령 시작 나이", unit: "세", min: 18, max: 120 },
  { key: "additionalAssetsWon", label: "그 외 현재 노후자금", unit: "만원", min: 0, max: 100_000_000, money: true },
  { key: "monthlyContributionWon", label: "퇴직 전 매월 추가 납입", unit: "만원", min: 0, max: 100_000_000, money: true },
  { key: "otherMonthlyWon", label: "퇴직 후 기타 월소득 · 고정 금액", unit: "만원", min: 0, max: 100_000_000, money: true },
  { key: "targetAge", label: "계산 종료 나이", unit: "세", min: 19, max: 120 },
  { key: "annualReturn", label: "연평균 수익률 가정", unit: "%", min: -20, max: 15, step: 0.1 },
  { key: "inflation", label: "연평균 물가상승률 가정", unit: "%", min: 0, max: 10, step: 0.1 },
];
const initialValues = Object.fromEntries(fields.map(f => [f.key, String(RETIREMENT_DEFAULTS[f.key] / (f.money ? 10000 : 1))])) as Record<keyof RetirementInput, string>;
const won = (v: number) => `${Math.round(v / 10000).toLocaleString("ko-KR")}만원`;
const duration = (months: number | null, age: number) => months === null
  ? `${age}세까지 충당 가능`
  : months === 0
    ? "퇴직 첫 달부터 부족"
    : `${Math.floor(months / 12)}년 ${months % 12}개월`;

// No asset balances, input values or result amounts are included in analytics.
function track(event: string, destination?: string) {
  try { trackSiteEvent(event, { calculatorType: "retirement_income", calculator_type: "retirement_income", path: "/calculator/retirement-income", ...(destination ? { destination } : {}) }); } catch { /* Storage or analytics must not block calculation. */ }
}

export function RetirementIncomeCalculator() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<string[]>([]);
  const [snapshot, setSnapshot] = useState<{ input: RetirementInput; calculatedAt: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const started = useRef(false);
  const viewed = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!viewed.current) { viewed.current = true; track("calculator_view"); } }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    const input = Object.fromEntries(fields.map(f => [f.key, values[f.key].trim() === "" ? NaN : Number(values[f.key]) * (f.money ? 10000 : 1)])) as RetirementInput;
    const issues = validateRetirementInput(input);
    setErrors(issues);
    if (issues.length) return;
    setSnapshot({ input, calculatedAt: new Date().toLocaleDateString("ko-KR") });
    setDirty(false);
    track("calculator_complete");
    requestAnimationFrame(() => resultRef.current?.focus());
  }
  function field(f: Field) {
    return <div key={f.key} className="min-w-0">
      <label htmlFor={`retirement-${f.key}`} className="text-sm font-semibold text-ink">{f.label}</label>
      <div className="mt-2 flex min-h-12 items-center rounded-lg border border-line bg-white px-3 focus-within:ring-2 focus-within:ring-primary">
        <input id={`retirement-${f.key}`} type="number" inputMode="decimal" required min={f.min} max={f.max} step={f.step ?? (f.money ? 0.01 : 1)}
          value={values[f.key]} onChange={e => { setValues(v => ({ ...v, [f.key]: e.target.value })); setDirty(true); if (!started.current) { started.current = true; track("calculator_start"); } }}
          className="min-w-0 flex-1 bg-transparent py-3 text-lg font-bold outline-none" />
        <span className="ml-2 text-sm text-ink-muted">{f.unit}</span>
      </div>
    </div>;
  }
  const result = useMemo(() => snapshot ? calculateRetirementIncome(snapshot.input) : null, [snapshot]);
  const noInflation = useMemo(() => snapshot ? calculateRetirementIncome({ ...snapshot.input, inflation: 0 }) : null, [snapshot]);
  const scenarios = useMemo(() => snapshot ? [2, 4, 6].map(rate => ({ rate, result: calculateRetirementIncome({ ...snapshot.input, annualReturn: rate }) })) : [], [snapshot]);
  return <div className="space-y-10">
    <form onSubmit={submit} className="rounded-lg border border-line bg-white p-5 sm:p-7 print:hidden" aria-label="노후월급 계산 조건">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">내 노후의 기본 조건</h2>
        <button type="button" title="예시 값으로 초기화" aria-label="예시 값으로 초기화" className="flex h-11 w-11 items-center justify-center rounded-lg border border-line" onClick={() => { setValues(initialValues); setSnapshot(null); setErrors([]); setDirty(false); started.current = false; }}><RotateCcw size={18} /></button>
      </div>
      <p className="mt-2 text-sm leading-6 text-ink-muted">모르면 국민연금은 0원으로 계산해 보세요. 이미 퇴직했다면 현재 나이와 퇴직 나이를 같게 입력하세요.</p>
      <div className="mt-6 grid gap-5 md:grid-cols-2">{fields.slice(0, 6).map(field)}</div>
      <p className="mt-3 text-sm leading-6 text-ink-muted">수령 시작 나이는 본인의 국민연금 안내에서 확인하세요. 65세는 예시이며 퇴직 시점과 다를 수 있습니다.</p>
      <details className="mt-6 border-y border-line py-4" open>
        <summary className="cursor-pointer text-base font-bold">추가 자금과 계산 가정</summary>
        <div className="mt-5 grid gap-5 md:grid-cols-2">{fields.slice(6).map(field)}</div>
        <p className="mt-4 text-sm leading-6 text-ink-muted">퇴직연금과 그 외 노후자금은 중복 입력하지 마세요. 수익률은 보장되지 않으며, 기본값은 전망이 아닌 비교용 가정입니다.</p>
      </details>
      {errors.length > 0 && <ul role="alert" className="mt-4 list-disc pl-5 text-negative-deep">{errors.map(e => <li key={e}>{e}</li>)}</ul>}
      <button type="submit" className="btn-primary mt-6 w-full gap-2"><Calculator size={19} />노후월급 계산하기</button>
      <p className="mt-3 text-center text-xs leading-5 text-ink-muted">입력한 금융 금액은 이 브라우저에서만 계산하며 서버에 저장하지 않습니다.</p>
    </form>

    <div ref={resultRef} tabIndex={-1} aria-live="polite" aria-atomic="false" className="scroll-mt-32 outline-none">
      {result && snapshot && noInflation ? <section aria-label="노후월급 계산 결과" className="space-y-8">
        <section className="hidden print:block">
          <h2 className="text-xl font-bold">FindTax 노후월급 리포트</h2>
          <p>계산일 {snapshot.calculatedAt}</p>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">{fields.map(f => <div key={f.key}><dt>{f.label}</dt><dd>{(snapshot.input[f.key] / (f.money ? 10000 : 1)).toLocaleString("ko-KR")}{f.unit}</dd></div>)}</dl>
        </section>
        {dirty && <p role="status" className="border-l-4 border-warning-deep pl-4 text-sm font-bold">입력값이 변경됐습니다. 아래는 이전 결과이므로 다시 계산해 주세요.</p>}
        <div className="border-y border-line bg-surface-muted px-5 py-7 sm:px-7">
          <p className="text-sm font-bold text-ink-muted">퇴직 첫 달, 금융자산으로 채울 생활비</p>
          <h2 className="mt-3 break-words text-3xl font-extrabold text-ink">월 {won(result.firstMonthGapWon)}</h2>
          <p className="mt-4 text-base leading-7">{result.depletionAfterMonths === 0
            ? <>입력 조건에서는 <strong>퇴직 첫 달부터 생활비가 부족</strong>합니다.</>
            : result.depletionAfterMonths === null
              ? <>입력 조건에서는 <strong>{snapshot.input.targetAge}세까지 부족생활비를 충당</strong>할 수 있을 것으로 예상됩니다.</>
              : <>입력 조건에서는 퇴직 후 <strong>{duration(result.depletionAfterMonths, snapshot.input.targetAge)}</strong> 동안 부족생활비를 전액 충당할 수 있습니다.</>}</p>
          <p className="mt-2 text-sm leading-6 text-ink-muted">국민연금은 {snapshot.input.pensionStartAge}세부터 반영합니다. 자산 지속기간은 첫 부족 발생 전까지이며, 실제 잔액이 정확히 0원이 되는 날짜는 아닙니다.</p>
        </div>
        <dl className="grid gap-6 border-b border-line pb-7 sm:grid-cols-3">
          {[["퇴직 시점 예상 금융자산", won(result.retirementAssetsWon)], ["퇴직 첫 달 국민연금 충당률", `${Math.round(result.pensionCoveragePercent)}%`], ["목표 나이까지 추가 필요자금 · 퇴직 시점", won(result.additionalNeededWon)]].map(([label, value]) => <div key={label}><dt className="text-sm leading-6 text-ink-muted">{label}</dt><dd className="mt-2 break-words text-xl font-bold">{value}</dd></div>)}
        </dl>
        <section aria-labelledby="retirement-balance-title">
          <h3 id="retirement-balance-title" className="text-xl font-bold">나이별 예상 자산</h3>
          <p className="mt-2 text-sm text-ink-muted">막대는 명목 잔액, 괄호는 현재 구매력입니다.</p>
          <div className="mt-5 space-y-4">
            {result.points.filter((p, i) => i % 5 === 0 || p.age === snapshot.input.targetAge).map(p => <div key={p.age}>
              <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm"><span className="font-bold">{p.age}세</span><span>{won(p.assetsWon)} <span className="text-ink-muted">({won(p.realAssetsWon)})</span></span></div>
              <div className="h-3 overflow-hidden rounded bg-bg" aria-hidden="true"><div className="h-full bg-positive-deep" style={{ width: `${p.assetsWon / Math.max(1, ...result.points.map(v => v.assetsWon)) * 100}%` }} /></div>
            </div>)}
          </div>
        </section>
        <section className="border-t border-line pt-7">
          <h3 className="text-xl font-bold">수익률이 달라진다면?</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {scenarios.map(({ rate, result: scenario }) => {
              return <div key={rate} className="rounded-lg border border-line p-4"><p className="font-bold">연 {rate}% 가정</p><p className="mt-3 text-sm">{duration(scenario.depletionAfterMonths, snapshot.input.targetAge)}</p><p className="mt-2 text-sm text-ink-muted">추가 필요 {won(scenario.additionalNeededWon)}</p></div>;
            })}
          </div>
          <p className="mt-4 text-sm leading-6 text-ink-muted">위 2·4·6%는 단순 비교 시나리오입니다. 본 계산에는 입력한 {snapshot.input.annualReturn}%를 사용했습니다.</p>
          <p className="mt-3 text-sm leading-6">추가 필요자금: 물가 {snapshot.input.inflation}% 반영 <strong>{won(result.additionalNeededWon)}</strong> / 물가 미반영 <strong>{won(noInflation.additionalNeededWon)}</strong>. 모두 퇴직 시점에 더 필요한 목돈입니다.</p>
        </section>
        <details className="border-y border-line py-4">
          <summary className="cursor-pointer font-bold">연령별 생활비·소득 상세</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {result.points.filter((_, i) => i % 5 === 0 || i === result.points.length - 1).map(p => <dl key={p.age} className="border-t border-line pt-3 text-sm leading-7"><dt className="font-bold">{p.age}세 월 현금흐름</dt><dd>생활비 {won(p.spendingWon)}</dd><dd>국민연금 {won(p.pensionWon)} + 기타 {won(p.otherWon)}</dd><dd>금융자산 부담 {won(Math.max(0, p.spendingWon - p.pensionWon - p.otherWon))}</dd></dl>)}
          </div>
        </details>
        <div className="flex flex-wrap items-center gap-4 print:hidden">
          <Link href="/calculator/연말정산" className="btn-secondary gap-2" onClick={() => track("related_calculator_click", "/calculator/연말정산")}>연금·IRP 절세도 확인<ArrowRight size={18} /></Link>
          <button type="button" disabled={dirty} className="btn-secondary gap-2 disabled:opacity-50" onClick={() => { track("calculator_pdf_click"); window.print(); }}><Printer size={18} />인쇄·PDF</button>
        </div>
        <p className="text-xs text-ink-muted">계산일 {snapshot.calculatedAt} · 계산 버전 {RETIREMENT_REFERENCE.version}</p>
      </section> : null}
    </div>
  </div>;
}
