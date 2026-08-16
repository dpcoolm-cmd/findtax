"use client";

import { useMemo, useState } from "react";
import { CalculatorConsultCta } from "@/components/CalculatorConsultCta";
import { CalculatorEstimateNotice } from "@/components/CalculatorEstimateNotice";
import { CalculatorTrustSection } from "@/components/calculators/CalculatorTrustSection";
import { parsePositiveWonString } from "@/lib/calculator-input";
import {
  explainSocialInsuranceLines,
  monthlySocialInsurance,
  SOCIAL_INSURANCE_MONTHLY_CAP_WON,
} from "@/lib/calculators/social-insurance-2026";

function won(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

export function SocialInsuranceCalculator() {
  const [salary, setSalary] = useState("");
  const [role, setRole] = useState<"employee" | "employer">("employee");

  const parsedSalary = useMemo(() => parsePositiveWonString(salary), [salary]);

  const emp = useMemo(() => {
    if (!parsedSalary.ok) return null;
    return monthlySocialInsurance({ monthlySalaryWon: parsedSalary.value, role: "employee" });
  }, [parsedSalary]);

  const biz = useMemo(() => {
    if (!parsedSalary.ok) return null;
    return monthlySocialInsurance({ monthlySalaryWon: parsedSalary.value, role: "employer" });
  }, [parsedSalary]);

  const rows = role === "employee" ? emp : biz;

  const formulaBody = useMemo(() => {
    if (!parsedSalary.ok || !emp || !biz) return null;
    const lines =
      role === "employee"
        ? explainSocialInsuranceLines({ monthlySalaryWon: parsedSalary.value, role: "employee" })
        : explainSocialInsuranceLines({ monthlySalaryWon: parsedSalary.value, role: "employer" });
    return <pre className="whitespace-pre-wrap font-sans text-sm">{lines.join("\n")}</pre>;
  }, [parsedSalary, emp, biz, role]);

  const summary =
    parsedSalary.ok && rows
      ? `월 급여 ${won(parsedSalary.value)}, ${role === "employee" ? "근로자" : "사업주"} 4대보험 참고 합계 ${won(rows.total)}`
      : null;

  return (
    <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
      <label className="block text-sm font-medium text-neutral-800">
        월 급여 (원, 세전)
        <input
          inputMode="numeric"
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          placeholder="예: 3000000"
        />
      </label>
      <p className="mt-1.5 text-xs text-neutral-500">4대보험 공제 전 세전 월 급여를 입력하세요.</p>
      {!parsedSalary.ok && salary.trim() !== "" ? (
        <p className="mt-2 text-sm text-red-600">{parsedSalary.error}</p>
      ) : null}

      <fieldset className="mt-4 space-y-2">
        <legend className="text-sm font-medium text-neutral-800">부담 주체</legend>
        <div className="flex flex-wrap gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm">
            <input
              type="radio"
              name="role"
              checked={role === "employee"}
              onChange={() => setRole("employee")}
            />
            근로자 부담
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm">
            <input
              type="radio"
              name="role"
              checked={role === "employer"}
              onChange={() => setRole("employer")}
            />
            사업주 부담
          </label>
        </div>
      </fieldset>

      <p className="mt-3 text-xs text-neutral-500">
        2026년 7월 기준 참고 요율: 국민연금 근로자·사업주 각 4.75%, 건강 각 3.595%,
        장기요양(건강보험료의 13.14%), 고용 각 0.9%. 국민연금 기준소득월액에만 상한{" "}
        {SOCIAL_INSURANCE_MONTHLY_CAP_WON.toLocaleString("ko-KR")}원을 적용합니다.
      </p>

      {parsedSalary.ok && emp && biz && rows ? (
        <>
          <CalculatorTrustSection
            show
            headlineLabel="예상 월 보험료 합계:"
            amountWon={rows.total}
            basisLines={[
              `국민연금 기준소득월액: ${won(rows.contributionBaseWon)}${rows.salaryCapped ? " — 월 659만 원 상한 적용" : ""}`,
              `건강·고용보험 보수월액: ${won(parsedSalary.value)}`,
              `선택: ${role === "employee" ? "근로자" : "사업주"} 부담분 합계`,
            ]}
            formulaModalBody={formulaBody}
          />
          <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-3 py-2">항목</th>
                  <th className="px-3 py-2">근로자</th>
                  <th className="px-3 py-2">사업주</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                <tr>
                  <td className="px-3 py-2">국민연금</td>
                  <td className="px-3 py-2 font-medium">{won(emp.nationalPension)}</td>
                  <td className="px-3 py-2 font-medium">{won(biz.nationalPension)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">건강보험</td>
                  <td className="px-3 py-2 font-medium">{won(emp.health)}</td>
                  <td className="px-3 py-2 font-medium">{won(biz.health)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">장기요양</td>
                  <td className="px-3 py-2 font-medium">{won(emp.longTermCare)}</td>
                  <td className="px-3 py-2 font-medium">{won(biz.longTermCare)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">고용보험</td>
                  <td className="px-3 py-2 font-medium">{won(emp.employment)}</td>
                  <td className="px-3 py-2 font-medium">{won(biz.employment)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">산재보험</td>
                  <td className="px-3 py-2 text-neutral-400">—</td>
                  <td className="px-3 py-2 font-medium">{won(biz.industrialAccident)}</td>
                </tr>
                <tr className="bg-brand-light/60 font-semibold">
                  <td className="px-3 py-2">합계</td>
                  <td className="px-3 py-2 text-brand">{won(emp.total)}</td>
                  <td className="px-3 py-2 text-brand">{won(biz.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <CalculatorEstimateNotice>
            <p>
              산재보험료율과 사업주 고용안정·직업능력개발 부담은 업종·사업장 규모에 따라
              달라집니다. 실제 고지액은 각 공단 산정 결과를 확인하세요.
            </p>
          </CalculatorEstimateNotice>
        </>
      ) : (
        <p className="mt-4 text-sm text-neutral-600">월 급여를 입력하세요.</p>
      )}

      <CalculatorConsultCta
        calculatorLabel="4대보험"
        defaultSituation="income_tax"
        resultSummary={summary}
        disabled={!parsedSalary.ok}
      />
    </div>
  );
}
