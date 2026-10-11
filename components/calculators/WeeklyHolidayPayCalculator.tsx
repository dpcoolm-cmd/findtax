"use client";
import { useRef, useState, type FormEvent } from "react";
import { CalculatorTrustSection } from "@/components/calculators/CalculatorTrustSection";
import { parsePositiveDecimalString, parsePositiveWonString } from "@/lib/calculator-input";
import { calculateWeeklyHolidayPay, explainWeeklyHolidayPayLines } from "@/lib/calculators/weekly-holiday-pay";

export function WeeklyHolidayPayCalculator() {
  const [hourly, setHourly] = useState("");
  const [hours, setHours] = useState("");
  const [attendance, setAttendance] = useState("");
  const [scope, setScope] = useState(false);
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState<{ hourlyWon: number; weeklyWorkHours: number; weeklyWorkDays: number; attended: boolean } | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const result = snapshot ? calculateWeeklyHolidayPay(snapshot) : null;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const wage = parsePositiveWonString(hourly);
    const time = parsePositiveDecimalString(hours, 40);
    const issue = !wage.ok ? ["weekly-hourly", "시급을 원 단위의 양수로 입력해 주세요."] : !time.ok ? ["weekly-hours", "주 소정근로시간은 0 초과 40시간 이하로 입력하세요."] : !attendance || attendance === "unknown" ? ["weekly-attendance", "개근 여부를 확인해야 지급 조건을 판단할 수 있습니다."] : !scope ? ["weekly-scope", "이 계산의 적용 조건을 확인해 주세요."] : null;
    if (issue) { setError(issue[1]); document.getElementById(issue[0])?.focus(); return; }
    if (!wage.ok || !time.ok) return;
    setError(""); setSnapshot({hourlyWon:wage.value, weeklyWorkHours:time.value, weeklyWorkDays:5, attended:attendance === "yes"});
    requestAnimationFrame(() => { resultRef.current?.focus(); resultRef.current?.scrollIntoView({behavior:"smooth",block:"start"}); });
  }
  const field = "mt-2 min-h-12 w-full rounded-lg border border-line bg-white px-3 focus-visible:outline focus-visible:outline-2";
  return <div className="rounded-xl border border-line bg-white p-4 sm:p-6">
    <p className="rounded-lg bg-surface-muted p-4 text-sm leading-7">근로계약서를 준비하세요. 시급과 약속한 주 근무시간을 입력하고, 해당 주의 개근 여부를 확인하면 됩니다.</p>
    <form noValidate onSubmit={submit} onChange={() => { setSnapshot(null); setError(""); }} className="mt-6 space-y-6">
      <section><h2 className="text-lg font-bold">1. 시급은 얼마인가요?</h2><label htmlFor="weekly-hourly" className="mt-3 block text-sm font-medium">세전 시급 (원)</label><input id="weekly-hourly" name="hourlyWage" autoComplete="off" inputMode="numeric" value={hourly} onChange={e=>setHourly(e.target.value)} placeholder="예: 10000" className={field}/><p className="mt-2 text-sm text-ink-muted">월급이나 일급이 아닌 시간당 금액입니다. 예시의 10,000원은 최저임금 안내가 아닙니다.</p></section>
      <section><h2 className="text-lg font-bold">2. 일주일에 몇 시간 일하기로 했나요?</h2><label htmlFor="weekly-hours" className="mt-3 block text-sm font-medium">4주 평균 주 소정근로시간 (시간)</label><input id="weekly-hours" name="weeklyHours" autoComplete="off" inputMode="decimal" value={hours} onChange={e=>setHours(e.target.value)} placeholder="예: 하루 6시간 × 주 3일 = 18" className={field}/><p className="mt-2 text-sm text-ink-muted">휴게시간과 연장근로를 빼고 근로계약으로 약속한 시간을 입력하세요. 매주 같으면 그 주의 시간을, 주마다 다르면 4주 평균을 입력합니다.</p></section>
      <section><h2 className="text-lg font-bold">3. 지급 조건을 확인하세요</h2><label htmlFor="weekly-attendance" className="mt-3 block text-sm font-medium">계산할 주의 소정근로일에 개근했나요?</label><select id="weekly-attendance" name="attendance" value={attendance} onChange={e=>setAttendance(e.target.value)} className={field}><option value="">선택해 주세요</option><option value="yes">네, 약속한 근무일에 결근하지 않았어요</option><option value="no">아니요, 결근했어요</option><option value="unknown">잘 모르겠어요</option></select><p className="mt-2 text-sm text-ink-muted">지각·조퇴·법정 휴가를 곧바로 결근으로 보지 않습니다. 판단이 어려우면 고용노동부 1350에 확인하세요.</p><label className="mt-4 flex items-start gap-3 rounded-lg border border-line p-4 text-sm leading-6"><input id="weekly-scope" type="checkbox" checked={scope} onChange={e=>setScope(e.target.checked)} className="mt-1 h-5 w-5"/>근로기준법상 근로자이며, 해당 1주 동안 근로관계가 유지됩니다. 같은 업무의 통상근로자가 주 5일·40시간 근무하는 기준으로 계산함을 확인했어요.</label><p className="mt-2 text-sm text-ink-muted">사업장의 통상근로자 근무일수가 다르거나 주 40시간 초과·불규칙 일정이면 이 결과를 그대로 적용하지 마세요.</p></section>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button type="submit" className="btn-primary min-h-12 w-full">내 주휴수당 확인하기</button>
    </form>
    <div ref={resultRef} tabIndex={-1} className="mt-6 scroll-mt-24 outline-none" aria-live="polite">
      {result && snapshot && (!snapshot.attended || !result.qualifies) ? <section data-calculator-result className="rounded-lg bg-surface-muted p-5"><h2 className="font-bold">입력한 조건에서는 지급 요건을 충족하지 않습니다</h2><p className="mt-2 text-sm leading-7">{!snapshot.attended ? "소정근로일에 결근한 것으로 입력했습니다. 실제 결근에 해당하는지 먼저 확인하세요." : "4주 평균 주 소정근로시간이 15시간 미만으로 입력됐습니다."}</p></section> : result && snapshot ? <><CalculatorTrustSection show headlineLabel="예상 주휴수당 · 1주 기준:" amountWon={result.weeklyHolidayPay} basisLines={[`시급 ${snapshot.hourlyWon.toLocaleString("ko-KR")}원 · 주 ${snapshot.weeklyWorkHours}시간 · 개근 확인`, `주 5일·40시간 통상근로자 기준 주휴시간 ${result.dailyPrescribedHours.toFixed(2)}시간`]} formulaModalBody={<pre className="whitespace-pre-wrap font-sans">{explainWeeklyHolidayPayLines(snapshot,result).join("\n")}</pre>}/><p className="mt-3 text-sm leading-7">월 환산 임금은 약 {result.monthlyEstimateWithHoliday.toLocaleString("ko-KR")}원입니다. 기본 근로임금과 주휴수당을 합해 4.345주로 환산한 참고치로, 실제 월급·실수령액과 다릅니다. 월급에 주휴수당이 포함돼 있다면 이 금액을 다시 더하지 마세요.</p></> : <p className="text-sm text-ink-muted">위 3단계를 입력한 뒤 버튼을 누르면 결과가 여기에 표시됩니다.</p>}
    </div>
    <a className="mt-5 inline-block text-sm underline" href="https://1350.moel.go.kr/rtmview.do?id=1000269642" target="_blank" rel="noopener noreferrer">고용노동부 지급 조건·단시간 근로 산식 확인</a>
  </div>;
}
