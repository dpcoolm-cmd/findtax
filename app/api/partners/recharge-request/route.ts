import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase-service";
import type { Database } from "@/types/database";

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

  const userClient = createClient<Database>(url, anon, {
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

  const requestedAmount = parsePositiveInt(o.requestedAmount);
  const depositorName =
    typeof o.depositorName === "string" ? o.depositorName.trim() : "";
  const partnerMemo =
    typeof o.partnerMemo === "string" ? o.partnerMemo.trim() : null;
  const taxInvoiceCompanyName =
    typeof o.taxInvoiceCompanyName === "string"
      ? o.taxInvoiceCompanyName.trim()
      : "";
  const taxInvoiceBusinessRegNo =
    typeof o.taxInvoiceBusinessRegNo === "string"
      ? o.taxInvoiceBusinessRegNo.trim()
      : "";
  const taxInvoiceEmail =
    typeof o.taxInvoiceEmail === "string" ? o.taxInvoiceEmail.trim() : "";

  if (!requestedAmount) {
    return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
  }
  if (depositorName.length < 2) {
    return NextResponse.json({ error: "invalid_depositor" }, { status: 400 });
  }
  if (taxInvoiceCompanyName.length < 2) {
    return NextResponse.json({ error: "invalid_tax_company" }, { status: 400 });
  }
  if (taxInvoiceBusinessRegNo.length < 5) {
    return NextResponse.json({ error: "invalid_tax_reg_no" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(taxInvoiceEmail)) {
    return NextResponse.json({ error: "invalid_tax_email" }, { status: 400 });
  }

  const svc = createServiceRoleClient();
  if (!svc) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const { data: partner, error: pErr } = await svc
    .from("partners")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (pErr || !partner) {
    return NextResponse.json({ error: "not_partner" }, { status: 403 });
  }
  if (partner.status !== "approved") {
    return NextResponse.json({ error: "not_approved" }, { status: 403 });
  }

  const { data: row, error: insErr } = await svc
    .from("partner_point_recharge_requests")
    .insert({
      partner_id: partner.id,
      requested_amount: requestedAmount,
      depositor_name: depositorName,
      partner_memo: partnerMemo,
      tax_invoice_company_name: taxInvoiceCompanyName,
      tax_invoice_business_reg_no: taxInvoiceBusinessRegNo,
      tax_invoice_email: taxInvoiceEmail,
      status: "pending",
    })
    .select("id")
    .single();

  if (insErr || !row) {
    return NextResponse.json({ error: insErr?.message ?? "insert_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: row.id });
}

function parsePositiveInt(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) {
    const n = Math.floor(v);
    return n > 0 ? n : null;
  }
  if (typeof v === "string" && /^\d+$/.test(v.trim())) {
    const n = Number.parseInt(v.trim(), 10);
    return n > 0 ? n : null;
  }
  return null;
}
