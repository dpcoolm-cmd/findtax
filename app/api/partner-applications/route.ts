import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendAdminPartnerApplicationNotification } from "@/lib/email/admin-partner-application";
import { logSubmissionToSheet } from "@/lib/sheets-log";

function requestHostHeader(req: Request): string | null {
  const xf = req.headers.get("x-forwarded-host");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("host");
}

const PLANS = new Set<string>(["FREE", "STANDARD", "PREMIUM"]);
type Plan = "FREE" | "STANDARD" | "PREMIUM";

const ALLOWED_SPECIALTIES = new Set([
  "종합소득세",
  "양도세",
  "법인세",
  "증여세",
  "상속세",
  "세무기장",
  "폐업신고",
  "부가세",
]);

const MAX_BIO = 2000;

function asTrimmedString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;

  const name = asTrimmedString(o.name);
  const office_name = asTrimmedString(o.office_name);
  const phone = asTrimmedString(o.phone);
  const email = asTrimmedString(o.email);
  const address = asTrimmedString(o.address);
  const bioRaw = asTrimmedString(o.bio);
  const planRaw = asTrimmedString(o.plan).toUpperCase();

  if (name.length < 2) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  if (office_name.length < 2) {
    return NextResponse.json({ error: "invalid_office_name" }, { status: 400 });
  }
  if (phone.length < 8) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }
  if (!email.includes("@") || email.length > 200) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (address.length < 4) {
    return NextResponse.json({ error: "invalid_address" }, { status: 400 });
  }
  if (!PLANS.has(planRaw)) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }
  const plan = planRaw as Plan;

  const rawSpecs = o.specialties;
  const specialties: string[] = [];
  if (Array.isArray(rawSpecs)) {
    for (const s of rawSpecs) {
      if (typeof s !== "string") continue;
      const t = s.trim();
      if (ALLOWED_SPECIALTIES.has(t)) specialties.push(t);
    }
  }

  const bio =
    bioRaw.length > MAX_BIO ? bioRaw.slice(0, MAX_BIO) : bioRaw.length > 0 ? bioRaw : null;

  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  // partner_applications는 anon 직접 insert가 막혀 있어 SECURITY DEFINER RPC로 삽입.
  const { error } = await supabase.rpc("rpc_submit_partner_application", {
    p_name: name,
    p_office_name: office_name,
    p_phone: phone,
    p_email: email,
    p_address: address,
    p_specialties: specialties,
    p_plan: plan,
    p_bio: bio,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 관리자 이메일 알림 (그동안 파트너 신청엔 알림이 전혀 없었음)
  const emailResult = await sendAdminPartnerApplicationNotification({
    name,
    officeName: office_name,
    phone,
    email,
    address,
    plan,
    specialties,
    bio,
    requestHost: requestHostHeader(req),
  });
  if (!emailResult.sent) {
    console.warn("[api/partner-applications] admin notify skipped:", emailResult.reason);
  }

  // 구글 시트 적재 (알림은 위 Resend 메일이 처리 → alert:false)
  void logSubmissionToSheet(
    "partner_application",
    { name, office_name, phone, email, address, plan, specialties: specialties.join(", ") },
    { alert: false },
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
