import { NextResponse } from "next/server";
import { sendAdminSupportNotification } from "@/lib/email/admin-support";
import { logSubmissionToSheet } from "@/lib/sheets-log";
import { insertTrackingEvent } from "@/lib/tracking";

function requestHostHeader(req: Request): string | null {
  const xf = req.headers.get("x-forwarded-host");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("host");
}

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
  const type = typeof o.type === "string" ? o.type.trim() : "";
  const email = typeof o.email === "string" ? o.email.trim() : "";
  const pageUrl = typeof o.pageUrl === "string" ? o.pageUrl.trim() : "";
  const device = typeof o.device === "string" ? o.device.trim() : "";
  const subject = typeof o.subject === "string" ? o.subject.trim() : "";
  const message = typeof o.message === "string" ? o.message.trim() : "";

  if (!type || !email || !subject || !message) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (subject.length < 4 || message.length < 12) {
    return NextResponse.json({ error: "message_too_short" }, { status: 400 });
  }

  const result = await sendAdminSupportNotification({
    type,
    email,
    pageUrl: pageUrl || null,
    device: device || null,
    subject,
    message,
    requestHost: requestHostHeader(req),
  });

  const trackingError = await insertTrackingEvent("support_request", {
    type,
    email,
    pageUrl: pageUrl || null,
    device: device || null,
    subject,
    message,
    emailSent: result.sent,
    emailError: result.reason ?? null,
  });

  // 구글 시트 적재 (알림은 이미 Resend 관리자 메일이 처리 → alert:false)
  void logSubmissionToSheet("support", {
    type,
    email,
    subject,
    message,
    pageUrl: pageUrl || "",
    device: device || "",
  });

  if (trackingError && !result.sent) {
    return NextResponse.json({ error: result.reason ?? "send_failed" }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      emailSent: result.sent,
      stored: !trackingError,
    },
    { status: 201 },
  );
}
