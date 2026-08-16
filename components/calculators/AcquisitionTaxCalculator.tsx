"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalculatorEstimateNotice } from "@/components/CalculatorEstimateNotice";
import { CalculatorTrustSection } from "@/components/calculators/CalculatorTrustSection";
import { HomeAtozCta } from "@/components/HomeAtozCta";
import {
  formatGroupedNumericInput,
  formatKoreanMoneyFromManwonInput,
  parsePositiveManwonString,
} from "@/lib/calculator-input";
import {
  calculateAcquisitionTax,
  explainAcquisitionTaxLines,
  type AcquisitionHomeType,
  type AcquisitionZone,
} from "@/lib/calculators/acquisition-tax";

function won(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

function formatMoneyInput(raw: string): string {
  return formatGroupedNumericInput(raw);
}

export function AcquisitionTaxCalculator() {
  const [price, setPrice] = useState("");
  const [homeType, setHomeType] = useState<AcquisitionHomeType>("one");
  const [zone, setZone] = useState<AcquisitionZone>("normal");

  const result = useMemo(() => {
    const p = parsePositiveManwonString(price);
    if (!p.ok) return { err: price.trim() ? p.error : null, data: null, input: null };
    const input = {
      priceWon: p.value,
      homeType,
      zone: homeType === "two" ? zone : ("normal" as AcquisitionZone),
    };
    return { err: null as string | null, data: calculateAcquisitionTax(input), input };
  }, [price, homeType, zone]);

  const ratePct = result.data ? (result.data.rate * 100).toFixed(2).replace(/\.?0+$/, "") : "";

  const formulaBody = useMemo(() => {
    if (!result.data || !result.input) return null;
    return (
      <pre className="whitespace-pre-wrap font-sans text-sm">
        {explainAcquisitionTaxLines(result.input).join("\n")}
      </pre>
    );
  }, [result.data, result.input]);
  const priceHint = useMemo(() => formatKoreanMoneyFromManwonInput(price), [price]);

  return (
    <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
      <label className="block text-sm font-medium text-neutral-800">
        주택 매매가 (만원)
        <input
          inputMode="numeric"
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5"
          value={price}
          onChange={(e) => setPrice(formatMoneyInput(e.target.value))}
          placeholder="예: 85000"
        />
      </label>
      <p className="mt-2 text-xs text-neutral-500">예: 8억 5천만원이면 85000으로 입력해요.</p>
      {result.err ? <p className="mt-2 text-sm text-red-600">{result.err}</p> : null}

      <fieldset className="mt-4 space-y-2">
        <legend className="text-sm font-medium text-neutral-800">취득 유형</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["one", "1주택"],
              ["two", "2주택"],
              ["three_or_corp", "3주택 이상"],
              ["corp", "법인"],
            ] as const
          ).map(([v, label]) => (
            <label
              key={v}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                homeType === v ? "border-brand ring-2 ring-brand" : "border-neutral-200"
              }`}
            >
              <input
                type="radio"
                name="homeType"
                checked={homeType === v}
                onChange={() => setHomeType(v)}
                className="h-4 w-4"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {homeType === "two" ? (
        <fieldset className="mt-4 space-y-2">
          <legend className="text-sm font-medium text-neutral-800">지역 구분</legend>
          <div className="flex flex-wrap gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm">
              <input
                type="radio"
                name="zone"
                checked={zone === "adjusted"}
                onChange={() => setZone("adjusted")}
              />
              조정대상지역
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm">
              <input
                type="radio"
                name="zone"
                checked={zone === "normal"}
                onChange={() => setZone("normal")}
              />
              비조정지역
            </label>
          </div>
          <p className="text-xs text-neutral-500">
            조정대상지역: 서울 전역, 경기 과천·성남(분당·수정)·하남·광명 등. 국토교통부 공고를 확인하세요.
          </p>
        </fieldset>
      ) : null}

      <p className="mt-3 text-xs text-neutral-500">
        면제·감면·분할취득·공동명의·실거래 신고가 등은 반영하지 않은 참고치입니다.
      </p>

      {result.data && result.input ? (
        <>
          <CalculatorTrustSection
            show
            headlineLabel="예상 세금:"
            amountWon={result.data.acquisitionTax}
            basisLines={[
              `적용 세율(참고) ${ratePct}%`,
              `지방교육세(참고) ${won(result.data.localEducationTax)}`,
            ]}
            formulaModalBody={formulaBody}
          />
          <dl className="mt-4 space-y-2 rounded-xl bg-brand-light p-4 text-sm">
            <div className="flex justify-between">
              <dt>적용 세율 (참고)</dt>
              <dd className="font-semibold text-brand">{ratePct}%</dd>
            </div>
            <div className="flex justify-between">
              <dt>지방교육세 (취득세의 10%)</dt>
              <dd className="font-semibold">{won(result.data.localEducationTax)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>농어촌특별세</dt>
              <dd className="font-semibold">{won(result.data.ruralSpecialTax)}</dd>
            </div>
          </dl>
          <CalculatorEstimateNotice>
            <p>
              농어촌특별세는 대상 여부에 따라 0원인 경우가 많습니다. 실제 세액은 등기·지역
              세무서 기준을 확인하세요.
            </p>
          </CalculatorEstimateNotice>
          <div className="mt-5">
            <HomeAtozCta placement="acquisition_tax_result" />
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-neutral-600">매매가를 입력하세요.</p>
      )}

      <Link
        href="/consult"
        className="mt-6 flex w-full items-center justify-center rounded-xl bg-[#0f3460] py-3 text-sm font-bold text-white hover:bg-[#0a2848]"
      >
        법무사·세무사 무료 상담받기
      </Link>
    </div>
  );
}
