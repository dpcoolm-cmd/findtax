"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { getPartnerBankInfoLines } from "@/lib/partner-bank-info";

export function PartnerRechargeRequestForm() {
  const [open, setOpen] = useState(false);
  const [requestedAmount, setRequestedAmount] = useState("");
  const [depositorName, setDepositorName] = useState("");
  const [partnerMemo, setPartnerMemo] = useState("");
  const [taxCompany, setTaxCompany] = useState("");
  const [taxRegNo, setTaxRegNo] = useState("");
  const [taxEmail, setTaxEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [okBanner, setOkBanner] = useState<string | null>(null);

  const bankLines = getPartnerBankInfoLines();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const supabase = createBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setErr("로그인이 필요합니다.");
        return;
      }
      const res = await fetch("/api/partners/recharge-request", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestedAmount: requestedAmount.trim(),
          depositorName: depositorName.trim(),
          partnerMemo: partnerMemo.trim() || null,
          taxInvoiceCompanyName: taxCompany.trim(),
          taxInvoiceBusinessRegNo: taxRegNo.trim(),
          taxInvoiceEmail: taxEmail.trim(),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(
          j.error === "invalid_amount"
            ? "충전 요청 금액을 확인해 주세요."
            : j.error === "invalid_tax_email"
              ? "세금계산서 이메일 형식을 확인해 주세요."
              : (j.error as string) ?? "접수 실패",
        );
        return;
      }
      setErr(null);
      setOkBanner("충전 신청이 접수되었습니다. 입금 확인 후 운영팀에서 포인트를 반영합니다.");
      setRequestedAmount("");
      setDepositorName("");
      setPartnerMemo("");
      setTaxCompany("");
      setTaxRegNo("");
      setTaxEmail("");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-neutral-900">포인트 충전</h2>
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setErr(null);
          }}
          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-ink hover:bg-brand-light"
        >
          포인트 충전 신청
        </button>
      </div>
      <p className="mt-2 text-xs text-neutral-600">
        무통장 입금 후 아래 양식으로 신청해 주시면, 운영팀이 확인 후 수동 충전합니다.
      </p>

      {okBanner ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
          {okBanner}{" "}
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => setOkBanner(null)}
          >
            닫기
          </button>
        </p>
      ) : null}

      {open ? (
        <form onSubmit={submit} className="mt-4 space-y-3 border-t border-neutral-100 pt-4">
          <div className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-800">
            <p className="font-semibold text-neutral-900">입금 계좌 안내</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {bankLines.map((line) => (
                <li key={line} className="[word-break:keep-all]">
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <label className="block text-xs">
            <span className="font-medium text-neutral-800">충전 요청 금액 (원, 숫자)</span>
            <input
              className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-1.5"
              inputMode="numeric"
              required
              value={requestedAmount}
              onChange={(e) => setRequestedAmount(e.target.value.replace(/\D/g, ""))}
            />
          </label>
          <label className="block text-xs">
            <span className="font-medium text-neutral-800">입금자명</span>
            <input
              className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-1.5"
              required
              minLength={2}
              value={depositorName}
              onChange={(e) => setDepositorName(e.target.value)}
            />
          </label>
          <label className="block text-xs">
            <span className="font-medium text-neutral-800">세금계산서 — 상호(법인명)</span>
            <input
              className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-1.5"
              required
              value={taxCompany}
              onChange={(e) => setTaxCompany(e.target.value)}
            />
          </label>
          <label className="block text-xs">
            <span className="font-medium text-neutral-800">세금계산서 — 사업자등록번호</span>
            <input
              className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-1.5"
              required
              value={taxRegNo}
              onChange={(e) => setTaxRegNo(e.target.value)}
            />
          </label>
          <label className="block text-xs">
            <span className="font-medium text-neutral-800">세금계산서 — 수령 이메일</span>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-1.5"
              required
              value={taxEmail}
              onChange={(e) => setTaxEmail(e.target.value)}
            />
          </label>
          <label className="block text-xs">
            <span className="font-medium text-neutral-800">비고 (선택)</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-1.5"
              rows={2}
              value={partnerMemo}
              onChange={(e) => setPartnerMemo(e.target.value)}
            />
          </label>

          {err ? (
            <p className="rounded-lg bg-red-50 px-2 py-1.5 text-xs text-red-800">{err}</p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-brand py-2 text-xs font-semibold text-ink hover:bg-brand-light disabled:opacity-50"
          >
            {busy ? "제출 중…" : "신청 제출"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
