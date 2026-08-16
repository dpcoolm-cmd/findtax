import { NextResponse } from "next/server";
import { sendResultSummaryEmail } from "@/lib/email/result-summary";
import { insertTrackingEvent } from "@/lib/tracking";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const email = typeof o.email === "string" ? o.email.trim() : "";
  const calculatorLabel =
    typeof o.calculatorLabel === "string" ? o.calculatorLabel.trim().slice(0, 60) : "";
  const summary = typeof o.summary === "string" ? o.summary.trim().slice(0, 2000) : "";

  if (!EMAIL_RE.test(email) || email.length > 200) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!calculatorLabel || !summary) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // 수집은 항상 저장 (리타겟 채널) — 발송 실패와 무관하게 남긴다.
  const trackErr = await insertTrackingEvent("result_email_capture", {
    email,
    calculatorLabel,
    summary,
  });

  const sendResult = await sendResultSummaryEmail({ to: email, calculatorLabel, summary });
  if (!sendResult.sent) {
    console.warn("[api/result-email] send skipped:", sendResult.reason);
  }

  if (trackErr && !sendResult.sent) {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true, emailSent: sendResult.sent, stored: !trackErr },
    { status: 201 },
  );
}
