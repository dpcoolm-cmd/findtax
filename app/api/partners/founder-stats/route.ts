import { FOUNDING_PARTNER_MEMBER_CAP } from "@/config/partner-program";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createServerClient();
  const fallback = { used: 0, cap: FOUNDING_PARTNER_MEMBER_CAP };
  if (!supabase) {
    return NextResponse.json(fallback);
  }
  const { data, error } = await supabase.rpc("rpc_public_founder_stats");
  if (error || !data) {
    return NextResponse.json(fallback);
  }
  return NextResponse.json(data);
}
