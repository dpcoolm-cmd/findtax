"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";

type WorkflowStatus = "new" | "assigned" | "contacted" | "consulting" | "completed" | "closed";
type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  sido: string;
  sigungu: string;
  situation: string;
  message: string | null;
  business_type: string | null;
  monthly_revenue: string | null;
  lead_quality: string | null;
  workflow_status: WorkflowStatus;
  assigned_partner_id: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};
type Partner = { id: string; office_name: string; representative_name: string | null; sido: string; sigungu: string };
type Assignment = { id: string; lead_id: string; partner_id: string; match_status: string; expires_at: string | null; unlocked_at: string | null };

const STATUS: Record<WorkflowStatus, string> = {
  new: "신규",
  assigned: "배정됨",
  contacted: "연락 완료",
  consulting: "상담 중",
  completed: "상담 완료",
  closed: "종료",
};

function needsAttention(lead: Lead) {
  const age = Date.now() - new Date(lead.updated_at || lead.created_at).getTime();
  if (["new", "assigned"].includes(lead.workflow_status)) return age > 2 * 60 * 60 * 1000;
  if (["contacted", "consulting"].includes(lead.workflow_status)) return age > 24 * 60 * 60 * 1000;
  return false;
}

export function AdminLeadsClient() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<"all" | "attention" | WorkflowStatus>("all");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data } = await createBrowserClient().auth.getSession();
    const token = data.session?.access_token;
    if (!token) return setError("관리자 로그인이 필요합니다.");
    const res = await fetch("/api/admin/leads", { headers: { Authorization: `Bearer ${token}` } });
    const json = (await res.json().catch(() => ({}))) as { leads?: Lead[]; partners?: Partner[]; assignments?: Assignment[]; error?: string };
    if (!res.ok) return setError(json.error ?? "상담 목록을 불러오지 못했습니다.");
    setLeads(json.leads ?? []);
    setPartners(json.partners ?? []);
    setAssignments(json.assignments ?? []);
    setNotes(Object.fromEntries((json.leads ?? []).map((lead) => [lead.id, lead.admin_note ?? ""])));
  }, []);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => ({
    all: leads.length,
    attention: leads.filter(needsAttention).length,
    active: leads.filter((lead) => ["new", "assigned", "contacted", "consulting"].includes(lead.workflow_status)).length,
    completed: leads.filter((lead) => lead.workflow_status === "completed").length,
  }), [leads]);
  const visible = leads.filter((lead) => filter === "all" || (filter === "attention" ? needsAttention(lead) : lead.workflow_status === filter));

  async function save(lead: Lead, workflowStatus: WorkflowStatus, assignedPartnerId = lead.assigned_partner_id) {
    setBusyId(lead.id);
    setError(null);
    try {
      const { data } = await createBrowserClient().auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("관리자 로그인이 필요합니다.");
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, workflowStatus, assignedPartnerId, adminNote: notes[lead.id] ?? "" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "저장하지 못했습니다.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 border-y border-line sm:grid-cols-4">
        {[["전체 접수", counts.all], ["즉시 확인", counts.attention], ["진행 중", counts.active], ["완료", counts.completed]].map(([label, value]) => (
          <div key={label} className="border-b border-r border-line px-4 py-4 last:border-r-0 sm:border-b-0">
            <p className="text-xs font-semibold text-ink-muted">{label}</p><p className="mt-1 text-2xl font-bold text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="flex gap-1 overflow-x-auto">
          {(["all", "attention", "new", "assigned", "contacted", "consulting", "completed", "closed"] as const).map((value) => (
            <button key={value} type="button" onClick={() => setFilter(value)} className={`shrink-0 rounded-md px-3 py-2 text-sm font-semibold ${filter === value ? "bg-primary text-white" : "bg-surface-muted text-ink-muted hover:text-ink"}`}>
              {value === "all" ? "전체" : value === "attention" ? `지연 ${counts.attention}` : STATUS[value]}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => void load()} className="shrink-0 rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-muted">새로고침</button>
      </div>

      {error ? <p role="alert" className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="mt-4 divide-y divide-line border-y border-line">
        {visible.map((lead) => {
          const leadAssignments = assignments.filter((row) => row.lead_id === lead.id);
          const delayed = needsAttention(lead);
          return (
            <article key={lead.id} className="py-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-2 py-1 text-xs font-bold ${delayed ? "bg-red-100 text-red-700" : "bg-surface-muted text-ink-muted"}`}>{delayed ? "대응 지연" : STATUS[lead.workflow_status]}</span>
                    <strong className="text-lg text-ink">{lead.name}</strong>
                    <span className="text-sm text-ink-muted">{lead.sido} {lead.sigungu} · {lead.situation}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <a href={`tel:${lead.phone}`} className="font-semibold text-positive-deep hover:underline">{lead.phone}</a>
                    {lead.email ? <a href={`mailto:${lead.email}`} className="text-positive-deep hover:underline">{lead.email}</a> : null}
                    <span className="text-ink-muted">{new Date(lead.created_at).toLocaleString("ko-KR")}</span>
                  </div>
                  {lead.message ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink">{lead.message}</p> : null}
                  {leadAssignments.length ? <p className="mt-2 text-xs text-ink-muted">자동 배정 {leadAssignments.length}명 · 응답 {leadAssignments.filter((row) => row.match_status === "responded" || row.unlocked_at).length}명</p> : null}
                </div>

                <div className="grid w-full gap-2 lg:w-[360px]">
                  <div className="grid grid-cols-2 gap-2">
                    <select aria-label="처리 상태" value={lead.workflow_status} onChange={(e) => void save(lead, e.target.value as WorkflowStatus)} disabled={busyId === lead.id} className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink">
                      {Object.entries(STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <select aria-label="담당 파트너" value={lead.assigned_partner_id ?? ""} onChange={(e) => void save(lead, e.target.value && lead.workflow_status === "new" ? "assigned" : lead.workflow_status, e.target.value || null)} disabled={busyId === lead.id} className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink">
                      <option value="">담당자 미지정</option>
                      {partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.office_name} · {partner.sido}</option>)}
                    </select>
                  </div>
                  <textarea aria-label="관리자 메모" rows={2} value={notes[lead.id] ?? ""} onChange={(e) => setNotes((prev) => ({ ...prev, [lead.id]: e.target.value }))} placeholder="내부 메모" className="resize-y rounded-md border border-line px-3 py-2 text-sm text-ink" />
                  <button type="button" onClick={() => void save(lead, lead.workflow_status)} disabled={busyId === lead.id} className="rounded-md bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50">{busyId === lead.id ? "저장 중" : "메모 저장"}</button>
                </div>
              </div>
            </article>
          );
        })}
        {!visible.length ? <p className="py-12 text-center text-sm text-ink-muted">해당 조건의 상담 신청이 없습니다.</p> : null}
      </div>
    </div>
  );
}
