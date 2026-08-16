"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { CalculatorConsultCta } from "@/components/CalculatorConsultCta";
import { CalculatorEstimateNotice } from "@/components/CalculatorEstimateNotice";
import { PensionTaxCaseStart } from "@/components/PensionTaxCaseStart";
import {
  formatGroupedNumericInput,
  formatKoreanMoneyFromManwonInput,
  parsePositiveManwonString,
} from "@/lib/calculator-input";
import {
  calculateYearEndTaxOptimization,
  type PensionTaxpayerType,
  type YearEndTaxOptimizationInput,
} from "@/lib/calculators/year-end-tax-optimization";
import { trackSiteEvent } from "@/lib/site-track";

function won(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function MoneyField({
  label,
  value,
  onChange,
  help,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
}) {
  const hint = formatKoreanMoneyFromManwonInput(value);
  return (
    <label className="block text-sm font-bold text-ink">
      {label}
      <div className="mt-2 flex min-h-12 items-center rounded-lg border border-line bg-white px-3 focus-within:border-[#6A442D]">
        <input
          inputMode="numeric"
          value={value}
          onChange={(event) =>
            onChange(formatGroupedNumericInput(event.target.value))
          }
          placeholder="0"
          className="min-w-0 flex-1 bg-transparent outline-none"
        />
        <span className="ml-2 text-sm text-ink-muted">만원</span>
      </div>
      {hint ? <span className="mt-1 block text-xs text-ink-muted">{hint}</span> : null}
      {help ? <span className="mt-1 block text-xs font-normal leading-5 text-ink-muted">{help}</span> : null}
    </label>
  );
}

function parseMoney(value: string) {
  if (!value.trim()) return { ok: true as const, value: 0 };
  return parsePositiveManwonString(value);
}

const TYPE_OPTIONS: Array<{
  value: PensionTaxpayerType;
  label: string;
  description: string;
}> = [
  { value: "employee", label: "직장인", description: "근로소득만 있어요" },
  { value: "business", label: "사업자", description: "사업·프리랜서 소득이에요" },
  { value: "mixed", label: "직장+부업", description: "근로·사업소득이 함께 있어요" },
];

export function YearEndTaxOptimizationCalculator() {
  const [taxpayerType, setTaxpayerType] =
    useState<PensionTaxpayerType>("employee");
  const [annualSalary, setAnnualSalary] = useState("");
  const [comprehensiveIncome, setComprehensiveIncome] = useState("");
  const [pensionPaid, setPensionPaid] = useState("");
  const [irpPaid, setIrpPaid] = useState("");
  const [isaTransfer, setIsaTransfer] = useState("");
  const [extraBudget, setExtraBudget] = useState("");
  const [emergencyMonths, setEmergencyMonths] = useState("6");
  const [needsMoney, setNeedsMoney] = useState(false);
  const [checkedStatements, setCheckedStatements] = useState(false);
  const [hasIncomeStatement, setHasIncomeStatement] = useState(false);
  const lastTrackedKey = useRef<string | null>(null);

  const calculated = useMemo(() => {
    const salary = parseMoney(annualSalary);
    const income = parseMoney(comprehensiveIncome);
    const pension = parseMoney(pensionPaid);
    const irp = parseMoney(irpPaid);
    const isa = parseMoney(isaTransfer);
    const budget = parseMoney(extraBudget);
    if (!salary.ok) return { error: salary.error, input: null, data: null };
    if (!income.ok) return { error: income.error, input: null, data: null };
    if (!pension.ok) return { error: pension.error, input: null, data: null };
    if (!irp.ok) return { error: irp.error, input: null, data: null };
    if (!isa.ok) return { error: isa.error, input: null, data: null };
    if (!budget.ok) return { error: budget.error, input: null, data: null };

    const requiredIncome =
      taxpayerType === "employee" ? salary.value : income.value;
    if (requiredIncome <= 0) {
      return {
        error:
          taxpayerType === "employee"
            ? "총급여를 입력해 주세요."
            : "종합소득금액을 입력해 주세요.",
        input: null,
        data: null,
      };
    }

    const input: YearEndTaxOptimizationInput = {
      taxpayerType,
      annualSalaryWon: salary.value,
      comprehensiveIncomeWon: income.value,
      pensionSavingsPaidWon: pension.value,
      irpPaidWon: irp.value,
      isaMaturityTransferWon: isa.value,
      extraBudgetWon: budget.value,
      emergencyFundMonths: Number(emergencyMonths) || 0,
      needsMoneyWithinYear: needsMoney,
      hasCheckedContributionStatements: checkedStatements,
      hasIncomeStatement,
    };
    return { error: null, input, data: calculateYearEndTaxOptimization(input) };
  }, [
    annualSalary,
    checkedStatements,
    comprehensiveIncome,
    emergencyMonths,
    extraBudget,
    hasIncomeStatement,
    irpPaid,
    isaTransfer,
    needsMoney,
    pensionPaid,
    taxpayerType,
  ]);

  useEffect(() => {
    if (!calculated.data) return;
    const key = [
      calculated.data.taxpayerType,
      calculated.data.strategy,
      calculated.data.currentCombinedEligibleWon,
      calculated.data.additionalEstimatedTaxBenefitWon,
    ].join("|");
    if (lastTrackedKey.current === key) return;
    lastTrackedKey.current = key;
    trackSiteEvent("calculator_result_view", {
      calculator_type: "year_end_tax_optimization",
      taxpayer_type: calculated.data.taxpayerType,
      strategy: calculated.data.strategy,
      cash_flow_status: calculated.data.cashFlowStatus,
      additional_tax_benefit_won:
        calculated.data.additionalEstimatedTaxBenefitWon,
    });
  }, [calculated.data]);

  const data = calculated.data;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-line bg-white">
        <div className="border-b border-line p-5 sm:p-6">
          <p className="text-sm font-bold text-[#6A442D]">연금 절세 의사결정</p>
          <h2 className="mt-2 text-2xl font-black text-ink">
            얼마를 넣을지보다, 지금 넣어도 되는지부터 봅니다.
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            소득유형과 현금 여력을 반영해 연금저축·IRP·ISA 순서를 정해드려요.
          </p>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-sm font-black text-ink">1. 소득 유형</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {TYPE_OPTIONS.map((option) => {
              const selected = taxpayerType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTaxpayerType(option.value)}
                  className={`min-h-20 rounded-lg border p-3 text-left ${
                    selected
                      ? "border-[#6A442D] bg-[#F5F1EA]"
                      : "border-line hover:border-line-strong"
                  }`}
                >
                  <span className="flex items-center gap-2 font-black text-ink">
                    {selected ? <Check size={16} /> : null}
                    {option.label}
                  </span>
                  <span className="mt-1 block text-xs text-ink-muted">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {taxpayerType !== "business" ? (
              <MoneyField
                label="연간 총급여"
                value={annualSalary}
                onChange={setAnnualSalary}
              />
            ) : null}
            {taxpayerType !== "employee" ? (
              <MoneyField
                label="종합소득금액"
                value={comprehensiveIncome}
                onChange={setComprehensiveIncome}
                help="매출이 아니라 필요경비 등을 뺀 소득금액 기준이에요."
              />
            ) : null}
          </div>

          <p className="mt-8 text-sm font-black text-ink">2. 올해 납입과 추가 여력</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <MoneyField label="연금저축 납입액" value={pensionPaid} onChange={setPensionPaid} />
            <MoneyField label="IRP 납입액" value={irpPaid} onChange={setIrpPaid} />
            <MoneyField
              label="ISA 만기자금 연금 전환액"
              value={isaTransfer}
              onChange={setIsaTransfer}
              help="아직 전환하지 않았다면 0으로 두세요."
            />
            <MoneyField
              label="올해 추가 납입 가능액"
              value={extraBudget}
              onChange={setExtraBudget}
            />
          </div>

          <p className="mt-8 text-sm font-black text-ink">3. 현금흐름 안전 점검</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold text-ink">
              확보한 비상생활비
              <select
                value={emergencyMonths}
                onChange={(event) => setEmergencyMonths(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-lg border border-line bg-white px-3"
              >
                <option value="0">없음</option>
                <option value="1">1개월</option>
                <option value="3">3개월</option>
                <option value="6">6개월 이상</option>
              </select>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-4">
              <input
                type="checkbox"
                checked={needsMoney}
                onChange={(event) => setNeedsMoney(event.target.checked)}
                className="mt-1 h-4 w-4 accent-[#6A442D]"
              />
              <span>
                <strong className="block text-sm text-ink">1년 안에 쓸 예정인 돈이에요</strong>
                <span className="mt-1 block text-xs leading-5 text-ink-muted">
                  보증금·사업자금·생활비처럼 곧 필요한 돈을 포함합니다.
                </span>
              </span>
            </label>
          </div>

          <details className="mt-5 border-y border-line py-4">
            <summary className="cursor-pointer font-bold text-ink">
              자료 준비 여부 확인
            </summary>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                [hasIncomeStatement, setHasIncomeStatement, "총급여·종합소득금액을 자료로 확인했어요"],
                [checkedStatements, setCheckedStatements, "금융회사 납입확인서를 확인했어요"],
              ].map(([checked, setter, label]) => (
                <label key={String(label)} className="flex items-start gap-3 rounded-lg bg-surface-muted p-3 text-sm font-bold text-ink">
                  <input
                    type="checkbox"
                    checked={checked as boolean}
                    onChange={(event) =>
                      (setter as (value: boolean) => void)(event.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 accent-[#6A442D]"
                  />
                  {String(label)}
                </label>
              ))}
            </div>
          </details>
        </div>
      </section>

      {!data ? (
        <p className="rounded-lg border border-line bg-white p-5 text-sm text-ink-muted">
          {calculated.error ?? "소득 정보를 입력하면 결과가 나옵니다."}
        </p>
      ) : (
        <>
          <section className="overflow-hidden rounded-lg bg-primary text-white">
            <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.8fr)]">
              <div>
                <p className="text-sm font-semibold text-white/60">FindTax 판단</p>
                <h3 className="mt-3 text-2xl font-black leading-snug text-white sm:text-3xl">
                  {data.oneLineRecommendation}
                </h3>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
                    {data.incomeBasisLabel} 기준 {data.nationalTaxCreditRatePct}%
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
                    현금흐름 {data.cashFlowStatus === "ready" ? "양호" : data.cashFlowStatus === "caution" ? "주의" : "우선 확보"}
                  </span>
                </div>
              </div>
              <div className="border-t border-white/15 pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                <p className="text-sm text-white/60">추가 예상 세금 감소효과</p>
                <p className="mt-2 text-4xl font-black text-white">
                  {won(data.additionalEstimatedTaxBenefitWon)}
                </p>
                <p className="mt-3 text-xs leading-5 text-white/60">
                  지방소득세 영향을 포함한 {data.estimatedEffectiveRatePct}% 단순 추정치
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            {[
              ["현재 공제대상 납입액", won(data.currentCombinedEligibleWon)],
              ["현재 예상 세금효과", won(data.currentEstimatedTaxBenefitWon)],
              ["공제 한도까지 남은 금액", won(data.yearlyContributionGapWon)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-line bg-white p-4">
                <p className="text-xs font-bold text-ink-muted">{label}</p>
                <p className="mt-2 text-xl font-black text-ink">{value}</p>
              </div>
            ))}
          </section>

          {data.steps.length > 0 ? (
            <section className="rounded-lg border border-line bg-white p-5 sm:p-6">
              <p className="text-sm font-bold text-[#6A442D]">실행 순서</p>
              <div className="mt-3 divide-y divide-line">
                {data.steps.map((step, index) => (
                  <div key={step.id} className="flex gap-4 py-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6A442D] text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-black text-ink">{step.title}</p>
                      <p className="mt-1 text-sm leading-6 text-ink-muted">{step.description}</p>
                      {step.recommendedContributionWon > 0 ? (
                        <p className="mt-2 text-sm font-bold text-[#296B2F]">
                          {won(step.recommendedContributionWon)} 배분
                          <ArrowRight className="mx-1 inline" size={14} />
                          약 {won(step.estimatedTaxReductionWon)} 효과
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {data.warnings.length > 0 ? (
            <section className="rounded-lg border border-[#E6D6B8] bg-[#FFF9ED] p-5">
              <p className="flex items-center gap-2 font-black text-ink">
                <AlertTriangle size={18} className="text-[#A55D16]" />
                먼저 확인하세요
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-ink-muted">
                {data.warnings.map((warning) => <li key={warning}>· {warning}</li>)}
              </ul>
            </section>
          ) : null}

          {calculated.input ? (
            <PensionTaxCaseStart input={calculated.input} result={data} />
          ) : null}

          <CalculatorEstimateNotice badge="계산 기준과 한계">
            {data.assumptions.map((assumption) => (
              <p key={assumption}>· {assumption}</p>
            ))}
          </CalculatorEstimateNotice>
          <div className="flex items-start gap-2 text-xs leading-5 text-ink-soft">
            <ShieldCheck size={16} className="mt-0.5 shrink-0" />
            실제 환급액은 결정세액을 넘을 수 없으며, 금융회사별 연말 납입 마감시간을 확인해야 합니다.
          </div>
          <CalculatorConsultCta
            calculatorLabel="연금·IRP 절세 시뮬레이터"
            calculatorSlug="year_end_tax_optimization"
            titleOverride="근로·사업소득이 함께 있거나 실제 결정세액이 궁금한가요?"
            subtitleOverride="소득자료와 납입확인서를 준비하면 전문가가 공제 가능액을 더 정확히 확인할 수 있어요."
          />
        </>
      )}
    </div>
  );
}
