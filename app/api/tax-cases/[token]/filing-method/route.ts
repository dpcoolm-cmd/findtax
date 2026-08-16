import { NextResponse } from "next/server";
import { isSameOriginMutation } from "@/lib/request-security";
import { setTaxCaseFilingMethod } from "@/lib/tax-cases/server";
import { isVatFilingMethod } from "@/lib/tax-cases/vat-filing-execution";
import { insertTrackingEvent } from "@/lib/tracking";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(
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
  const filingMethod =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>).filingMethod
      : null;
  if (!isVatFilingMethod(filingMethod)) {
    return NextResponse.json({ error: "invalid_filing_method" }, { status: 400 });
  }

  const result = await setTaxCaseFilingMethod(token, filingMethod);
  if (!result.taxCase) {
    return NextResponse.json(
      { error: result.error ?? "update_failed" },
      { status: result.error?.includes("not_found") ? 404 : 500 },
    );
  }

  void insertTrackingEvent("tax_case_filing_method_selected", {
    caseType: result.taxCase.caseType,
    filingMethod,
    recommendation: result.taxCase.recommendation,
  });

  return NextResponse.json({ taxCase: result.taxCase });
}
