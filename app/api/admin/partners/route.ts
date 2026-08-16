import { NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/lib/supabase-service";

export async function GET(req: Request) {
  const admin = await getAdminUserFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const { data: partners, error } = await supabase
    .from("partners")
    .select(
      `
      id,
      user_id,
      professional_type,
      license_display,
      office_name,
      representative_name,
      sido,
      sigungu,
      specialties,
      status,
      points_balance,
      is_founder,
      referrer_partner_id,
      created_at,
      partner_documents ( id, doc_type, storage_path )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ partners: partners ?? [] });
}
