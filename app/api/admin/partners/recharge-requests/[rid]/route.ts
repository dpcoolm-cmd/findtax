import { NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/lib/supabase-service";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ rid: string }> },
) {
  const admin = await getAdminUserFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const status = (body as { status?: unknown }).status;
  if (status !== "done" && status !== "cancelled" && status !== "pending") {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const { rid } = await ctx.params;
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("partner_point_recharge_requests")
    .update({ status })
    .eq("id", rid)
    .select("id, status")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
