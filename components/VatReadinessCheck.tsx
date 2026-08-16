"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CircleHelp, RotateCcw } from "lucide-react";
import type {
  VatFilingDecisionInput,
  VatFilingDecisionResult,
} from "@/lib/calculators/vat-filing-decision";
import { trackGoogleEvent, trackSiteEvent } from "@/lib/site-track";
import {
  VAT_READINESS_TASKS,
  calculateVatReadiness,
  type VatReadinessAnswers,
  type VatReadinessStatus,
  type VatReadinessTaskKey,
} from "@/lib/tax-cases/vat-readiness";

const ANSWER_OPTIONS: ReadonlyArray<{
  value: VatReadinessStatus;
  label: string;
}> = [
  { value: "ready", label: "준비했어요" },
  { value: "not_ready", label: "아직이에요" },
  { value: "unsure", label: "잘 모르겠어요" },
];

const RECOMMENDATION_COPY: Record<
  VatFilingDecisionResult["recommendation"],
  string
> = {
  self: "직접 신고 가능성이 높아요",
  review: "신고 전 한 번 검토를 권해요",
  tax_accountant: "세무사 검토를 권해요",
};

function asCompleteAnswers(
  value: Partial<VatReadinessAnswers>,
): VatReadinessAnswers | null {
  const complete = VAT_READINESS_TASKS.every((task) => value[task.key]);
  return complete ? (value as VatReadinessAnswers) : null;
}

export function VatReadinessCheck({
  decisionInput,
  decisionResult,
}: {
  decisionInput: VatFilingDecisionInput;
  decisionResult: VatFilingDecisionResult;
}) {
  const router = useRouter();
  const [opened, setOpened] = useState(false);
  const [answers, setAnswers] = useState<Partial<VatReadinessAnswers>>({});
  const [saveState, setSaveState] = useState<"idle" | "busy" | "error">("idle");
  const dedupeKeyRef = useRef<string | null>(null);
  const completedTrackingRef = useRef<string | null>(null);

  const decisionSignature = JSON.stringify(decisionInput);
  const completeAnswers = useMemo(() => asCompleteAnswers(answers), [answers]);
  const readiness = useMemo(
    () => (completeAnswers ? calculateVatReadiness(completeAnswers) : null),
    [completeAnswers],
  );

  useEffect(() => {
    setOpened(false);
    setAnswers({});
    setSaveState("idle");
    dedupeKeyRef.current = null;
    completedTrackingRef.current = null;
  }, [decisionSignature]);

  useEffect(() => {
    if (!readiness || !completeAnswers) return;
    const key = JSON.stringify(completeAnswers);
    if (completedTrackingRef.current === key) return;
    completedTrackingRef.current = key;
    trackSiteEvent("tax_readiness_completed", {
      caseType: "vat",
      readinessScore: readiness.score,
      complexityScore: decisionResult.score,
      recommendation: decisionResult.recommendation,
    });
  }, [completeAnswers, decisionResult.recommendation, decisionResult.score, readiness]);

  const open = () => {
    setOpened(true);
    trackSiteEvent("tax_readiness_started", {
      caseType: "vat",
      complexityScore: decisionResult.score,
      recommendation: decisionResult.recommendation,
    });
  };

  const save = async () => {
    if (!completeAnswers || saveState === "busy") return;
    setSaveState("busy");
    dedupeKeyRef.current ??= crypto.randomUUID();

    try {
      const response = await fetch("/api/tax-cases/vat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientDedupeKey: dedupeKeyRef.current,
          sourcePath: window.location.pathname,
          decisionInput,
          readinessAnswers: completeAnswers,
        }),
      });
      const body = (await response.json()) as { token?: string };
      if (!response.ok || !body.token) {
        setSaveState("error");
        return;
      }
      trackGoogleEvent("tax_case_created", {
        caseType: "vat",
        readinessScore: readiness?.score,
        complexityScore: decisionResult.score,
      });
      router.push(`/case/${body.token}`);
    } catch {
      setSaveState("error");
    }
  };

  return (
    <section className="mt-6 overflow-hidden rounded-lg border border-line bg-[#F5F1EA]">
      {!opened ? (
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm font-bold text-[#6A442D]">신고 전 1분 확인</p>
            <h3 className="mt-2 text-xl font-black text-ink">
              지금 신고할 준비가 얼마나 됐는지 확인해 보세요.
            </h3>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              어려운 용어 없이 네 가지만 확인하면, 가장 먼저 할 일을 알려드려요.
            </p>
          </div>
          <button
            type="button"
            onClick={open}
            className="btn-primary w-full shrink-0 text-sm font-bold sm:w-auto"
          >
            내 신고 준비도 확인
            <ArrowRight size={17} />
          </button>
        </div>
      ) : (
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#6A442D]">부가세 신고 준비도</p>
              <h3 className="mt-2 text-xl font-black text-ink">
                준비한 항목을 알려주세요.
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setAnswers({})}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink"
              title="답변 다시 선택"
              aria-label="답변 다시 선택"
            >
              <RotateCcw size={17} />
            </button>
          </div>

          <div className="mt-5 divide-y divide-line border-y border-line bg-white">
            {VAT_READINESS_TASKS.map((task, index) => (
              <div key={task.key} className="px-4 py-5">
                <p className="text-sm font-bold text-ink">
                  {index + 1}. {task.question}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label={task.question}>
                  {ANSWER_OPTIONS.map((option) => {
                    const selected = answers[task.key] === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() =>
                          setAnswers((current) => ({
                            ...current,
                            [task.key]: option.value,
                          }))
                        }
                        className={`min-h-11 rounded-lg border px-2 text-xs font-bold transition-colors sm:text-sm ${
                          selected
                            ? "border-[#6A442D] bg-[#6A442D] text-white"
                            : "border-line bg-white text-ink hover:bg-surface-muted"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {readiness ? (
            <div className="mt-5 rounded-lg bg-primary p-5 text-white">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white/65">현재 신고 준비도</p>
                  <p className="mt-1 text-4xl font-black">{readiness.score}%</p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
                  {RECOMMENDATION_COPY[decisionResult.recommendation]}
                </span>
              </div>

              <div className="mt-5 border-t border-white/15 pt-4">
                <p className="text-xs font-semibold text-white/60">지금 가장 먼저 할 일</p>
                <p className="mt-1 text-base font-bold">
                  {readiness.nextAction?.label ?? "필수 준비가 모두 끝났어요."}
                </p>
                {readiness.nextAction ? (
                  <p className="mt-1 text-sm leading-6 text-white/70">
                    {readiness.nextAction.description}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => void save()}
                disabled={saveState === "busy"}
                className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-black text-brand-dark disabled:opacity-60"
              >
                <Check size={18} />
                {saveState === "busy" ? "저장 중..." : "내 준비상태 저장하기"}
              </button>
              {saveState === "error" ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-red-200">
                  <CircleHelp size={14} />
                  잠시 저장하지 못했습니다. 다시 시도해 주세요.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-center text-sm text-ink-muted">
              네 항목에 답하면 바로 결과를 보여드려요.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
