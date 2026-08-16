import { NextResponse } from "next/server";
import { isSameOriginMutation } from "@/lib/request-security";
import { completeTaxCase } from "@/lib/tax-cases/server";
import { insertTrackingEvent } from "@/lib/tracking";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OUTCOMES = new Set([
  "filed_self",
  "filed_professional",
  "prepared_only",
  "not_required",
]);
const BLOCKERS = new Set(["none", "documents", "hometax", "rules", "expert"]);

export async function POST(
  req: Request,
  context: { params: Promise<{ token: string }> },
) {
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  const { token } = await context.params;
  if (!UUID_RE.test(token)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const feedback = body as Record<string, unknown>;
  const outcome = typeof feedback.outcome === "string" ? feedback.outcome : "";
  const blocker = typeof feedback.blocker === "string" ? feedback.blocker : "";
  const note = typeof feedback.note === "string" ? feedback.note.trim() : "";
  const actualTaxAmountWon =
    feedback.actualTaxAmountWon === null
      ? null
      : typeof feedback.actualTaxAmountWon === "number" &&
          Number.isInteger(feedback.actualTaxAmountWon)
        ? feedback.actualTaxAmountWon
        : Number.NaN;
  if (
    !OUTCOMES.has(outcome) ||
    !BLOCKERS.has(blocker) ||
    note.length > 300 ||
    (actualTaxAmountWon !== null &&
      (!Number.isFinite(actualTaxAmountWon) ||
        actualTaxAmountWon < 0 ||
        actualTaxAmountWon > 10_000_000_000_000_000))
  ) {
    return NextResponse.json({ error: "invalid_feedback" }, { status: 400 });
  }

  const result = await completeTaxCase(token, {
    outcome: outcome as "filed_self" | "filed_professional" | "prepared_only" | "not_required",
    actualTaxAmountWon,
    blocker: blocker as "none" | "documents" | "hometax" | "rules" | "expert",
    note,
  });
  if (!result.taxCase) {
    return NextResponse.json(
      { error: result.error ?? "completion_failed" },
      { status: result.error?.includes("not_found") ? 404 : 500 },
    );
  }

  void insertTrackingEvent("tax_case_filing_completed", {
    caseType: result.taxCase.caseType,
    filingMethod: result.taxCase.filingMethod,
    recommendation: result.taxCase.recommendation,
    readinessScore: result.taxCase.readinessScore,
    preparedDocuments: result.taxCase.documents.filter(
      (document) => document.status === "ready",
    ).length,
    totalDocuments: result.taxCase.documents.length,
    completionOutcome: result.taxCase.completionOutcome,
    completionBlocker: result.taxCase.completionBlocker,
    actualTaxAmountProvided: result.taxCase.actualTaxAmountWon !== null,
  });

  return NextResponse.json({ taxCase: result.taxCase });
}
