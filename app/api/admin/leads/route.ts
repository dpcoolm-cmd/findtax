import { NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/admin-auth";
import { notifyAssignedPartnersForLead } from "@/lib/lead-assignment-notify";
import { createServiceRoleClient } from "@/lib/supabase-service";

const WORKFLOW_STATUSES = [
  "new",
  "assigned",
  "contacted",
  "consulting",
  "completed",
  "closed",
] as const;
type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

function isWorkflowStatus(value: unknown): value is WorkflowStatus {
  return typeof value === "string" && WORKFLOW_STATUSES.includes(value as WorkflowStatus);
}

export async function GET(req: Request) {
  if (!(await getAdminUserFromRequest(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });

  const [{ data: leads, error: leadsError }, { data: partners, error: partnersError }] = await Promise.all([
    supabase
      .from("leads")
      .select("id,name,phone,email,sido,sigungu,situation,message,category,business_type,monthly_revenue,industry,lead_quality,status,workflow_status,assigned_partner_id,admin_note,created_at,updated_at,contacted_at,completed_at,closed_at")
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("partners")
      .select("id,office_name,representative_name,sido,sigungu,specialties,status")
      .eq("status", "approved")
      .order("office_name", { ascending: true }),
  ]);
  if (leadsError || partnersError) {
    return NextResponse.json({ error: leadsError?.message ?? partnersError?.message }, { status: 500 });
  }

  const leadIds = (leads ?? []).map((lead) => lead.id);
  const { data: assignments, error: assignmentsError } = leadIds.length
    ? await supabase
        .from("lead_partner_assignments")
        .select("id,lead_id,partner_id,match_status,expires_at,unlocked_at,created_at")
        .in("lead_id", leadIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };
  if (assignmentsError) {
    return NextResponse.json({ error: assignmentsError.message }, { status: 500 });
  }

  return NextResponse.json({ leads: leads ?? [], partners: partners ?? [], assignments: assignments ?? [] });
}

export async function PATCH(req: Request) {
  if (!(await getAdminUserFromRequest(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });

  const body = (await req.json().catch(() => null)) as {
    leadId?: unknown;
    workflowStatus?: unknown;
    assignedPartnerId?: unknown;
    adminNote?: unknown;
  } | null;
  if (!body || typeof body.leadId !== "string" || !isWorkflowStatus(body.workflowStatus)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const assignedPartnerId = typeof body.assignedPartnerId === "string" && body.assignedPartnerId ? body.assignedPartnerId : null;
  const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim().slice(0, 2000) || null : null;
  const now = new Date().toISOString();
  const legacyStatus = ["contacted", "consulting"].includes(body.workflowStatus)
    ? "contacted"
    : ["completed", "closed"].includes(body.workflowStatus)
      ? "closed"
      : "new";

  const { data: currentLead } = await supabase
    .from("leads")
    .select("contacted_at,completed_at,closed_at")
    .eq("id", body.leadId)
    .maybeSingle();

  const update = {
    workflow_status: body.workflowStatus,
    status: legacyStatus as "new" | "contacted" | "closed",
    assigned_partner_id: assignedPartnerId,
    admin_note: adminNote,
    contacted_at: ["contacted", "consulting", "completed"].includes(body.workflowStatus)
      ? currentLead?.contacted_at ?? now
      : currentLead?.contacted_at ?? null,
    completed_at: body.workflowStatus === "completed"
      ? currentLead?.completed_at ?? now
      : currentLead?.completed_at ?? null,
    closed_at: body.workflowStatus === "closed"
      ? currentLead?.closed_at ?? now
      : currentLead?.closed_at ?? null,
  };

  const { data: lead, error } = await supabase
    .from("leads")
    .update(update)
    .eq("id", body.leadId)
    .select("id,workflow_status,assigned_partner_id,updated_at")
    .maybeSingle();
  if (error || !lead) {
    return NextResponse.json({ error: error?.message ?? "lead_not_found" }, { status: error ? 500 : 404 });
  }

  let assignmentCreated = false;
  if (assignedPartnerId) {
    const { data: existing } = await supabase
      .from("lead_partner_assignments")
      .select("id")
      .eq("lead_id", body.leadId)
      .eq("partner_id", assignedPartnerId)
      .maybeSingle();
    if (!existing) {
      const { error: assignmentError } = await supabase.from("lead_partner_assignments").insert({
        lead_id: body.leadId,
        partner_id: assignedPartnerId,
        match_status: "pending",
        assigned_score: 10000,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      if (assignmentError) {
        return NextResponse.json({ error: assignmentError.message }, { status: 500 });
      }
      assignmentCreated = true;
    }
  }
  if (assignmentCreated) void notifyAssignedPartnersForLead(body.leadId);

  return NextResponse.json({ lead });
}
