"use client";

import { useEffect, useState, type FormEvent } from "react";
import { compareShopping, evaluateJapan, evaluateReturn, type GoodsKind, type JapanInput, type ReturnResult } from "@/lib/calculators/travel-customs";
import { yenToUsd } from "@/lib/calculators/customs-exchange";
import { trackSiteEvent } from "@/lib/site-track";

const kinds: { value: GoodsKind; label: string }[] = [
  { value: "general", label: "일반 물품" }, { value: "clothing", label: "의류·신발" }, { value: "alcohol", label: "주류" },
  { value: "perfume", label: "향수" }, { value: "cigarettes", label: "궐련" }, { value: "luxury", label: "고급 가방·시계·귀금속" },
];
type Row = { kind: GoodsKind; currency: "USD" | "JPY"; price: string; quantity: string; unitMl: string; sticks: string };
const blank = (): Row => ({ kind: "general", currency: "USD", price: "", quantity: "1", unitMl: "", sticks: "" });
const money = (n: number) => n.toLocaleString("ko-KR");
const usdMoney = (n: number) => n.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
const num = (v: string) => v.trim() === "" ? null : Number(v.replaceAll(",", ""));
function track(event: string, status?: string) {
  try { trackSiteEvent(event, { calculatorType: "travel_customs", path: "/calculator/travel-customs", ...(status ? { status } : {}) }); } catch { /* Analytics cannot block the calculator. */ }
}
const fieldClass = "mt-1 min-h-11 w-full min-w-0 rounded-lg border border-line bg-white px-3 py-2 text-base text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";
const labelClass = "block text-sm font-semibold text-ink";
const initialJapan: JapanInput = { purchaseDate: "", departureDate: "", taxIncludedYen: 0, taxRate: 10, sameStoreDayTaxExcludedYen: null, eligibleStore: false, eligibleTraveler: false, allGoodsExported: false, customsConfirmed: false, refundReceivedYen: null, feeYen: null };
const todayKst = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
type RateState = { status: "idle" | "loading" | "available" | "unavailable"; forDate?: string; usd?: number; jpy?: number; appliedFrom?: string; provisional?: boolean };

export function TravelCustomsCalculator() {
  const [mode, setMode] = useState<"returning" | "japan-shopping">("returning");
  const [arrival, setArrival] = useState(todayKst);
  const [rate, setRate] = useState<RateState>({ status: "idle" });
  const [adult, setAdult] = useState(true);
  const [commercial, setCommercial] = useState(false);
  const [rows, setRows] = useState<Row[]>([blank()]);
  const [result, setResult] = useState<(ReturnResult & { rateProvisional: boolean }) | null>(null);
  const [japan, setJapan] = useState<JapanInput>(initialJapan);
  const [japanCalculated, setJapanCalculated] = useState(false);
  const [cardCharge, setCardCharge] = useState("");
  const [domestic, setDomestic] = useState("");
  const [refundKrw, setRefundKrw] = useState("");
  useEffect(() => { track("calculator_view"); }, []);
  useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(arrival)) { setRate({ status: "idle" }); return; }
    const controller = new AbortController();
    const currentDate = todayKst();
    const provisional = arrival > currentDate;
    const lookupDate = provisional ? currentDate : arrival;
    setRate({ status: "loading" });
    fetch(`/api/travel-customs/rates?date=${encodeURIComponent(lookupDate)}`, { signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok || data.status !== "verified_import_rates" || data.unit !== "KRW_per_1_currency_unit") throw new Error("rate_unavailable");
        const usd = data.rates.find((item: { currency: string }) => item.currency === "USD");
        const jpy = data.rates.find((item: { currency: string }) => item.currency === "JPY");
        if (!usd || !jpy || usd.appliedFrom !== jpy.appliedFrom) throw new Error("rate_mismatch");
        setRate({ status: "available", forDate: arrival, usd: usd.rawRate, jpy: jpy.rawRate, appliedFrom: usd.appliedFrom, provisional });
      })
      .catch(() => { if (!controller.signal.aborted) setRate({ status: "unavailable" }); });
    return () => controller.abort();
  }, [arrival]);
  function changeRow(index: number, patch: Partial<Row>) { setRows(old => old.map((r, i) => i === index ? { ...r, ...patch } : r)); setResult(null); }
  function calculate(event: FormEvent) {
    event.preventDefault();
    const activeRate = rate.status === "available" && rate.forDate === arrival ? rate : null;
    const next = evaluateReturn({ arrivalDate: arrival, adult, commercial, goods: rows.map(r => ({ kind: r.kind, valueUsd: r.currency === "USD" ? num(r.price) : activeRate?.usd && activeRate.jpy ? yenToUsd(num(r.price) ?? NaN, activeRate.jpy, activeRate.usd) : null, quantity: Number(r.quantity), unitMl: num(r.unitMl) ?? undefined, sticks: num(r.sticks) ?? undefined })) });
    const rateProvisional = rows.some(r => r.currency === "JPY") && activeRate?.provisional === true;
    setResult({ ...next, rateProvisional, taxKrw: rateProvisional ? null : next.taxKrw, reasons: rateProvisional ? [...next.reasons, "현재 공개된 관세환율을 적용한 참고 판정입니다. 실제 입국일 환율이 발표되면 다시 확인하세요."] : next.reasons });
    track("calculator_complete"); track("calculator_result_view", rateProvisional ? "provisional" : next.eligibility.toLowerCase());
  }
  const jp = japanCalculated ? evaluateJapan(japan) : null;
  // A received refund in JPY is evidence of payment, but a separate actual KRW credit is needed for KRW cost comparison.
  const comparison = compareShopping(num(cardCharge), num(domestic), result?.taxKrw ?? null, jp?.receivedYen !== null && jp?.receivedYen !== undefined ? num(refundKrw) : null);
  return <div className="space-y-7">
    <div role="tablist" aria-label="계산 방식" className="grid grid-cols-2 gap-2">
      {(["returning", "japan-shopping"] as const).map(m => <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); track("calculator_start", m); }} className={`min-h-12 rounded-lg border px-2 py-2 text-sm font-bold sm:text-base ${mode === m ? "border-primary bg-primary text-white" : "border-line bg-white text-ink"}`}>{m === "returning" ? "한국 입국 면세·관세" : "일본 쇼핑 실구매가"}</button>)}
    </div>
    {mode === "japan-shopping" && <p className="rounded-lg bg-surface-muted p-4 text-sm leading-6">일본 소비세 환급과 한국 입국 면세는 서로 다릅니다. 아래 한국 반입 물품을 먼저 계산한 뒤 일본 쇼핑 비용을 비교하세요.</p>}
    <form onSubmit={calculate} className="rounded-lg border border-line bg-white p-4 sm:p-6">
      <h2 className="text-xl font-bold">한국 반입 물품</h2>
      <p className="mt-2 text-sm leading-6 text-ink-muted">한 여행자의 해외 구매·선물·국내/입국장 면세점 구매분을 모두 입력하세요. USD 또는 JPY 가격을 입력할 수 있습니다. 미래 입국일의 환율이 아직 없다면 현재 공개된 관세환율로 JPY를 환산해 참고 판정을 보여 줍니다. 다른 통화는 관세청 기준으로 확인한 USD 상당액을 입력하세요.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>한국 입국 예정일<input className={fieldClass} type="date" required value={arrival} onChange={e => { setArrival(e.target.value); setResult(null); }} /></label>
        <label className={labelClass}>반입자<select className={fieldClass} value={adult ? "adult" : "minor"} onChange={e => { setAdult(e.target.value === "adult"); setResult(null); }}><option value="adult">성인</option><option value="minor">미성년자 (주류·담배 별도면세 제외)</option></select></label>
      </div>
      <p className="mt-3 text-xs leading-5 text-ink-muted" role="status">{rate.status === "loading" || rate.status === "available" && rate.forDate !== arrival ? "관세환율 조회 중…" : rate.status === "available" ? `${rate.provisional ? "현재 공개된 관세환율 기준 참고값" : "관세청 수입 관세환율"} (${rate.appliedFrom?.slice(0, 4)}-${rate.appliedFrom?.slice(4, 6)}-${rate.appliedFrom?.slice(6, 8)}부터): 1 USD = ${money(rate.usd!)}원 · 1 JPY = ${rate.jpy}원${rate.provisional ? " · 입국일 환율은 아직 발표되지 않아 재확인이 필요합니다." : ""}` : rate.status === "unavailable" ? "관세환율을 조회할 수 없습니다. 미화 상당액을 관세청에서 확인해 입력하세요." : "입국일을 입력하면 관세청 수입 관세환율의 기준일을 조회합니다."} <a className="underline" href="https://www.data.go.kr/data/15101230/openapi.do" target="_blank" rel="noopener noreferrer">출처</a></p>
      <label className="mt-4 flex min-h-11 items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={commercial} onChange={e => { setCommercial(e.target.checked); setResult(null); }} />판매·업무용 물품입니다</label>
      <div className="mt-5 space-y-4">{rows.map((r, index) => <fieldset key={index} className="rounded-lg border border-line bg-surface-muted p-4">
        <legend className="px-1 text-sm font-bold">물품 {index + 1}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>종류<select className={fieldClass} value={r.kind} onChange={e => changeRow(index, { kind: e.target.value as GoodsKind })}>{kinds.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}</select></label>
          <label className={labelClass}>가격 통화<select className={fieldClass} value={r.currency} onChange={e => changeRow(index, { currency: e.target.value as "USD" | "JPY" })}><option value="USD">미국 달러 (USD)</option><option value="JPY">일본 엔 (JPY)</option></select></label>
          <label className={labelClass}>전체 취득가격 ({r.currency})<input className={fieldClass} inputMode="decimal" type="number" min="0" step="0.01" placeholder="모르면 비워두세요" value={r.price} onChange={e => changeRow(index, { price: e.target.value })} /></label>
          <label className={labelClass}>수량<input className={fieldClass} inputMode="numeric" type="number" min="1" step="1" value={r.quantity} onChange={e => changeRow(index, { quantity: e.target.value })} /></label>
          {(r.kind === "alcohol" || r.kind === "perfume") && <label className={labelClass}>1개 용량 (mL)<input className={fieldClass} inputMode="decimal" type="number" min="1" value={r.unitMl} onChange={e => changeRow(index, { unitMl: e.target.value })} /></label>}
          {r.kind === "cigarettes" && <label className={labelClass}>1개 묶음당 개비<input className={fieldClass} inputMode="numeric" type="number" min="1" step="1" value={r.sticks} onChange={e => changeRow(index, { sticks: e.target.value })} /></label>}
        </div>
        {rows.length > 1 && <button type="button" className="mt-3 min-h-11 text-sm font-semibold underline" onClick={() => { setRows(old => old.filter((_, i) => i !== index)); setResult(null); }}>물품 삭제</button>}
      </fieldset>)}</div>
      <button type="button" className="mt-4 min-h-11 rounded-lg border border-line px-4 text-sm font-bold" onClick={() => { setRows(old => [...old, blank()]); setResult(null); }}>+ 물품 추가</button>
      {rows.some(r => r.currency === "JPY") && (rate.status !== "available" || rate.forDate !== arrival) && <p className="mt-3 text-sm leading-6 text-ink-muted">JPY 가격은 관세환율 조회가 완료되어야 면세한도에 반영됩니다. 조회할 수 없으면 결과를 추가 확인 필요로 표시합니다.</p>}
      <button type="submit" className="btn-primary mt-5 w-full">면세 범위 확인하기</button>
      <p className="mt-3 text-xs leading-5 text-ink-muted">입력한 구매 내역과 금액은 브라우저에서만 계산하며 분석 이벤트에 포함하지 않습니다.</p>
    </form>
    {result && <section aria-live="polite" className="rounded-lg border border-line bg-white p-5 sm:p-6">
      <p className="text-sm font-bold text-ink-muted">입력한 물품 기준 한국 입국 판정</p>
      <h2 className="mt-2 text-2xl font-extrabold">{result.rateProvisional && result.eligibility === "WITHIN_LIMIT" ? "현재 환율 기준 면세 범위 내 예상 · 입국일 재확인" : result.rateProvisional && result.eligibility === "OVER_LIMIT" ? "현재 환율 기준 한도 초과 가능 · 입국일 재확인" : result.eligibility === "WITHIN_LIMIT" ? "면세 범위 내" : result.eligibility === "OVER_LIMIT" ? "한도 초과 · 신고/세액 확인 필요" : "추가 확인 필요"}</h2>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div><dt>일반 물품 합계</dt><dd className="font-bold">${usdMoney(result.generalUsd)} / $800</dd></div><div><dt>주류</dt><dd className="font-bold">{money(result.alcoholMl)}mL / 2,000mL · ${usdMoney(result.alcoholUsd)} / $400</dd></div><div><dt>향수</dt><dd className="font-bold">{money(result.perfumeMl)}mL / 100mL</dd></div><div><dt>궐련</dt><dd className="font-bold">{money(result.cigarettes)}개비 / 200개비</dd></div></dl>
      <div className="mt-5 border-t border-line pt-4"><p className="text-sm font-semibold">한국 예상세액</p><p className="mt-1 text-xl font-extrabold">{result.taxKrw === 0 ? "입력한 물품 기준 0원" : "정밀 세액 확인 필요"}</p><p className="mt-2 text-sm leading-6 text-ink-muted">초과 물품의 공제 배분·품목별 세율·관세환율을 공식 계산기와 대조하기 전까지 세액을 임의 산출하지 않습니다. 자진신고 시 관세 감면 가능 여부도 공식 계산기에서 확인하세요.</p></div>
      <h3 className="mt-5 font-bold">왜 이런 결과인가요?</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">{result.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
      <a className="mt-5 inline-flex min-h-11 items-center font-bold underline" href="https://www.customs.go.kr/kcs/ad/tax/ItemTaxCalculation.do" target="_blank" rel="noopener noreferrer" onClick={() => track("calculator_cta_click", "official_customs")}>관세청 공식 예상세액 조회 ↗</a>
    </section>}
    {mode === "japan-shopping" && <section className="rounded-lg border border-line bg-white p-4 sm:p-6">
      <h2 className="text-xl font-bold">일본 쇼핑 · 환급과 실제 비용</h2>
      <p className="mt-2 text-sm leading-6 text-ink-muted">2026년 11월 1일부터 일본은 구매 시 소비세 포함가를 결제하고 출국 시 반출 확인 후 환급받는 방식입니다. 세관 확인만으로 수령이 확정되지는 않습니다.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>구매일<input className={fieldClass} type="date" value={japan.purchaseDate} onChange={e => { setJapan({ ...japan, purchaseDate: e.target.value }); setJapanCalculated(false); }} /></label>
        <label className={labelClass}>일본 출국일<input className={fieldClass} type="date" value={japan.departureDate} onChange={e => { setJapan({ ...japan, departureDate: e.target.value }); setJapanCalculated(false); }} /></label>
        <label className={labelClass}>소비세 포함 구매가 (엔)<input className={fieldClass} type="number" min="0" inputMode="numeric" value={japan.taxIncludedYen || ""} onChange={e => { setJapan({ ...japan, taxIncludedYen: Number(e.target.value) }); setJapanCalculated(false); }} /></label>
        <label className={labelClass}>영수증 소비세율<select className={fieldClass} value={japan.taxRate} onChange={e => { setJapan({ ...japan, taxRate: Number(e.target.value) as 8 | 10 }); setJapanCalculated(false); }}><option value="10">10%</option><option value="8">8%</option></select></label>
        <label className={labelClass}>같은 매장·같은 날 세전 합계 (엔)<input className={fieldClass} type="number" min="0" inputMode="numeric" value={japan.sameStoreDayTaxExcludedYen ?? ""} onChange={e => { setJapan({ ...japan, sameStoreDayTaxExcludedYen: num(e.target.value) }); setJapanCalculated(false); }} /></label>
        <label className={labelClass}>실제 환급 수령액 (엔, 받았다면)<input className={fieldClass} type="number" min="0" inputMode="numeric" value={japan.refundReceivedYen ?? ""} onChange={e => { setJapan({ ...japan, refundReceivedYen: num(e.target.value) }); setJapanCalculated(false); }} /></label>
      </div>
      <div className="mt-4 grid gap-2 text-sm">{([ ["eligibleStore", "면세 대상 매장"], ["eligibleTraveler", "면세 대상 여행자"], ["allGoodsExported", "거래기록 물품 전량 반출"], ["customsConfirmed", "출국 시 세관 반출 확인 완료"] ] as const).map(([key, label]) => <label key={key} className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={japan[key]} onChange={e => { setJapan({ ...japan, [key]: e.target.checked }); setJapanCalculated(false); }} />{label}</label>)}</div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>실제 카드 원화 청구액<input className={fieldClass} type="number" min="0" inputMode="numeric" value={cardCharge} onChange={e => setCardCharge(e.target.value)} /></label>
        <label className={labelClass}>국내 판매가 (원, 선택)<input className={fieldClass} type="number" min="0" inputMode="numeric" value={domestic} onChange={e => setDomestic(e.target.value)} /></label>
        <label className={labelClass}>실제 원화 환급 입금액 (받았다면)<input className={fieldClass} type="number" min="0" inputMode="numeric" value={refundKrw} onChange={e => setRefundKrw(e.target.value)} /></label>
      </div>
      <button type="button" disabled={!japan.purchaseDate || !japan.departureDate || japan.taxIncludedYen <= 0} className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50" onClick={() => { setJapanCalculated(true); track("calculator_complete", "japan-shopping"); }}>일본 쇼핑 비용 비교하기</button>
      {(!japan.purchaseDate || !japan.departureDate || japan.taxIncludedYen <= 0) && <p className="mt-2 text-sm text-ink-muted">구매일·일본 출국일·구매가를 입력하면 비교할 수 있습니다.</p>}
      {jp && <div className="mt-6 border-t border-line pt-5" aria-live="polite"><h3 className="text-lg font-bold">{jp.regime === "refund" ? "사후환급 제도 적용 구매일" : "구매 시 면세 제도 적용 구매일"}</h3>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt>현지 카드 실제 지출</dt><dd className="font-bold">{num(cardCharge) !== null ? `${money(num(cardCharge)!)}원` : "입력 필요"}</dd></div><div><dt>소비세 상당액 (수수료 전)</dt><dd className="font-bold">{jp.regime === "refund" && jp.eligibleCandidate ? `${money(jp.taxEquivalentYen)}엔 · 환급 미확정` : "환급 요건 확인 필요"}</dd></div><div><dt>실제 환급 수령</dt><dd className="font-bold">{jp.receivedYen !== null ? `${money(jp.receivedYen)}엔 (입력값)` : "미확인"}</dd></div><div><dt>한국 입국 예상세액</dt><dd className="font-bold">{result?.taxKrw === 0 ? "입력 물품 기준 0원" : "확인 필요"}</dd></div><div><dt>최종 비용 · 실제 수령 기준</dt><dd className="font-bold">{comparison.finalCostKrw !== null ? `${money(comparison.finalCostKrw)}원` : "계산 보류"}</dd></div><div><dt>국내 가격 대비 차액</dt><dd className="font-bold">{comparison.differenceKrw !== null ? `${money(comparison.differenceKrw)}원` : "국내가·한국 세액·실제 환급 확인 후 비교"}</dd></div></dl>
        <p className="mt-4 text-sm leading-6">환급 미수령 가정: {num(cardCharge) !== null && result?.taxKrw === 0 ? `${money(num(cardCharge)!)}원 (입력한 한국 반입 물품 기준)` : "카드 청구액과 한국 세액 확인 후 산정"}. 예상 환급 가능액을 자동으로 차감하지 않습니다.</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-ink-muted">{jp.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
      </div>}
    </section>}
  </div>;
}
