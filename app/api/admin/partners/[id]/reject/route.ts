import { NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/lib/supabase-service";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUserFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let reason = "";
  try {
    const body = await req.json();
    if (body && typeof body === "object" && typeof body.reason === "string") {
      reason = body.reason;
    }
  } catch {
    /* optional body */
  }

  const { id } = await ctx.params;
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const { data, error } = await supabase.rpc("rpc_admin_reject_partner", {
    p_partner_id: id,
    p_reason: reason || "관리자 반려",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
