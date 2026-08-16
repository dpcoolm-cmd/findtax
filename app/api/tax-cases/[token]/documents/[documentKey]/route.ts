import { NextResponse } from "next/server";
import { isSameOriginMutation } from "@/lib/request-security";
import { updateTaxCaseDocument } from "@/lib/tax-cases/server";
import { isVatCaseDocumentStatus } from "@/lib/tax-cases/vat-filing-execution";
import { insertTrackingEvent } from "@/lib/tracking";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DOCUMENT_KEY_RE = /^[a-z0-9_]{1,80}$/;

export async function PATCH(
  req: Request,
  context: { params: Promise<{ token: string; documentKey: string }> },
) {
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  const { token, documentKey } = await context.params;
  if (!UUID_RE.test(token) || !DOCUMENT_KEY_RE.test(documentKey)) {
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
  if (!isVatCaseDocumentStatus(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const result = await updateTaxCaseDocument(token, documentKey, status);
  if (!result.taxCase) {
    return NextResponse.json(
      { error: result.error ?? "update_failed" },
      { status: result.error?.includes("not_found") ? 404 : 500 },
    );
  }

  void insertTrackingEvent("tax_case_document_updated", {
    caseType: result.taxCase.caseType,
    documentKey,
    documentStatus: status,
    readyDocuments: result.taxCase.documents.filter(
      (document) => document.status === "ready",
    ).length,
    totalDocuments: result.taxCase.documents.length,
  });

  return NextResponse.json({ taxCase: result.taxCase });
}
