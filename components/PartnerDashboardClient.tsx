"use client";

import { useCallback, useEffect, useState } from "react";
import { PartnerRechargeRequestForm } from "@/components/PartnerRechargeRequestForm";
import { FOUNDING_PARTNER_MEMBER_CAP } from "@/config/partner-program";
import { getLeadUnlockCharge } from "@/lib/lead-pricing";
import { getSituationLabel } from "@/lib/situations";
import { createBrowserClient } from "@/lib/supabase";

type PartnerProfile = {
  id: string;
  points_balance: number;
  status: "pending" | "approved" | "rejected";
  is_founder: boolean;
  founder_discount_until: string | null;
  referral_code: string | null;
  sido: string | null;
};

type LeadItem = {
  lead_id: string;
  sido: string;
  sigungu: string;
  situation: string;
  created_at: string;
  unlocked: boolean;
  name: string | null;
  phone: string | null;
  message: string | null;
  category?: string | null;
  business_type?: string | null;
  monthly_revenue?: string | null;
  industry?: string | null;
  has_accountant?: string | null;
  employee_count?: number | null;
  lead_quality?: string | null;
  assigned_at?: string | null;
  expires_at?: string | null;
  match_status?: string | null;
  detail_tier?: string | null;
};

type TodayRpc = { ok?: boolean; sido?: string; count?: number };
type ActivityRpc = {
  ok?: boolean;
  activity_score?: number;
  response_rate?: number;
  total_assigned?: number;
  total_accepted?: number;
  is_limited?: boolean;
};

function detailTierLabel(tier: string | null | undefined): { emoji: string; text: string } {
  if (tier === "high") return { emoji: "🟢", text: "상세" };
  if (tier === "mid") return { emoji: "🟡", text: "보통" };
  return { emoji: "🔴", text: "간단" };
}

function expiryLine(
  lead: LeadItem,
  nowMs: number,
): { text: string; urgent: boolean } | null {
  if (lead.unlocked) return null;
  const st = lead.match_status ?? "";
  if (st === "responded") return null;
  if (st === "rejected") return { text: "거절됨", urgent: false };
  if (st === "expired") return { text: "만료됨", urgent: false };
  const exp = lead.expires_at ? new Date(lead.expires_at).getTime() : null;
  if (exp == null || Number.isNaN(exp)) return null;
  const ms = exp - nowMs;
  if (ms <= 0) return { text: "만료됨", urgent: false };
  const totalMin = Math.ceil(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const text =
    h > 0 ? `만료까지 ${h}시간 ${m}분` : `만료까지 ${Math.max(1, m)}분`;
  return { text, urgent: ms < 3_600_000 };
}

export function PartnerDashboardClient() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [unlockHint, setUnlockHint] = useState<string | null>(null);
  const [busyLead, setBusyLead] = useState<string | null>(null);
  const [feedbackLeadId, setFeedbackLeadId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [todayLine, setTodayLine] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityRpc | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const refresh = useCallback(async () => {
    setError(null);
    const supabase = createBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setProfile(null);
      setLeads([]);
      setError("로그인이 필요합니다. 입점 신청 페이지에서 계정을 만든 뒤 다시 방문해 주세요.");
      return;
    }

    const uid = sessionData.session.user.id;
    const { data: p, error: pErr } = await supabase
      .from("partners")
      .select(
        "id, points_balance, status, is_founder, founder_discount_until, referral_code, sido",
      )
      .eq("user_id", uid)
      .maybeSingle();

    if (pErr) {
      setError(pErr.message);
      return;
    }
    if (!p) {
      setProfile(null);
      setLeads([]);
      setError("등록된 파트너 프로필이 없습니다. 입점 신청을 먼저 완료해 주세요.");
      return;
    }

    setProfile(p as PartnerProfile);

    if ((p as PartnerProfile).status === "approved") {
      const [tRes, aRes] = await Promise.all([
        supabase.rpc("rpc_partner_today_leads_same_sido"),
        supabase.rpc("rpc_partner_activity_score"),
      ]);
      const tJson = tRes.data as TodayRpc | null;
      if (tJson?.ok && typeof tJson.count === "number" && tJson.sido) {
        setTodayLine(
          `오늘 ${tJson.sido}에 새 상담 ${tJson.count.toLocaleString("ko-KR")}건 접수됐습니다`,
        );
      } else {
        setTodayLine(null);
      }
      setActivity((aRes.data as ActivityRpc) ?? null);
    } else {
      setTodayLine(null);
      setActivity(null);
    }

    const { data: rpcData, error: rpcErr } = await supabase.rpc(
      "rpc_partner_list_my_leads",
    );
    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }
    const parsed = rpcData as { ok?: boolean; items?: LeadItem[] };
    if (!parsed?.ok) {
      setLeads([]);
      return;
    }
    setLeads(parsed.items ?? []);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!profile || profile.status !== "approved") return;
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [profile]);

  async function unlock(lead: LeadItem) {
    if (!profile) return;
    setBusyLead(lead.lead_id);
    setUnlockHint(null);
    setFeedbackDone(false);
    try {
      const supabase = createBrowserClient();
      const discountActive =
        !profile.is_founder &&
        profile.founder_discount_until != null &&
        new Date(profile.founder_discount_until).getTime() > Date.now();
      const est = getLeadUnlockCharge(lead.situation, {
        founderDiscountActive: discountActive,
      });

      const { data, error: uErr } = await supabase.rpc("rpc_partner_unlock_lead", {
        p_lead_id: lead.lead_id,
      });
      if (uErr) {
        setUnlockHint(uErr.message);
        return;
      }
      const body = data as {
        ok?: boolean;
        error?: string;
        required?: number;
        balance?: number;
        already_unlocked?: boolean;
      };
      if (body?.ok) {
        await refresh();
        setFeedbackLeadId(lead.lead_id);
        setFeedbackText("");
        setFeedbackDone(false);
        return;
      }
      if (body?.error === "insufficient_balance") {
        setUnlockHint(
          `포인트가 부족합니다. 필요 ${(body.required ?? est).toLocaleString("ko-KR")}P / 보유 ${(body.balance ?? profile.points_balance).toLocaleString("ko-KR")}P. 충전·정산은 운영팀에 문의해 주세요.`,
        );
        return;
      }
      setUnlockHint(body?.error ?? "Unlock에 실패했습니다.");
    } finally {
      setBusyLead(null);
    }
  }

  async function submitFeedback() {
    if (!feedbackLeadId) return;
    const msg = feedbackText.trim();
    if (msg.length < 5) {
      setUnlockHint("피드백을 5자 이상 입력해 주세요.");
      return;
    }
    setFeedbackBusy(true);
    setUnlockHint(null);
    try {
      const supabase = createBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setUnlockHint("세션이 만료되었습니다. 다시 로그인해 주세요.");
        return;
      }
      const res = await fetch("/api/partners/unlock-feedback", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leadId: feedbackLeadId, message: msg }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setUnlockHint(j.error ?? "전송에 실패했습니다.");
        return;
      }
      setFeedbackDone(true);
      setFeedbackLeadId(null);
      setFeedbackText("");
    } finally {
      setFeedbackBusy(false);
    }
  }

  if (error && !profile) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  const unlockLabel =
    profile?.is_founder === true
      ? "0P로 리드 정보 확인하기"
      : "리드 정보 확인하기 (포인트 차감)";

  const act = activity?.ok ? activity : null;

  return (
    <div className="space-y-6">
      {profile?.status === "approved" && todayLine ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-950 shadow-sm">
          오늘 내 지역 신규 상담: {todayLine}
        </div>
      ) : null}

      {profile?.status === "approved" ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 shadow-sm">
          <span className="font-semibold">오픈 베타 기간 한정</span>
          {": "}
          파운더스 클럽(선착순 {FOUNDING_PARTNER_MEMBER_CAP}명)은 모든 리드{" "}
          <span className="font-semibold">0P</span>로 열람 가능합니다. 정식 론칭 시
          유료 전환될 수 있습니다.
        </div>
      ) : null}

      {profile ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-neutral-600">
              상태{" "}
              <span className="font-semibold text-neutral-900">{profile.status}</span>
            </p>
            {profile.is_founder ? (
              <>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                  Founding Partner
                </span>
                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                  Founder Pass: Active
                </span>
                <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-bold text-violet-900">
                  무제한 이용권
                </span>
              </>
            ) : null}
            {profile.is_founder ? (
              <p className="text-sm font-semibold text-emerald-800">
                오픈 베타: 리드 열람 0P (내부 포인트는 정식 론칭 대비 잔액으로 보관)
              </p>
            ) : (
              <p className="text-sm text-neutral-600">
                보유 포인트{" "}
                <span className="font-semibold text-brand">
                  {profile.points_balance.toLocaleString("ko-KR")}P
                </span>
              </p>
            )}
          </div>
          {profile.referral_code ? (
            <p className="mt-2 text-xs text-neutral-500">
              내 추천 코드:{" "}
              <span className="font-mono font-semibold text-neutral-900">
                {profile.referral_code}
              </span>
            </p>
          ) : null}
          {profile.status === "approved" && act ? (
            <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50/80 px-3 py-2 text-xs text-violet-950">
              <span className="font-semibold">활동 점수</span>{" "}
              <span className="font-mono text-sm font-bold">
                {typeof act.activity_score === "number"
                  ? act.activity_score.toFixed(1)
                  : "—"}
              </span>
              <span className="mx-2 text-violet-400">|</span>
              응답률{" "}
              {typeof act.response_rate === "number"
                ? `${Math.round(act.response_rate * 100)}%`
                : "—"}
              <span className="mx-2 text-violet-400">|</span>
              수락 {act.total_accepted ?? 0}/{act.total_assigned ?? 0}
              {act.is_limited ? (
                <span className="ml-2 font-semibold text-red-700">
                  · 배정 제한(미응답 누적)
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {profile?.status === "approved" ? <PartnerRechargeRequestForm /> : null}

      {unlockHint ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {unlockHint}
        </div>
      ) : null}

      {feedbackLeadId ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
        >
          <div className="max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 id="feedback-title" className="text-lg font-bold text-neutral-900">
              상담 후 결과 피드백을 남겨주세요
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              오픈 베타 기간 동안 수집된 후기는 서비스 개선 및 마케팅(익명·요약 형태)에
              활용될 수 있습니다.
            </p>
            <textarea
              className="mt-3 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="상담 진행 여부, 고객 니즈, 전환 가능성 등을 남겨 주세요."
            />
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium hover:bg-neutral-50"
                onClick={() => {
                  setFeedbackLeadId(null);
                  setFeedbackText("");
                }}
              >
                나중에
              </button>
              <button
                type="button"
                disabled={feedbackBusy}
                className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-ink hover:bg-brand-light disabled:opacity-50"
                onClick={() => void submitFeedback()}
              >
                {feedbackBusy ? "전송 중…" : "피드백 보내기"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {feedbackDone ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          피드백이 접수되었습니다. 감사합니다.
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-3 py-2">지역</th>
              <th className="px-3 py-2">상황</th>
              <th className="px-3 py-2">등급</th>
              <th className="px-3 py-2">리드 상세도</th>
              <th className="px-3 py-2">만료</th>
              <th className="px-3 py-2">이름</th>
              <th className="px-3 py-2">연락처</th>
              <th className="px-3 py-2">상담 내용</th>
              <th className="px-3 py-2">액션</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr
                key={l.lead_id}
                className={`border-t border-neutral-100 align-top ${
                  l.lead_quality === "premium" ? "bg-amber-50/90" : ""
                }`}
              >
                <td className="px-3 py-2">
                  {l.sido} {l.sigungu}
                </td>
                <td className="px-3 py-2 text-xs text-neutral-800">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{getSituationLabel(l.situation)}</span>
                    {l.situation === "bookkeeping" || l.category === "bookkeeping" ? (
                      <span className="w-fit rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-900">
                        기장 상담
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs">
                  {l.lead_quality === "premium" ? (
                    <span className="font-extrabold text-amber-900">Premium</span>
                  ) : l.lead_quality === "standard" ? (
                    <span className="font-semibold text-neutral-800">Standard</span>
                  ) : l.lead_quality === "basic" ? (
                    <span className="text-neutral-600">Basic</span>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs whitespace-nowrap">
                  {(() => {
                    const d = detailTierLabel(l.detail_tier);
                    return (
                      <span title="상담 내용·기장 필드 충실도(자동)">
                        {d.emoji} {d.text}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-3 py-2 text-xs">
                  {(() => {
                    const ex = expiryLine(l, nowTick);
                    if (!ex) return <span className="text-neutral-400">—</span>;
                    return (
                      <span
                        className={
                          ex.urgent ? "font-semibold text-red-600" : "text-neutral-700"
                        }
                      >
                        {ex.text}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-3 py-2">
                  {l.unlocked ? (
                    <span className="text-neutral-900">{l.name ?? "-"}</span>
                  ) : (
                    <span className="text-neutral-400">잠금</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {l.unlocked ? (
                    <span className="text-neutral-900">{l.phone ?? "-"}</span>
                  ) : (
                    <span className="text-neutral-400">잠금</span>
                  )}
                </td>
                <td className="px-3 py-2 max-w-xs">
                  {l.unlocked ? (
                    <span className="whitespace-pre-wrap text-neutral-800">
                      {l.message ?? "-"}
                    </span>
                  ) : (
                    <span className="text-neutral-400">잠금</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {!l.unlocked && profile?.status === "approved" ? (
                    <button
                      type="button"
                      disabled={busyLead === l.lead_id}
                      onClick={() => void unlock(l)}
                      className="rounded-lg bg-brand px-2 py-1 text-xs font-semibold text-ink hover:bg-brand-light disabled:opacity-50"
                    >
                      {busyLead === l.lead_id ? "처리 중…" : unlockLabel}
                    </button>
                  ) : l.unlocked ? (
                    <span className="text-xs text-emerald-700">열람 완료</span>
                  ) : (
                    <span className="text-xs text-neutral-500">승인 후 가능</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-neutral-500">
            배정된 리드가 없습니다. 승인 후 동일 지역 리드가 자동 배정됩니다.
          </p>
        ) : null}
      </div>
    </div>
  );
}
