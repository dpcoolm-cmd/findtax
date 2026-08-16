"use client";

import { useState } from "react";

type PlanKey = "starter" | "basic" | "pro";

export function PartnerPricingWaitlistModal({
  planKey,
  planLabel,
  open,
  onClose,
}: {
  planKey: PlanKey;
  planLabel: string;
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!open) return null;

  async function submit() {
    setMsg(null);
    const em = email.trim();
    if (!em.includes("@")) {
      setMsg("이메일을 입력해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/partners/pricing-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, planKey }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(j.error ?? "접수에 실패했습니다.");
        return;
      }
      setMsg("출시 알림 신청이 접수되었습니다. 감사합니다!");
      setTimeout(() => {
        onClose();
        setEmail("");
        setMsg(null);
      }, 1200);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="waitlist-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="waitlist-title" className="text-lg font-bold text-neutral-900">
          출시 알림 받기
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          <span className="font-semibold text-brand">{planLabel}</span> 플랜 — 결제는
          아직 연결되지 않았습니다. 오픈 시 안내드립니다.
        </p>
        <label className="mt-4 block text-sm font-medium text-neutral-800">
          이메일
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            autoComplete="email"
          />
        </label>
        {msg ? (
          <p className="mt-2 text-sm text-neutral-700" role="status">
            {msg}
          </p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium hover:bg-neutral-50"
            onClick={() => {
              onClose();
              setMsg(null);
            }}
            disabled={busy}
          >
            닫기
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-ink hover:bg-brand-light disabled:opacity-50"
            onClick={() => void submit()}
          >
            {busy ? "처리 중…" : "알림 신청"}
          </button>
        </div>
      </div>
    </div>
  );
}
