import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Json } from "@/types/database";
import { createServiceRoleClient } from "@/lib/supabase-service";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const user = userData.user;
  if (userErr || !user?.id) {
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
  const o = body as Record<string, unknown>;
  const leadId = typeof o.leadId === "string" ? o.leadId : "";
  const message = typeof o.message === "string" ? o.message.trim() : "";
  if (!leadId) {
    return NextResponse.json({ error: "missing_lead" }, { status: 400 });
  }
  if (message.length < 5) {
    return NextResponse.json({ error: "message_too_short" }, { status: 400 });
  }

  const svc = createServiceRoleClient();
  if (!svc) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const { data: partner, error: pErr } = await svc
    .from("partners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (pErr || !partner) {
    return NextResponse.json({ error: "not_partner" }, { status: 403 });
  }

  const { data: row, error: aErr } = await svc
    .from("lead_partner_assignments")
    .select("id, unlocked_at")
    .eq("partner_id", partner.id)
    .eq("lead_id", leadId)
    .maybeSingle();

  if (aErr || !row?.unlocked_at) {
    return NextResponse.json({ error: "not_unlocked" }, { status: 403 });
  }

  const payload: Json = {
    lead_id: leadId,
    partner_id: partner.id,
    message,
    user_email: user.email ?? null,
    created_via: "post_unlock_feedback",
  };

  const { error: insErr } = await svc.from("tracking_events").insert({
    event_type: "partner_post_unlock_feedback",
    payload,
  });

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
