"use client";

import { useState } from "react";

/**
 * 계산 결과 아래 이메일 수집.
 * 프레임: "결과 보관 + 신고 시즌 알림" — 즉시 도착을 약속하지 않는다
 * (도메인 인증 전 Resend 샌드박스에서는 발송이 지연·제한될 수 있음).
 */
export function ResultEmailCapture({
  calculatorLabel,
  summary,
}: {
  calculatorLabel: string;
  summary: string | null;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  if (!summary?.trim()) return null;

  const submit = async () => {
    if (state === "busy" || state === "done") return;
    setState("busy");
    try {
      const res = await fetch("/api/result-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, calculatorLabel, summary }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-dashed border-[#D5D9D2] bg-white px-4 py-3">
      {state === "done" ? (
        <p className="text-sm font-medium text-brand-dark">
          저장되었습니다. 계산 결과 요약과 신고 시즌 안내를 이메일로 보내드릴게요.
        </p>
      ) : (
        <>
          <p className="text-sm font-semibold text-ink">이 결과를 이메일로 보관하기</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            결과 요약을 받아두고, 관련 신고 시즌이 오면 잊지 않게 알려드려요.
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소"
              className="h-11 flex-1 rounded-xl border border-[#D5D9D2] px-3 text-sm outline-none focus:border-brand-dark"
            />
            <button
              type="button"
              onClick={() => void submit()}
              disabled={state === "busy" || !email.includes("@")}
              className="h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {state === "busy" ? "저장 중…" : "받아두기"}
            </button>
          </div>
          {state === "error" ? (
            <p className="mt-1.5 text-xs text-red-600">
              저장에 실패했어요. 이메일 주소를 확인하고 다시 시도해 주세요.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
