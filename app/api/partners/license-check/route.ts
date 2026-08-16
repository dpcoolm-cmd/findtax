import { NextResponse } from "next/server";
import {
  normalizeLicenseNumber,
  validateLicenseFormat,
  type PartnerProfessionalType,
} from "@/lib/partner-license";
import { createServiceRoleClient } from "@/lib/supabase-service";

export async function POST(req: Request) {
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
  const raw = typeof o.license === "string" ? o.license : "";
  const professional =
    o.professional === "tax_advisor" || o.professional === "cpa"
      ? (o.professional as PartnerProfessionalType)
      : null;

  if (!professional) {
    return NextResponse.json({ error: "invalid_professional" }, { status: 400 });
  }

  const fmt = validateLicenseFormat(raw, professional);
  if (!fmt.ok) {
    return NextResponse.json({ formatOk: false, message: fmt.message });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const normalized = normalizeLicenseNumber(raw);
  const { data, error } = await supabase.rpc("rpc_partner_license_available", {
    p_license_normalized: normalized,
    p_professional: professional,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    formatOk: true,
    duplicateOk: data === true,
    normalized,
  });
}
