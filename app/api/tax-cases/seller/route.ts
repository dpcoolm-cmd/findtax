import { NextResponse } from "next/server";
import type { Json } from "@/types/database";
import {
  checkRequestRateLimit,
  isSameOriginMutation,
} from "@/lib/request-security";
import {
  sellerCaseDocuments,
  sellerCaseTasks,
} from "@/lib/tax-cases/guided-case-definitions";
import {
  assessSellerTax,
  SELLER_TAX_RULE_VERSION,
  type SellerTaxInput,
} from "@/lib/tax-cases/seller-case";
import { createGuidedTaxCase } from "@/lib/tax-cases/server";
import { insertTrackingEvent } from "@/lib/tracking";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROFILES = new Set(["smartstore", "purchase_agency", "reverse_export"]);
const BUSINESS_STATUS = new Set(["registered", "not_registered", "unsure"]);
const VAT_STATUS = new Set(["general", "simplified", "exempt", "unsure"]);

function parseInput(value: unknown): SellerTaxInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (
    !PROFILES.has(String(input.profile)) ||
    !BUSINESS_STATUS.has(String(input.businessStatus)) ||
    !VAT_STATUS.has(String(input.vatStatus))
  ) {
    return null;
  }
  const boundedIntegers = [
    ["annualRevenueWon", 0, 10_000_000_000_000_000],
    ["monthlyOrderCount", 0, 10_000_000],
    ["platformCount", 1, 100],
    ["settlementCurrencyCount", 1, 100],
  ] as const;
  if (
    boundedIntegers.some(([key, min, max]) => {
      const current = input[key];
      return (
        typeof current !== "number" ||
        !Number.isInteger(current) ||
        current < min ||
        current > max
      );
    })
  ) {
    return null;
  }
  const booleans = [
    "hasEmployees",
    "usesFulfillmentAbroad",
    "hasExportEvidence",
    "grossSalesSeparated",
    "hasMonthlySettlementRoutine",
    "hasExpenseEvidence",
  ] as const;
  if (booleans.some((key) => typeof input[key] !== "boolean")) return null;
  return input as unknown as SellerTaxInput;
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const rateLimit = checkRequestRateLimit(request, "tax-case-create");
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "too_many_requests" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const input = parseInput(record.input);
  const clientDedupeKey =
    typeof record.clientDedupeKey === "string" ? record.clientDedupeKey : "";
  const sourcePath =
    typeof record.sourcePath === "string"
      ? record.sourcePath.slice(0, 300)
      : null;
  if (!input || !UUID_RE.test(clientDedupeKey)) {
    return NextResponse.json({ error: "invalid_fields" }, { status: 400 });
  }

  const assessment = assessSellerTax(input);
  const result = await createGuidedTaxCase({
    clientDedupeKey,
    caseType: "seller",
    sourcePath,
    input: input as unknown as Record<string, Json>,
    result: assessment as unknown as Record<string, Json>,
    complexityScore: assessment.complexityScore,
    recommendation: assessment.recommendation,
    ruleVersion: SELLER_TAX_RULE_VERSION,
    filingPeriodLabel: assessment.nextDeadlineLabel,
    filingDeadline: assessment.nextDeadline,
    tasks: sellerCaseTasks(input),
    documents: sellerCaseDocuments(input),
  });
  if (!result.token) {
    return NextResponse.json(
      { error: result.error ?? "case_create_failed" },
      { status: 500 },
    );
  }

  if (result.created) {
    void insertTrackingEvent("tax_case_created", {
      caseType: "seller",
      sellerProfile: input.profile,
      complexityScore: assessment.complexityScore,
      recommendation: assessment.recommendation,
      sourcePath,
    });
  }

  return NextResponse.json(
    { token: result.token, created: result.created, assessment },
    { status: result.created ? 201 : 200 },
  );
}
