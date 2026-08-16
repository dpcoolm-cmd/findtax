"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarClock, CheckCircle2 } from "lucide-react";
import {
  formatGroupedNumericInput,
  formatKoreanMoneyFromManwonInput,
  parseNonNegativeManwonString,
} from "@/lib/calculator-input";
import {
  assessSoloBusiness,
  type SoloBusinessInput,
} from "@/lib/tax-cases/solo-business-case";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-line px-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[#6A442D]"
      />
      <span className="text-sm font-bold text-ink">{label}</span>
    </label>
  );
}

export function SoloBusinessTaxPlanner() {
  const router = useRouter();
  const [annualRevenue, setAnnualRevenue] = useState("");
  const [businessStatus, setBusinessStatus] =
    useState<SoloBusinessInput["businessStatus"]>("registered");
  const [vatStatus, setVatStatus] =
    useState<SoloBusinessInput["vatStatus"]>("unsure");
  const [incomeSourceCount, setIncomeSourceCount] = useState(1);
  const [monthlyDocumentCount, setMonthlyDocumentCount] = useState(10);
  const [hasEmployees, setHasEmployees] = useState(false);
  const [paysFreelancers, setPaysFreelancers] = useState(false);
  const [hasForeignTransactions, setHasForeignTransactions] = useState(false);
  const [sellsOnMarketplaces, setSellsOnMarketplaces] = useState(false);
  const [hasBookkeeping, setHasBookkeeping] = useState(false);
  const [hasEvidenceRoutine, setHasEvidenceRoutine] = useState(false);
  const [hasTaxCalendar, setHasTaxCalendar] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");

  const parsedRevenue = parseNonNegativeManwonString(annualRevenue);
  const input = useMemo<SoloBusinessInput>(
    () => ({
      businessStatus,
      vatStatus,
      annualRevenueWon: parsedRevenue.ok ? parsedRevenue.value : 0,
      incomeSourceCount,
      monthlyDocumentCount,
      hasEmployees,
      paysFreelancers,
      hasForeignTransactions,
      sellsOnMarketplaces,
      hasBookkeeping,
      hasEvidenceRoutine,
      hasTaxCalendar,
    }),
    [
      businessStatus,
      hasBookkeeping,
      hasEmployees,
      hasEvidenceRoutine,
      hasForeignTransactions,
      hasTaxCalendar,
      incomeSourceCount,
      monthlyDocumentCount,
      parsedRevenue,
      paysFreelancers,
      sellsOnMarketplaces,
      vatStatus,
    ],
  );
  const assessment = useMemo(() => assessSoloBusiness(input), [input]);

  const createCase = async () => {
    if (state === "busy" || !parsedRevenue.ok) return;
    setState("busy");
    try {
      const response = await fetch("/api/tax-cases/solo-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientDedupeKey: crypto.randomUUID(),
          sourcePath: window.location.pathname,
          input,
        }),
      });
      const body = (await response.json()) as { token?: string };
      if (!response.ok || !body.token) {
        setState("error");
        return;
      }
      router.push(`/case/${body.token}`);
    } catch {
      setState("error");
    }
  };

  const recommendation =
    assessment.recommendation === "self"
      ? "직접 관리 가능"
      : assessment.recommendation === "review"
        ? "초기 세팅 검토 권장"
        : "기장·세무대리 권장";

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <section className="p-5 sm:p-7">
          <p className="text-sm font-bold text-[#6A442D]">1인사업자 세무 진단</p>
          <h2 className="mt-2 text-2xl font-black text-ink">
            내 사업에 필요한 신고만 남겨보세요.
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-ink">
              연 매출
              <div className="mt-2 flex min-h-12 items-center rounded-lg border border-line px-3">
                <input
                  inputMode="numeric"
                  value={annualRevenue}
                  onChange={(event) =>
                    setAnnualRevenue(formatGroupedNumericInput(event.target.value))
                  }
                  placeholder="예: 5000"
                  className="min-w-0 flex-1 outline-none"
                />
                <span className="text-sm text-ink-muted">만원</span>
              </div>
              {annualRevenue ? (
                <span className="mt-1 block text-xs font-medium text-ink-muted">
                  {formatKoreanMoneyFromManwonInput(annualRevenue)}
                </span>
              ) : null}
            </label>
            <label className="text-sm font-bold text-ink">
              사업자 상태
              <select
                value={businessStatus}
                onChange={(event) =>
                  setBusinessStatus(
                    event.target.value as SoloBusinessInput["businessStatus"],
                  )
                }
                className="mt-2 min-h-12 w-full rounded-lg border border-line px-3"
              >
                <option value="registered">사업자등록 완료</option>
                <option value="not_registered">미등록</option>
                <option value="unsure">등록 필요 여부 모름</option>
              </select>
            </label>
            <label className="text-sm font-bold text-ink">
              부가세 유형
              <select
                value={vatStatus}
                onChange={(event) =>
                  setVatStatus(event.target.value as SoloBusinessInput["vatStatus"])
                }
                className="mt-2 min-h-12 w-full rounded-lg border border-line px-3"
              >
                <option value="unsure">잘 모르겠어요</option>
                <option value="general">일반과세자</option>
                <option value="simplified">간이과세자</option>
                <option value="exempt">면세사업자</option>
              </select>
            </label>
            <label className="text-sm font-bold text-ink">
              월 증빙·거래 건수
              <input
                type="number"
                min={0}
                max={1000000}
                value={monthlyDocumentCount}
                onChange={(event) =>
                  setMonthlyDocumentCount(
                    Math.max(0, Number(event.target.value) || 0),
                  )
                }
                className="mt-2 min-h-12 w-full rounded-lg border border-line px-3"
              />
            </label>
            <label className="text-sm font-bold text-ink">
              소득원 개수
              <input
                type="number"
                min={1}
                max={20}
                value={incomeSourceCount}
                onChange={(event) =>
                  setIncomeSourceCount(
                    Math.min(20, Math.max(1, Number(event.target.value) || 1)),
                  )
                }
                className="mt-2 min-h-12 w-full rounded-lg border border-line px-3"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Toggle checked={hasEmployees} onChange={setHasEmployees} label="직원이 있어요" />
            <Toggle checked={paysFreelancers} onChange={setPaysFreelancers} label="프리랜서에게 지급해요" />
            <Toggle checked={hasForeignTransactions} onChange={setHasForeignTransactions} label="해외 매출·매입이 있어요" />
            <Toggle checked={sellsOnMarketplaces} onChange={setSellsOnMarketplaces} label="오픈마켓·플랫폼에서 판매해요" />
            <Toggle checked={hasBookkeeping} onChange={setHasBookkeeping} label="기장 중이에요" />
            <Toggle checked={hasEvidenceRoutine} onChange={setHasEvidenceRoutine} label="매달 증빙을 정리해요" />
            <Toggle checked={hasTaxCalendar} onChange={setHasTaxCalendar} label="신고 일정을 저장했어요" />
          </div>
        </section>

        <aside className="bg-primary p-5 text-white sm:p-7">
          <p className="text-sm font-bold text-white/60">내 세무 운영 진단</p>
          <p className="mt-2 text-3xl font-black">{recommendation}</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/10 p-4">
              <p className="text-xs text-white/60">필요한 세무 의무</p>
              <p className="mt-1 text-2xl font-black">{assessment.obligationCount}개</p>
            </div>
            <div className="rounded-lg bg-white/10 p-4">
              <p className="text-xs text-white/60">복잡도</p>
              <p className="mt-1 text-2xl font-black">{assessment.complexityScore}/100</p>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-white/15 p-4">
            <div className="flex items-center gap-2 text-sm font-bold">
              <CalendarClock size={17} />
              가장 가까운 기본 일정
            </div>
            <p className="mt-2 font-black">{assessment.nextDeadline}</p>
            <p className="mt-1 text-sm text-white/65">{assessment.nextDeadlineLabel}</p>
          </div>

          <div className="mt-5 space-y-2">
            {assessment.annualCalendar
              .filter((item) => item.required)
              .map((item) => (
                <div key={item.key} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-brand" size={16} />
                  <span>
                    <strong>{item.label}</strong>
                    <span className="ml-2 text-white/55">{item.timing}</span>
                  </span>
                </div>
              ))}
          </div>
        </aside>
      </div>

      <div className="flex flex-col gap-4 border-t border-line p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <p className="max-w-2xl text-xs leading-5 text-ink-muted">
          법정기한은 휴일, 신고유형, 개별 연장에 따라 달라질 수 있습니다. 저장 후 본인 안내문과 국세청 일정을 우선 확인하세요.
        </p>
        <button
          type="button"
          onClick={() => void createCase()}
          disabled={state === "busy" || !parsedRevenue.ok || !annualRevenue}
          className="btn-primary shrink-0 disabled:opacity-60"
        >
          {state === "busy" ? "운영표 만드는 중..." : "내 세무 운영표 만들기"}
          <ArrowRight size={17} />
        </button>
      </div>
      {state === "error" ? (
        <p className="border-t border-line px-5 py-3 text-sm text-red-700">
          운영표를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : null}
    </div>
  );
}
