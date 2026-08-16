import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const revalidate = 3600;

export async function GET() {
  const fallback = {
    calcUses30d: null as number | null,
    leadsTotal: null as number | null,
    accountantsTotal: null as number | null,
    partnersApproved: null as number | null,
  };

  const client = createServerClient();
  if (!client) return NextResponse.json(fallback);

  const { data, error } = await client.rpc("rpc_public_site_stats");
  if (error || !data || typeof data !== "object") {
    return NextResponse.json(fallback);
  }

  const o = data as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

  return NextResponse.json(
    {
      calcUses30d: num(o.calc_uses_30d),
      leadsTotal: num(o.leads_total),
      accountantsTotal: num(o.accountants_total),
      partnersApproved: num(o.partners_approved),
    },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" } },
  );
}
