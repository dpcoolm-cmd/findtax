import { NextResponse } from "next/server";
import { insertTrackingEvent } from "@/lib/tracking";

const ALLOWED = new Set([
  "page_view",
  "phone_click",
  "lead_submit",
  "calculator_cta_click",
  "calculator_result_view",
  "calculator_summary_copy",
  "calculator_link_copy",
  "blog_cta_click",
  "industry_diagnosis_result_view",
  "industry_diagnosis_cta_click",
  "situation_cta_click",
  "situation_page_view",
  "cross_service_click",
  "tax_readiness_started",
  "tax_readiness_completed",
  "tax_case_created",
  "tax_case_task_updated",
  "tax_magic_link_sent",
  "tax_case_claimed",
  "tax_deadline_saved",
]);

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
  const eventType = typeof o.eventType === "string" ? o.eventType : "";
  if (!ALLOWED.has(eventType)) {
    return NextResponse.json({ error: "invalid_event_type" }, { status: 400 });
  }

  const rawPayload = o.payload;
  const payload =
    rawPayload && typeof rawPayload === "object" && !Array.isArray(rawPayload)
      ? (rawPayload as Record<string, unknown>)
      : {};

  try {
    const err = await insertTrackingEvent(eventType, payload);
    if (err) {
      return NextResponse.json({ ok: true, tracked: false, warning: err });
    }
  } catch (error) {
    return NextResponse.json(
      {
        ok: true,
        tracked: false,
        warning: error instanceof Error ? error.message : "track_failed",
      },
      { status: 200 },
    );
  }

  return NextResponse.json({ ok: true, tracked: true });
}
