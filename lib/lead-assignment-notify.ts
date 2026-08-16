import { createServiceRoleClient } from "@/lib/supabase-service";
import { sendPartnerLeadAssignedEmail } from "@/lib/email/partner-lead-assigned";

/**
 * 리드 생성 후 배정된 파트너(최대 3명)에게 알림 메일.
 * Service role로 partner.user_id → auth 이메일 조회.
 */
export async function notifyAssignedPartnersForLead(leadId: string): Promise<void> {
  const admin = createServiceRoleClient();
  if (!admin) {
    console.warn("[lead-assignment-notify] no service role client");
    return;
  }

  const { data: lead, error: lErr } = await admin
    .from("leads")
    .select("id, sido, sigungu, situation, lead_quality")
    .eq("id", leadId)
    .maybeSingle();

  if (lErr || !lead) {
    console.warn("[lead-assignment-notify] lead fetch", lErr?.message);
    return;
  }

  const { data: rows, error: aErr } = await admin
    .from("lead_partner_assignments")
    .select("partner_id, match_status")
    .eq("lead_id", leadId);

  if (aErr || !rows?.length) {
    console.warn("[lead-assignment-notify] assignments", aErr?.message);
    return;
  }

  for (const row of rows) {
    if (row.match_status === "expired") continue;
    const { data: partner, error: pErr } = await admin
      .from("partners")
      .select("user_id")
      .eq("id", row.partner_id)
      .maybeSingle();
    if (pErr || !partner?.user_id) continue;

    const { data: userData, error: uErr } = await admin.auth.admin.getUserById(
      partner.user_id,
    );
    if (uErr || !userData.user?.email) continue;

    const r = await sendPartnerLeadAssignedEmail({
      to: userData.user.email,
      leadId: lead.id,
      sido: lead.sido,
      sigungu: lead.sigungu,
      situation: lead.situation,
      leadQuality: lead.lead_quality ?? null,
    });
    if (!r.sent) {
      console.warn("[lead-assignment-notify] email skip", userData.user.email, r.reason);
    }
  }
}
