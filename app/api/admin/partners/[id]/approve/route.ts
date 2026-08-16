import { NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/admin-auth";
import { sendPartnerApprovedEmail } from "@/lib/email/partner-approved";
import { createServiceRoleClient } from "@/lib/supabase-service";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUserFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const { data, error } = await supabase.rpc("rpc_admin_approve_partner", {
    p_partner_id: id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: partnerRow } = await supabase
    .from("partners")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();
  if (partnerRow?.user_id) {
    const { data: u } = await supabase.auth.admin.getUserById(partnerRow.user_id);
    const em = u.user?.email;
    if (em) {
      void sendPartnerApprovedEmail({ to: em }).then((r) => {
        if (!r.sent) console.warn("[approve-partner] email skipped", r.reason);
      });
    }
  }

  return NextResponse.json(data);
}
