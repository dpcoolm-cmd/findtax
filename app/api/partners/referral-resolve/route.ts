import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-service";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = (url.searchParams.get("code") ?? "").trim();
  if (!code) {
    return NextResponse.json({ referrerPartnerId: null });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("partners")
    .select("id")
    .eq("referral_code", code)
    .eq("status", "approved")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ referrerPartnerId: data?.id ?? null });
}
