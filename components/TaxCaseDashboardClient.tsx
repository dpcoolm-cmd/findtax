"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  ShieldCheck,
} from "lucide-react";
import { GuidedTaxCaseExecutionPanel } from "@/components/GuidedTaxCaseExecutionPanel";
import { TaxCaseEvidencePanel } from "@/components/TaxCaseEvidencePanel";
import { TaxCaseHandoffPanel } from "@/components/TaxCaseHandoffPanel";
import { TaxCaseSavePanel } from "@/components/TaxCaseSavePanel";
import { TaxDeadlinePanel } from "@/components/TaxDeadlinePanel";
import { VatFilingExecutionPanel } from "@/components/VatFilingExecutionPanel";
import { trackGoogleEvent } from "@/lib/site-track";
import type {
  TaxCaseView,
  VatTaxCaseView,
} from "@/lib/tax-cases/server";

const CASE_COPY = {
  vat: {
    eyebrow: "부가세 신고 준비",
    intro: "아직 준비하지 못한 항목만 하나씩 완료해 보세요.",
    calculatorHref: "/calculator/%EB%B6%80%EA%B0%80%EC%84%B8",
    calculatorLabel: "부가세 다시 계산",
  },
  gift: {
    eyebrow: "증여세 신고 준비",
    intro: "10년 합산, 증여 증빙, 재산 평가와 신고기한을 순서대로 확인하세요.",
    calculatorHref: "/calculator/%EC%A6%9D%EC%97%AC%EC%84%B8",
    calculatorLabel: "증여세 다시 계산",
  },
  solo_business: {
    eyebrow: "1인사업자 세무 관리",
    intro: "내 사업에 필요한 신고와 매달 반복할 증빙 루틴만 관리하세요.",
    calculatorHref: "/calculator/1%EC%9D%B8%EC%82%AC%EC%97%85%EC%9E%90",
    calculatorLabel: "운영 진단 다시 하기",
  },
  pension: {
    eyebrow: "연금·IRP 절세 플랜",
    intro: "비상자금, 공제율 기준소득, 올해 납입액을 순서대로 확인하세요.",
    calculatorHref: "/calculator/%EC%97%B0%EB%A7%90%EC%A0%95%EC%82%B0",
    calculatorLabel: "연금 플랜 다시 계산",
  },
  seller: {
    eyebrow: "온라인·글로벌 셀러 세금 운영표",
    intro: "플랫폼 정산, 총매출, 수수료·반품과 해외증빙을 월별로 맞춰보세요.",
    calculatorHref: "/calculator#industry-diagnosis",
    calculatorLabel: "셀러 진단 다시 하기",
  },
} as const;

const RECOMMENDATION_COPY: Record<TaxCaseView["recommendation"], string> = {
  self: "직접 진행 가능성이 높아요",
  review: "마지막 검토를 권해요",
  tax_accountant: "전문가 검토를 권해요",
};

function readinessCopy(score: number, completed: boolean) {
  if (completed) return "이번 세금 할 일을 완료했어요.";
  if (score === 100) return "필수 준비가 모두 끝났어요.";
  if (score >= 75) return "거의 다 준비됐어요.";
  if (score >= 50) return "절반 이상 준비했어요.";
  return "하나씩 준비하면 어렵지 않아요.";
}

function won(value: unknown): string {
  return typeof value === "number"
    ? `${value.toLocaleString("ko-KR")}원`
    : "-";
}

function CaseContext({ taxCase }: { taxCase: TaxCaseView }) {
  if (taxCase.caseType === "gift") {
    return (
      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-xs font-bold text-ink-muted">관계별 10년 공제 한도</p>
          <p className="mt-2 text-xl font-black text-ink">
            {won(taxCase.context.deductionLimitWon)}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-xs font-bold text-ink-muted">이번 증여 후 남는 한도</p>
          <p className="mt-2 text-xl font-black text-[#296B2F]">
            {won(taxCase.context.remainingAfterGiftWon)}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-xs font-bold text-ink-muted">한도 초과 가능액</p>
          <p className="mt-2 text-xl font-black text-ink">
            {won(taxCase.context.amountOverRemainingLimitWon)}
          </p>
        </div>
      </section>
    );
  }
  if (
    taxCase.caseType === "solo_business" &&
    Array.isArray(taxCase.context.annualCalendar)
  ) {
    return (
      <section className="mt-8 border-y border-line bg-white py-5">
        <p className="text-sm font-bold text-[#6A442D]">내 연간 세무 캘린더</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {taxCase.context.annualCalendar
            .filter(
              (item) =>
                typeof item === "object" &&
                item !== null &&
                !Array.isArray(item) &&
                item.required === true,
            )
            .map((item) => {
              if (
                typeof item !== "object" ||
                item === null ||
                Array.isArray(item) ||
                typeof item.key !== "string" ||
                typeof item.label !== "string" ||
                typeof item.timing !== "string"
              ) {
                return null;
              }
              return (
                <div key={item.key} className="rounded-lg bg-surface-muted p-4">
                  <p className="font-black text-ink">{item.label}</p>
                  <p className="mt-1 text-sm text-ink-muted">{item.timing}</p>
                </div>
              );
            })}
        </div>
      </section>
    );
  }
  if (taxCase.caseType === "pension") {
    return (
      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-xs font-bold text-ink-muted">현재 예상 세금효과</p>
          <p className="mt-2 text-xl font-black text-ink">
            {won(taxCase.context.currentEstimatedTaxBenefitWon)}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-xs font-bold text-ink-muted">추가 예상 세금효과</p>
          <p className="mt-2 text-xl font-black text-[#296B2F]">
            {won(taxCase.context.additionalEstimatedTaxBenefitWon)}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-xs font-bold text-ink-muted">기본 한도까지 남은 금액</p>
          <p className="mt-2 text-xl font-black text-ink">
            {won(taxCase.context.yearlyContributionGapWon)}
          </p>
        </div>
      </section>
    );
  }
  if (taxCase.caseType === "seller") {
    const obligations = Array.isArray(taxCase.context.obligations)
      ? taxCase.context.obligations
      : [];
    const evidenceGaps = Array.isArray(taxCase.context.evidenceGaps)
      ? taxCase.context.evidenceGaps
      : [];
    return (
      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-xs font-bold text-ink-muted">확인할 세무 의무</p>
          <p className="mt-2 text-xl font-black text-ink">
            {
              obligations.filter(
                (item) =>
                  typeof item === "object" &&
                  item !== null &&
                  !Array.isArray(item) &&
                  item.required === true,
              ).length
            }
            개
          </p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-xs font-bold text-ink-muted">보완할 증빙</p>
          <p className="mt-2 text-xl font-black text-[#8A4F2B]">
            {evidenceGaps.length}개
          </p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-xs font-bold text-ink-muted">다음 기본 기한</p>
          <p className="mt-2 text-xl font-black text-ink">
            {taxCase.filingDeadline ?? "-"}
          </p>
        </div>
      </section>
    );
  }
  return null;
}

export function TaxCaseDashboardClient({
  initialTaxCase,
}: {
  initialTaxCase: TaxCaseView;
}) {
  const [taxCase, setTaxCase] = useState(initialTaxCase);
  const [busyTask, setBusyTask] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const copy = CASE_COPY[taxCase.caseType];

  const nextTask = useMemo(() => {
    if (taxCase.status === "completed") {
      return {
        label: "현재 할 일 완료",
        description: "접수증과 최종 자료를 내 세금함과 별도 저장소에 보관하세요.",
      };
    }
    if (taxCase.filingMethod === "undecided") {
      return {
        label:
          taxCase.caseType === "solo_business"
            ? "직접 관리할지 기장할지 선택"
            : taxCase.caseType === "pension"
              ? "직접 관리할지 검토받을지 선택"
            : "직접 신고할지 먼저 선택",
        description: "진단 결과를 참고해 진행 방식을 정하세요.",
      };
    }
    const document = taxCase.documents.find((item) => item.status !== "ready");
    if (document) {
      return { label: document.label, description: document.description };
    }
    const task = taxCase.tasks.find((item) => item.status !== "ready");
    if (task) return { label: task.label, description: task.description };
    return {
      label:
        taxCase.filingMethod === "professional"
          ? "전문가에게 검토 요청"
          : "홈택스에서 다음 업무 진행",
      description: "준비한 자료와 진단 결과를 바탕으로 마지막 단계를 진행하세요.",
    };
  }, [taxCase]);

  const updateTask = async (taskKey: string, ready: boolean) => {
    if (busyTask) return;
    setBusyTask(taskKey);
    setError(null);
    try {
      const response = await fetch(
        `/api/tax-cases/${taxCase.token}/tasks/${taskKey}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: ready ? "ready" : "not_ready" }),
        },
      );
      const body = (await response.json()) as { taxCase?: TaxCaseView };
      if (!response.ok || !body.taxCase) {
        setError("변경 내용을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      setTaxCase(body.taxCase);
      trackGoogleEvent("tax_case_task_updated", {
        caseType: taxCase.caseType,
        taskKey,
        taskStatus: ready ? "ready" : "not_ready",
        readinessScore: body.taxCase.readinessScore,
      });
    } catch {
      setError("변경 내용을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusyTask(null);
    }
  };

  const recordConsultationOpen = () => {
    trackGoogleEvent("tax_case_consultation_opened", {
      caseType: taxCase.caseType,
      filingMethod: taxCase.filingMethod,
      recommendation: taxCase.recommendation,
      complexityBand:
        taxCase.complexityScore >= 62
          ? "high"
          : taxCase.complexityScore >= 34
            ? "mid"
            : "low",
    });
    void fetch(`/api/tax-cases/${taxCase.token}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "consultation_open" }),
      keepalive: true,
    }).catch(() => undefined);
  };

  return (
    <div className="app-shell-frame pb-24 pt-10 md:pb-28">
      <header className="max-w-3xl">
        <p className="text-sm font-bold text-[#6A442D]">{copy.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-black text-ink sm:text-4xl">
          {readinessCopy(
            taxCase.readinessScore,
            taxCase.status === "completed",
          )}
        </h1>
        <p className="mt-3 text-base leading-7 text-ink-muted">{copy.intro}</p>
      </header>

      <section className="mt-8 overflow-hidden rounded-lg bg-primary text-white">
        <div className="grid gap-7 p-6 sm:p-8 md:grid-cols-[minmax(0,0.7fr)_minmax(280px,1.3fr)] md:items-center">
          <div>
            <p className="text-sm font-semibold text-white/60">현재 준비도</p>
            <p className="mt-2 text-6xl font-black text-white">
              {taxCase.readinessScore}%
            </p>
            <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
              {RECOMMENDATION_COPY[taxCase.recommendation]}
            </p>
          </div>
          <div>
            <div className="h-3 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-300"
                style={{ width: `${taxCase.readinessScore}%` }}
              />
            </div>
            <div className="mt-6 border-t border-white/15 pt-5">
              <p className="text-xs font-semibold text-white/55">지금 가장 먼저 할 일</p>
              <p className="mt-1 text-xl font-black text-white">{nextTask.label}</p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                {nextTask.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <CaseContext taxCase={taxCase} />
      <TaxCaseEvidencePanel taxCase={taxCase} />
      <TaxCaseSavePanel token={taxCase.token} caseType={taxCase.caseType} />
      {taxCase.status !== "completed" ? (
        <TaxDeadlinePanel
          token={taxCase.token}
          caseType={taxCase.caseType}
          initialPeriodLabel={taxCase.filingPeriodLabel}
          initialDeadline={taxCase.filingDeadline}
          initialReminderEnabled={taxCase.reminderEnabled}
        />
      ) : null}

      {taxCase.caseType === "vat" ? (
        <VatFilingExecutionPanel
          taxCase={taxCase as VatTaxCaseView}
          onTaxCaseChange={(next) => setTaxCase(next)}
        />
      ) : (
        <GuidedTaxCaseExecutionPanel
          taxCase={
            taxCase as TaxCaseView & {
              caseType: "gift" | "solo_business" | "pension" | "seller";
            }
          }
          onTaxCaseChange={setTaxCase}
        />
      )}

      <TaxCaseHandoffPanel taxCase={taxCase} />

      {taxCase.status !== "completed" ? (
        <details className="mt-8 border-y border-line bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-2 py-5 font-bold text-ink sm:px-4">
            <span>기초 준비도 수정</span>
            <span className="text-sm font-semibold text-ink-muted">
              {taxCase.tasks.filter((task) => task.status === "ready").length}/
              {taxCase.tasks.length}
            </span>
          </summary>
          <div className="divide-y divide-line border-t border-line">
            {taxCase.tasks.map((task) => {
              const checked = task.status === "ready";
              return (
                <label
                  key={task.key}
                  className="flex cursor-pointer items-start gap-4 px-2 py-5 sm:px-4"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={busyTask !== null}
                    onChange={(event) =>
                      void updateTask(task.key, event.target.checked)
                    }
                    className="sr-only"
                  />
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      checked
                        ? "bg-[#6A442D] text-white"
                        : "bg-surface-muted text-ink-soft"
                    }`}
                    aria-hidden="true"
                  >
                    {checked ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block text-base font-bold ${
                        checked ? "text-ink-soft line-through" : "text-ink"
                      }`}
                    >
                      {task.label}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-ink-muted">
                      {task.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {error ? (
            <p className="px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}
        </details>
      ) : null}

      <section className="mt-8 grid gap-4 border-t border-line pt-8 md:grid-cols-2">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-ink">
            <ShieldCheck size={18} />
            진단 기준
          </div>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            준비도와 복잡도는 서로 다른 값입니다. 현재 복잡도는{" "}
            {taxCase.complexityScore}/100이며,{" "}
            {taxCase.caseType === "pension"
              ? "실제 납입 전에는 소득자료와 금융회사 안내를"
              : "실제 신고 전에는 본인 안내문과 공식자료를"}{" "}
            최종 확인해야 합니다.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row md:justify-end">
          <Link
            href={copy.calculatorHref}
            className="btn-secondary text-sm font-bold"
          >
            {copy.calculatorLabel}
          </Link>
          {taxCase.recommendation !== "self" ? (
            <Link
              href={`/consult?case=${encodeURIComponent(taxCase.token)}`}
              onClick={recordConsultationOpen}
              className="btn-primary text-sm font-bold"
            >
              전문가 검토 요청
              <ArrowRight size={17} />
            </Link>
          ) : null}
        </div>
      </section>

      <p className="mt-8 text-xs leading-5 text-ink-soft">
        이 링크는 현재 준비상태를 보여주는 임시 접근 링크입니다. 다른 사람과 공유하지 마세요.
      </p>
    </div>
  );
}
