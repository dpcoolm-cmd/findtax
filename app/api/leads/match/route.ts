import { NextResponse } from "next/server";
import { notifyAssignedPartnersForLead } from "@/lib/lead-assignment-notify";

/**
 * 배정 알림만 재전송(매칭은 DB 트리거에서 처리).
 * Authorization: Bearer CRON_SECRET
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || auth !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const leadId = typeof o.leadId === "string" ? o.leadId : "";
  if (!leadId) {
    return NextResponse.json({ error: "missing_lead_id" }, { status: 400 });
  }

  await notifyAssignedPartnersForLead(leadId);
  return NextResponse.json({ ok: true });
}
