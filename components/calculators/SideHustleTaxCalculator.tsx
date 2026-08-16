"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, ReceiptText } from "lucide-react";
import { CalculatorConsultCta } from "@/components/CalculatorConsultCta";
import { CalculatorEstimateNotice } from "@/components/CalculatorEstimateNotice";
import { CalculatorTrustSection } from "@/components/calculators/CalculatorTrustSection";
import {
  parseNonNegativeWonString,
  parsePositiveWonString,
} from "@/lib/calculator-input";
import {
  calculateSideHustleTaxDiagnosis,
  type SideHustleBusinessStatus,
  type SideHustleEmploymentType,
  type SideHustleVatStatus,
  type SideHustleWithholdingType,
} from "@/lib/calculators/side-hustle-tax";
import { calculatorPath } from "@/lib/seo/urls";

function won(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

function parseOptionalWon(raw: string) {
  const parsed = parseNonNegativeWonString(raw);
  return parsed.ok ? parsed.value : 0;
}

const riskCopy = {
  low: {
    label: "낮음",
    title: "아직은 자료 정리부터 시작해도 괜찮은 구간입니다.",
    className: "bg-brand-accent text-ink",
  },
  mid: {
    label: "주의",
    title: "신고 방식과 비용처리를 미리 확인해야 하는 구간입니다.",
    className: "bg-[#fff3c4] text-[#5f4200]",
  },
  high: {
    label: "높음",
    title: "세무사 검토를 권장하는 구간입니다.",
    className: "bg-[#ffe0e0] text-[#7a1f1f]",
  },
} as const;

export function SideHustleTaxCalculator() {
  const [employmentType, setEmploymentType] = useState<SideHustleEmploymentType>("employee");
  const [annualSalary, setAnnualSalary] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [annualExtraRevenue, setAnnualExtraRevenue] = useState("");
  const [annualExpense, setAnnualExpense] = useState("");
  const [withholdingType, setWithholdingType] = useState<SideHustleWithholdingType>("mixed");
  const [businessStatus, setBusinessStatus] = useState<SideHustleBusinessStatus>("unsure");
  const [vatStatus, setVatStatus] = useState<SideHustleVatStatus>("unsure");

  const parsedMonthly = useMemo(() => {
    const parsed = parsePositiveWonString(monthlyRevenue);
    if (!parsed.ok) return { error: monthlyRevenue.trim() ? parsed.error : null, value: null };
    return { error: null, value: parsed.value };
  }, [monthlyRevenue]);

  const result = useMemo(() => {
    if (parsedMonthly.value == null) return null;
    return calculateSideHustleTaxDiagnosis({
      employmentType,
      annualSalaryWon: parseOptionalWon(annualSalary),
      monthlySideRevenueWon: parsedMonthly.value,
      annualExtraRevenueWon: parseOptionalWon(annualExtraRevenue),
      annualExpenseWon: parseOptionalWon(annualExpense),
      withholdingType,
      businessStatus,
      vatStatus,
    });
  }, [
    annualExpense,
    annualExtraRevenue,
    annualSalary,
    businessStatus,
    employmentType,
    parsedMonthly.value,
    vatStatus,
    withholdingType,
  ]);

  const summary = result
    ? `연 부업 수입 ${won(result.annualRevenueWon)}, 예상 부업 이익 ${won(result.annualProfitWon)}, 부업 소득 단독 산출세액 참고치 ${won(result.sideOnlyIncomeTaxWon)}, 신고 위험도 ${riskCopy[result.riskLevel].label}`
    : null;

  const ctaBand = result?.riskLevel === "high" ? "high" : result?.riskLevel === "mid" ? "mid" : "low";

  const formulaBody = result ? (
    <pre className="whitespace-pre-wrap font-sans text-sm">
      {[
        `연 부업 수입 = 월 부업 수입 × 12 + 비정기 수입`,
        `             = ${won(result.annualRevenueWon)}`,
        `부업 이익 = 연 부업 수입 − 연 비용`,
        `          = ${won(result.annualProfitWon)}`,
        `원천징수 추정 = 수입 × 3.3% 또는 혼합 기준 1.65%`,
        `             = ${won(result.estimatedWithholdingWon)}`,
        `단독 산출세액 참고치 = 부업 이익에 종합소득세율표 간이 적용`,
        `                  = ${won(result.sideOnlyIncomeTaxWon)}`,
      ].join("\n")}
    </pre>
  ) : null;

  return (
    <div className="rounded-3xl bg-white p-5 shadow-md sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)]">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-bold text-brand-dark">N잡·부업 세금 진단</p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-ink">
              부업 수익이 생겼다면, 신고 위험도부터 확인하세요.
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              정확한 신고서 계산이 아니라, 종합소득세·부가세·사업자등록 검토가 필요한 상태인지
              먼저 판단하는 간이 진단입니다.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-ink">
              현재 상태
              <select
                className="mt-2 w-full rounded-2xl border border-line px-3 py-3"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as SideHustleEmploymentType)}
              >
                <option value="employee">직장인 + 부업</option>
                <option value="self_employed">사업자/프리랜서 중심</option>
                <option value="none">현재 근로소득 없음</option>
              </select>
            </label>

            <label className="block text-sm font-semibold text-ink">
              연봉 또는 근로소득 (선택)
              <input
                inputMode="numeric"
                className="mt-2 w-full rounded-2xl border border-line px-3 py-3"
                value={annualSalary}
                onChange={(e) => setAnnualSalary(e.target.value)}
                placeholder="예: 42000000"
              />
            </label>

            <label className="block text-sm font-semibold text-ink">
              월평균 부업 수입
              <input
                inputMode="numeric"
                className="mt-2 w-full rounded-2xl border border-line px-3 py-3"
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(e.target.value)}
                placeholder="예: 800000"
              />
              {parsedMonthly.error ? <span className="mt-1 block text-xs text-red-600">{parsedMonthly.error}</span> : null}
            </label>

            <label className="block text-sm font-semibold text-ink">
              비정기 부업 수입 (연간)
              <input
                inputMode="numeric"
                className="mt-2 w-full rounded-2xl border border-line px-3 py-3"
                value={annualExtraRevenue}
                onChange={(e) => setAnnualExtraRevenue(e.target.value)}
                placeholder="강의·전자책·광고비 등"
              />
            </label>

            <label className="block text-sm font-semibold text-ink">
              연간 비용
              <input
                inputMode="numeric"
                className="mt-2 w-full rounded-2xl border border-line px-3 py-3"
                value={annualExpense}
                onChange={(e) => setAnnualExpense(e.target.value)}
                placeholder="장비·구독료·광고비 등"
              />
            </label>

            <label className="block text-sm font-semibold text-ink">
              3.3% 원천징수 여부
              <select
                className="mt-2 w-full rounded-2xl border border-line px-3 py-3"
                value={withholdingType}
                onChange={(e) => setWithholdingType(e.target.value as SideHustleWithholdingType)}
              >
                <option value="mixed">일부는 떼고 일부는 안 뗌</option>
                <option value="yes">대부분 3.3% 원천징수</option>
                <option value="no">거의 원천징수 없음</option>
              </select>
            </label>

            <label className="block text-sm font-semibold text-ink">
              사업자등록 상태
              <select
                className="mt-2 w-full rounded-2xl border border-line px-3 py-3"
                value={businessStatus}
                onChange={(e) => setBusinessStatus(e.target.value as SideHustleBusinessStatus)}
              >
                <option value="unsure">잘 모르겠음</option>
                <option value="registered">등록되어 있음</option>
                <option value="not_registered">아직 없음</option>
              </select>
            </label>

            <label className="block text-sm font-semibold text-ink">
              부가세 관련 매출
              <select
                className="mt-2 w-full rounded-2xl border border-line px-3 py-3"
                value={vatStatus}
                onChange={(e) => setVatStatus(e.target.value as SideHustleVatStatus)}
              >
                <option value="unsure">잘 모르겠음</option>
                <option value="taxable_sales">스마트스토어·쿠팡 등 과세 매출 있음</option>
                <option value="mostly_exempt_or_foreign">대부분 면세/해외 플랫폼 수익</option>
              </select>
            </label>
          </div>
        </div>

        <div className="rounded-3xl bg-bg-muted p-5">
          <p className="text-sm font-bold text-ink">결과 요약</p>
          {result ? (
            <div className="mt-4 space-y-4">
              <div className={`rounded-2xl p-4 ${riskCopy[result.riskLevel].className}`}>
                <div className="flex items-center gap-2 text-sm font-black">
                  <AlertTriangle size={18} />
                  신고 위험도 {riskCopy[result.riskLevel].label}
                </div>
                <p className="mt-2 text-sm font-semibold leading-6">{riskCopy[result.riskLevel].title}</p>
              </div>

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">연 부업 수입</dt>
                  <dd className="font-bold text-ink">{won(result.annualRevenueWon)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">예상 부업 이익</dt>
                  <dd className="font-bold text-ink">{won(result.annualProfitWon)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">원천징수 추정</dt>
                  <dd className="font-bold text-ink">{won(result.estimatedWithholdingWon)}</dd>
                </div>
              </dl>

              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm font-bold text-ink">다음으로 볼 계산기</p>
                <div className="mt-3 grid gap-2">
                  <Link href={calculatorPath("종합소득세")} className="flex items-center justify-between rounded-2xl bg-bg-muted px-4 py-3 text-sm font-bold text-ink">
                    종합소득세 계산기 <ArrowRight size={16} />
                  </Link>
                  <Link href={calculatorPath("부가세")} className="flex items-center justify-between rounded-2xl bg-bg-muted px-4 py-3 text-sm font-bold text-ink">
                    부가세 계산기 <ArrowRight size={16} />
                  </Link>
                  <Link href="/calculator/jangbu" className="flex items-center justify-between rounded-2xl bg-bg-muted px-4 py-3 text-sm font-bold text-ink">
                    기장료 계산기 <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl bg-white p-5 text-sm leading-6 text-ink-muted">
              월평균 부업 수입을 입력하면 신고 위험도와 다음 행동을 보여드립니다.
            </div>
          )}
        </div>
      </div>

      {result ? (
        <div className="mt-7 space-y-6">
          <CalculatorTrustSection
            show
            headlineLabel="부업 소득 단독 산출세액 참고치:"
            amountWon={result.sideOnlyIncomeTaxWon}
            basisLines={[
              `부업 이익 ${won(result.annualProfitWon)} 기준 간이 산출`,
              `원천징수 추정액 ${won(result.estimatedWithholdingWon)}`,
              `단독 기준 추가 납부 참고치 ${won(result.standaloneSettlementWon)}`,
            ]}
            formulaModalTitle="N잡·부업 진단 계산 근거"
            formulaModalBody={formulaBody}
            extraDisclaimer="직장인의 경우 근로소득과 합산되어 실제 세율 구간이 달라질 수 있습니다. 이 결과는 신고 준비 상태를 판단하기 위한 참고치입니다."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-line p-5">
              <div className="flex items-center gap-2 text-sm font-black text-ink">
                <ReceiptText size={18} />
                왜 주의가 필요한가요?
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-ink-muted">
                {result.riskReasons.map((reason) => (
                  <li key={reason} className="flex gap-2">
                    <AlertTriangle size={16} className="mt-1 shrink-0 text-[#b86700]" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-line p-5">
              <div className="flex items-center gap-2 text-sm font-black text-ink">
                <CheckCircle2 size={18} />
                지금 할 일
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-ink-muted">
                {result.nextActions.map((action) => (
                  <li key={action} className="flex gap-2">
                    <CheckCircle2 size={16} className="mt-1 shrink-0 text-brand-dark" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <CalculatorEstimateNotice>
            <p>
              부업 소득은 업종, 원천징수 여부, 사업자등록, 비용 인정, 부가세 대상 여부에 따라
              결과가 달라집니다. 이 계산기는 신고 준비 상태를 판단하기 위한 참고용입니다.
            </p>
          </CalculatorEstimateNotice>

          <CalculatorConsultCta
            calculatorLabel="N잡·부업 세금"
            defaultSituation="income_tax"
            resultSummary={summary}
            disabled={!result}
            calculatorSlug="side_hustle"
            resultBand={ctaBand}
            estimatedTaxWon={result.sideOnlyIncomeTaxWon}
            titleOverride={riskCopy[result.riskLevel].title}
            subtitleOverride="부업 수익 구조와 비용처리 방식은 사람마다 달라서, 신고 전에 한 번 정리해두면 좋습니다."
            buttonLabelOverride="부업 세금 상담 받기"
          />
        </div>
      ) : null}
    </div>
  );
}
