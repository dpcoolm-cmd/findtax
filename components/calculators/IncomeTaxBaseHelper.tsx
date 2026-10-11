"use client";
import { useState } from "react";
import { parseNonNegativeWonString, parsePositiveWonString } from "@/lib/calculator-input";

export function IncomeTaxBaseHelper({ onApply }: { onApply: (value: string) => void }) {
  const [values, setValues] = useState(["", "", ""]);
  const [businessOnly, setBusinessOnly] = useState(false);
  const [message, setMessage] = useState("");
  const revenue = parsePositiveWonString(values[0]);
  const expenses = parseNonNegativeWonString(values[1]);
  const deductions = parseNonNegativeWonString(values[2]);
  const complete = values.every(value => value.trim() !== "") && revenue.ok && expenses.ok && deductions.ok;
  const base = complete ? Math.max(0, revenue.value - expenses.value - deductions.value) : null;
  return <details className="mb-5 rounded-xl border border-line bg-surface-muted p-4">
    <summary className="min-h-11 cursor-pointer font-bold">과세표준을 모르겠어요</summary>
    <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
      <li>홈택스 신고서의 ‘종합소득 과세표준’을 확인하면 아래 본 계산기에 바로 입력할 수 있습니다.</li>
      <li>사업소득은 수입에서 인정되는 필요경비를 뺀 소득금액부터 확인합니다.</li>
      <li>종합소득금액에서 적용 가능한 소득공제를 빼면 과세표준입니다. 세액공제는 여기에서 빼지 않습니다.</li>
    </ol>
    <p className="mt-3 text-sm leading-6">아래 보조 계산은 사업소득만 있고 본인의 경비·소득공제를 아는 경우에 사용하세요. 근로·이자·배당 등 다른 소득, 결손금·특례·공제 한도 조정은 반영하지 않습니다.</p>
    <label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" checked={businessOnly} onChange={event => { setBusinessOnly(event.target.checked); setMessage(""); }} className="mt-1 h-4 w-4" />사업소득만 있는 경우의 참고 계산임을 확인했어요</label>
    <div className="mt-4 grid gap-4 sm:grid-cols-3">{["연간 사업 수입 (원)", "인정되는 필요경비 (원)", "적용 가능한 소득공제 합계 (원)"].map((label, index) => <label key={label} className="text-sm font-medium">{label}<input inputMode="numeric" name={`incomeBase${index}`} autoComplete="off" value={values[index]} onChange={event => { setValues(current => current.map((value, i) => i === index ? event.target.value : value)); setMessage(""); }} placeholder={index === 0 ? "예: 30,000,000" : "없으면 0"} className="mt-2 min-h-12 w-full rounded-lg border border-line bg-white px-3 focus-visible:outline focus-visible:outline-2" /></label>)}</div>
    <p className="mt-3 text-xs leading-6">경비와 공제는 자동 판단하지 않습니다. 의료비·교육비·연금계좌 등의 세액공제를 소득공제에 넣지 마세요.</p>
    {base !== null && <p className="mt-3 font-bold">참고 과세표준: {base.toLocaleString("ko-KR")}원</p>}
    <button type="button" className="btn-secondary mt-4" onClick={() => {
      if (!businessOnly) { setMessage("사업소득만 있는 경우인지 먼저 확인해 주세요."); return; }
      if (base === null) { setMessage("세 항목을 모두 원 단위로 입력해 주세요. 경비·소득공제가 없으면 0을 입력하세요."); return; }
      onApply(String(base)); setMessage("참고 과세표준을 아래 계산기에 반영했습니다.");
    }}>이 과세표준으로 계산하기</button>
    <p role="status" className="mt-3 text-sm">{message}</p>
    <a href="https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7666&mi=2224" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm underline">국세청 소득세 계산 흐름 확인</a>
  </details>;
}
