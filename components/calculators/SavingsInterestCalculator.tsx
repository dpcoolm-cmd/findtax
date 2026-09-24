"use client";

import { useMemo, useState } from "react";
import {
  calculateSavingsInterest,
  type InterestTaxType,
  type SavingsProductType,
  validateSavingsInterestInput,
} from "@/lib/calculators/savings-interest";

const won = (value: number) => `${value.toLocaleString("ko-KR")}원`;

export function SavingsInterestCalculator() {
  const [productType, setProductType] = useState<SavingsProductType>("deposit");
  const [amount, setAmount] = useState("10000000");
  const [annualRate, setAnnualRate] = useState("3");
  const [months, setMonths] = useState("12");
  const [taxType, setTaxType] = useState<InterestTaxType>("taxable");

  const parsed = useMemo(() => ({
    amount: Number(amount.replaceAll(",", "")),
    annualRatePercent: Number(annualRate),
    months: Number(months),
  }), [amount, annualRate, months]);
  const input = {
    productType,
    principalWon: productType === "deposit" ? parsed.amount : 0,
    monthlyPaymentWon: productType === "installment" ? parsed.amount : 0,
    annualRatePercent: parsed.annualRatePercent,
    months: parsed.months,
    taxType,
  };
  const error = validateSavingsInterestInput(input);
  const result = error ? null : calculateSavingsInterest(input);

  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-6">
      <fieldset>
        <legend className="text-sm font-bold text-ink">계산할 상품</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {([ ["deposit", "정기예금 · 목돈"], ["installment", "정기적금 · 월 납입"] ] as const).map(([value, label]) => (
            <label key={value} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${productType === value ? "border-primary bg-primary/5 font-bold" : "border-line"}`}>
              <input type="radio" name="savings-product-type" value={value} checked={productType === value} onChange={() => setProductType(value)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-ink">
          {productType === "deposit" ? "예치할 금액 (원)" : "매월 납입할 금액 (원)"}
          <input inputMode="numeric" type="number" min="1" max="10000000000" value={amount} onChange={event => setAmount(event.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2.5" />
        </label>
        <label className="block text-sm font-medium text-ink">
          연이율 (%)
          <input inputMode="decimal" type="number" min="0" max="30" step="0.01" value={annualRate} onChange={event => setAnnualRate(event.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2.5" />
        </label>
        <label className="block text-sm font-medium text-ink">
          가입 기간 (개월)
          <input inputMode="numeric" type="number" min="1" max="1200" value={months} onChange={event => setMonths(event.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2.5" />
        </label>
        <label className="block text-sm font-medium text-ink">
          과세 유형
          <select value={taxType} onChange={event => setTaxType(event.target.value as InterestTaxType)} className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5">
            <option value="taxable">일반과세 (이자소득세 14% + 지방소득세)</option>
            <option value="tax-exempt">비과세 가정 (자격·한도 확인 필요)</option>
          </select>
        </label>
      </div>

      {error ? <p role="alert" className="mt-4 text-sm font-medium text-red-700">{error}</p> : null}
      {result ? (
        <section aria-live="polite" aria-label="예상 만기 결과" className="mt-6 rounded-xl bg-primary p-5 text-white sm:p-6">
          <p className="text-sm font-semibold text-white/75">예상 세후 만기 수령액</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">{won(result.maturityAmountWon)}</p>
          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
            <div><dt className="text-white/65">납입 원금</dt><dd className="mt-1 font-bold">{won(result.paidPrincipalWon)}</dd></div>
            <div><dt className="text-white/65">세전 이자</dt><dd className="mt-1 font-bold">{won(result.grossInterestWon)}</dd></div>
            <div><dt className="text-white/65">예상 세금</dt><dd className="mt-1 font-bold">{won(result.withholdingTaxWon)}</dd></div>
            <div><dt className="text-white/65">세후 이자</dt><dd className="mt-1 font-bold">{won(result.netInterestWon)}</dd></div>
          </dl>
        </section>
      ) : null}

      <p className="mt-4 text-xs leading-6 text-ink-muted">
        단순 계산 예시입니다. 적금은 매월 초 납입하고 납입액마다 1개월부터 가입 개월 수까지 단리로 계산합니다. 일반과세는 이자소득세 14%와 그 세액의 10%인 지방소득세를 합산한 15.4%를 적용합니다. 은행별 일수 계산·세금 원단위 처리·우대금리·비과세 요건과 한도는 반영하지 않습니다.
      </p>
    </div>
  );
}
