"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";

type DocRow = {
  id: string;
  doc_type: "certificate" | "business_license";
  storage_path: string;
};

type PartnerRow = {
  id: string;
  user_id: string;
  professional_type: "tax_advisor" | "cpa";
  license_display: string;
  office_name: string;
  representative_name: string | null;
  sido: string;
  sigungu: string;
  specialties: string[] | null;
  status: "pending" | "approved" | "rejected";
  points_balance: number;
  is_founder: boolean;
  referrer_partner_id: string | null;
  created_at: string;
  partner_documents: DocRow[] | null;
};

type RechargeReqRow = {
  id: string;
  partner_id: string;
  requested_amount: number;
  depositor_name: string;
  partner_memo: string | null;
  tax_invoice_company_name: string;
  tax_invoice_business_reg_no: string;
  tax_invoice_email: string;
  status: string;
  created_at: string;
  partners: {
    office_name: string;
    sido: string;
    sigungu: string;
    license_display: string;
  } | null;
};

export function AdminPartnersClient() {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [recharges, setRecharges] = useState<RechargeReqRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adjustPartner, setAdjustPartner] = useState<PartnerRow | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustBusy, setAdjustBusy] = useState(false);

  const loadPartners = useCallback(async () => {
    setError(null);
    const supabase = createBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setError("로그인이 필요합니다.");
      setPartners([]);
      return;
    }
    const res = await fetch("/api/admin/partners", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setError("관리자 권한이 없거나 세션이 만료되었습니다.");
      setPartners([]);
      return;
    }
    const json = (await res.json()) as { partners?: PartnerRow[] };
    setPartners(json.partners ?? []);
  }, []);

  const loadRecharges = useCallback(async () => {
    const supabase = createBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return;
    const res = await fetch("/api/admin/partners/recharge-requests", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const json = (await res.json()) as { requests?: RechargeReqRow[] };
    setRecharges(json.requests ?? []);
  }, []);

  const load = useCallback(async () => {
    await loadPartners();
    await loadRecharges();
  }, [loadPartners, loadRecharges]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openDoc(path: string) {
    const supabase = createBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return;
    const res = await fetch("/api/admin/partners/doc-url", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path }),
    });
    const j = await res.json();
    if (j.url) window.open(j.url, "_blank", "noopener,noreferrer");
  }

  async function approve(id: string) {
    setBusyId(id);
    try {
      const supabase = createBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      const res = await fetch(`/api/admin/partners/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "승인 실패");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    const reason = window.prompt("반려 사유를 입력하세요.", "서류 불충분");
    if (reason === null) return;
    setBusyId(id);
    try {
      const supabase = createBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      const res = await fetch(`/api/admin/partners/${id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "반려 실패");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function submitAdjust() {
    if (!adjustPartner) return;
    const amt = Number.parseInt(adjustAmount.replace(/\D/g, ""), 10);
    const reason = adjustReason.trim();
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("충전 금액은 1 이상의 숫자여야 합니다.");
      return;
    }
    if (reason.length < 2) {
      setError("사유를 입력해 주세요.");
      return;
    }
    setAdjustBusy(true);
    setError(null);
    try {
      const supabase = createBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      const res = await fetch(`/api/admin/partners/${adjustPartner.id}/adjust-points`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: amt, reason }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error ?? "충전 실패");
        return;
      }
      setAdjustPartner(null);
      setAdjustAmount("");
      setAdjustReason("");
      await load();
    } finally {
      setAdjustBusy(false);
    }
  }

  async function markRechargeDone(id: string, status: "done" | "cancelled") {
    const supabase = createBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return;
    const res = await fetch(`/api/admin/partners/recharge-requests/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) await loadRecharges();
  }

  const pending = partners.filter((p) => p.status === "pending");
  const approved = partners.filter((p) => p.status === "approved");
  const pendingRechargeCount = recharges.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50"
        >
          새로고침
        </button>
        <p className="text-sm text-neutral-600">승인 대기 {pending.length}건</p>
      </div>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      <section>
        <h2 className="text-sm font-bold text-neutral-900">서류 검토 · 승인</h2>
        <div className="mt-2 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-2">사무소</th>
                <th className="px-3 py-2">지역</th>
                <th className="px-3 py-2">자격번호</th>
                <th className="px-3 py-2">상태</th>
                <th className="px-3 py-2">서류</th>
                <th className="px-3 py-2">처리</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((p) => (
                <tr key={p.id} className="border-t border-neutral-100">
                  <td className="px-3 py-2 font-medium text-neutral-900">
                    {p.office_name}
                    <div className="text-xs text-neutral-500">
                      {p.professional_type === "tax_advisor" ? "세무사" : "회계사"}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {p.sido} {p.sigungu}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{p.license_display}</td>
                  <td className="px-3 py-2">{p.status}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      {(p.partner_documents ?? []).map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          className="text-left text-xs font-medium text-brand hover:underline"
                          onClick={() => void openDoc(d.storage_path)}
                        >
                          {d.doc_type === "certificate" ? "자격증" : "사업자등록증"}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1 sm:flex-row">
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => void approve(p.id)}
                        className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => void reject(p.id)}
                        className="rounded-lg border border-neutral-200 px-2 py-1 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-50"
                      >
                        반려
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pending.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-neutral-500">
              대기 중인 신청이 없습니다.
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold text-neutral-900">승인 파트너 · 포인트 수동 충전</h2>
        <p className="mt-1 text-xs text-neutral-600">
          금액·사유는 <code className="rounded bg-neutral-100 px-1">rpc_admin_adjust_points</code>로
          즉시 반영됩니다.
        </p>
        <div className="mt-2 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-2">사무소</th>
                <th className="px-3 py-2">지역</th>
                <th className="px-3 py-2">포인트</th>
                <th className="px-3 py-2">구분</th>
                <th className="px-3 py-2">액션</th>
              </tr>
            </thead>
            <tbody>
              {approved.map((p) => (
                <tr key={p.id} className="border-t border-neutral-100">
                  <td className="px-3 py-2 font-medium text-neutral-900">{p.office_name}</td>
                  <td className="px-3 py-2">
                    {p.sido} {p.sigungu}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {p.points_balance.toLocaleString("ko-KR")}P
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {p.is_founder ? "Founder" : "일반"}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="rounded-lg border border-brand bg-brand-light/40 px-2 py-1 text-xs font-semibold text-brand hover:bg-brand-light"
                      onClick={() => {
                        setError(null);
                        setAdjustPartner(p);
                        setAdjustAmount("");
                        setAdjustReason("");
                      }}
                    >
                      포인트 수동 충전
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {approved.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-neutral-500">
              승인된 파트너가 없습니다.
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold text-neutral-900">포인트 충전 신청 (무통장)</h2>
        <p className="mt-1 text-xs text-neutral-600">
          파트너가 제출한 입금·세금계산서 정보입니다. 입금 확인 후 위에서 수동 충전하고 [처리완료]를
          누르세요. (대기 {pendingRechargeCount}건)
        </p>
        <div className="mt-2 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-2">일시</th>
                <th className="px-3 py-2">파트너</th>
                <th className="px-3 py-2">금액</th>
                <th className="px-3 py-2">입금자명</th>
                <th className="px-3 py-2">세금계산서</th>
                <th className="px-3 py-2">비고</th>
                <th className="px-3 py-2">상태</th>
                <th className="px-3 py-2">처리</th>
              </tr>
            </thead>
            <tbody>
              {recharges.map((r) => (
                <tr key={r.id} className="border-t border-neutral-100 align-top">
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-neutral-600">
                    {new Date(r.created_at).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div className="font-medium text-neutral-900">
                      {r.partners?.office_name ?? "—"}
                    </div>
                    <div className="text-neutral-500">
                      {r.partners?.sido} {r.partners?.sigungu}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {r.requested_amount.toLocaleString("ko-KR")}원
                  </td>
                  <td className="px-3 py-2 text-xs">{r.depositor_name}</td>
                  <td className="px-3 py-2 text-xs">
                    <div>{r.tax_invoice_company_name}</div>
                    <div className="text-neutral-500">{r.tax_invoice_business_reg_no}</div>
                    <div className="text-neutral-500">{r.tax_invoice_email}</div>
                  </td>
                  <td className="max-w-[140px] px-3 py-2 text-xs text-neutral-600">
                    {r.partner_memo ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">{r.status}</td>
                  <td className="px-3 py-2">
                    {r.status === "pending" ? (
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                          onClick={() => void markRechargeDone(r.id, "done")}
                        >
                          처리완료
                        </button>
                        <button
                          type="button"
                          className="rounded border border-neutral-200 px-2 py-1 text-[11px] font-medium hover:bg-neutral-50"
                          onClick={() => void markRechargeDone(r.id, "cancelled")}
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recharges.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-neutral-500">
              충전 신청 내역이 없습니다.
            </p>
          ) : null}
        </div>
      </section>

      {adjustPartner ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-neutral-900">포인트 수동 충전</h3>
            <p className="mt-1 text-sm text-neutral-600">{adjustPartner.office_name}</p>
            <label className="mt-4 block text-sm">
              <span className="font-medium">충전 포인트 (P)</span>
              <input
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2"
                inputMode="numeric"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value.replace(/\D/g, ""))}
              />
            </label>
            <label className="mt-3 block text-sm">
              <span className="font-medium">사유 (원장에 기록)</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                rows={3}
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="예: 무통장 입금 확인 2026-04-19"
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
                onClick={() => setAdjustPartner(null)}
              >
                닫기
              </button>
              <button
                type="button"
                disabled={adjustBusy}
                className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-ink hover:bg-brand-light disabled:opacity-50"
                onClick={() => void submitAdjust()}
              >
                {adjustBusy ? "처리 중…" : "즉시 충전"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
