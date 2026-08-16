import { NextResponse } from "next/server";
import { isSameOriginMutation } from "@/lib/request-security";
import { recordTaxCaseAction } from "@/lib/tax-cases/server";
import { insertTrackingEvent } from "@/lib/tracking";
import { isBotUserAgent, isLocalRequest } from "@/lib/traffic-quality";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = new Set(["hometax_open", "consultation_open"]);

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
  const action =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>).action
      : null;
  if (typeof action !== "string" || !ACTIONS.has(action)) {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  if (isLocalRequest(req) || isBotUserAgent(req.headers.get("user-agent"))) {
    return NextResponse.json({ ok: true, recorded: false, excluded: true });
  }

  const result = await recordTaxCaseAction(
    token,
    action as "hometax_open" | "consultation_open",
  );
  if (!result.taxCase) {
    return NextResponse.json(
      { error: result.error ?? "record_failed" },
      { status: result.error?.includes("not_found") ? 404 : 500 },
    );
  }

  void insertTrackingEvent(
    action === "hometax_open"
      ? "tax_case_hometax_opened"
      : "tax_case_consultation_opened",
    {
      caseType: result.taxCase.caseType,
      filingMethod: result.taxCase.filingMethod,
      recommendation: result.taxCase.recommendation,
      complexityBand:
        result.taxCase.complexityScore >= 62
          ? "high"
          : result.taxCase.complexityScore >= 34
            ? "mid"
            : "low",
    },
  );

  return NextResponse.json({ ok: true, recorded: true });
}
