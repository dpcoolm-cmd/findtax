import { NextResponse } from "next/server";
import { isSameOriginMutation } from "@/lib/request-security";
import { updateTaxCaseTask } from "@/lib/tax-cases/server";
import { isVatReadinessStatus } from "@/lib/tax-cases/vat-readiness";
import { insertTrackingEvent } from "@/lib/tracking";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TASK_KEY_RE = /^[a-z0-9_]{1,80}$/;

export async function PATCH(
  req: Request,
  context: { params: Promise<{ token: string; taskKey: string }> },
) {
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  const { token, taskKey } = await context.params;
  if (!UUID_RE.test(token) || !TASK_KEY_RE.test(taskKey)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const status =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>).status
      : null;
  if (!isVatReadinessStatus(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const result = await updateTaxCaseTask(token, taskKey, status);
  if (!result.taxCase) {
    const responseStatus =
      result.error === "case_not_found" || result.error === "case_expired" ? 404 : 500;
    return NextResponse.json({ error: result.error ?? "update_failed" }, { status: responseStatus });
  }

  void insertTrackingEvent("tax_case_task_updated", {
    caseType: result.taxCase.caseType,
    taskKey,
    taskStatus: status,
    readinessScore: result.taxCase.readinessScore,
  });

  return NextResponse.json({ taxCase: result.taxCase });
}
