import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-service";

const PLANS = new Set(["starter", "basic", "pro"]);

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const email = typeof o.email === "string" ? o.email.trim() : "";
  const planKey = typeof o.planKey === "string" ? o.planKey.trim().toLowerCase() : "";
  if (!email.includes("@")) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!PLANS.has(planKey)) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const { error } = await supabase.from("partner_pricing_waitlist").insert({
    email,
    plan_key: planKey,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
