"use client";

import { useState } from "react";
import { ArrowRight, BellRing, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type {
  YearEndTaxOptimizationInput,
  YearEndTaxOptimizationResult,
} from "@/lib/calculators/year-end-tax-optimization";
import { trackGoogleEvent } from "@/lib/site-track";

export function PensionTaxCaseStart({
  input,
  result,
}: {
  input: YearEndTaxOptimizationInput;
  result: YearEndTaxOptimizationResult;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [dedupeKey] = useState(() => crypto.randomUUID());

  const createPlan = async () => {
    if (state === "busy") return;
    setState("busy");
    try {
      const response = await fetch("/api/tax-cases/pension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          clientDedupeKey: dedupeKey,
          sourcePath: window.location.pathname,
        }),
      });
      const body = (await response.json()) as { token?: string };
      if (!response.ok || !body.token) {
        setState("error");
        return;
      }
      trackGoogleEvent("pension_plan_created", {
        strategy: result.strategy,
        cashFlowStatus: result.cashFlowStatus,
        recommendation: result.recommendation,
      });
      router.push(`/case/${body.token}`);
    } catch {
      setState("error");
    }
  };

  return (
    <section className="mt-6 overflow-hidden rounded-lg border border-[#D8C9BB] bg-[#F8F4EF]">
      <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-[#6A442D]">
            <BellRing size={17} />
            올해 납입 플랜 저장
          </p>
          <h3 className="mt-2 text-xl font-black text-ink">
            계산 결과를 할 일과 알림으로 바꿔드려요.
          </h3>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-[#296B2F]" />
              소득·납입자료 체크
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-[#296B2F]" />
              12월 사전 점검 알림
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void createPlan()}
          disabled={state === "busy"}
          className="btn-primary min-w-40 disabled:cursor-wait disabled:opacity-60"
        >
          {state === "busy" ? "저장 중..." : "내 플랜 만들기"}
          <ArrowRight size={17} />
        </button>
      </div>
      {state === "error" ? (
        <p className="border-t border-[#D8C9BB] px-5 py-3 text-sm text-red-700">
          플랜을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : null}
    </section>
  );
}
