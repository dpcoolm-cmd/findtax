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

  const { data, error } = await supabase
    .from("partner_point_recharge_requests")
    .select(
      `
      id,
      partner_id,
      requested_amount,
      depositor_name,
      partner_memo,
      tax_invoice_company_name,
      tax_invoice_business_reg_no,
      tax_invoice_email,
      status,
      created_at,
      partners ( office_name, sido, sigungu, license_display )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data ?? [] });
}
