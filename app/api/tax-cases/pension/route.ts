import { NextResponse } from "next/server";
import type { Json } from "@/types/database";
import {
  checkRequestRateLimit,
  isSameOriginMutation,
} from "@/lib/request-security";
import {
  calculateYearEndTaxOptimization,
  type PensionTaxpayerType,
  type YearEndTaxOptimizationInput,
} from "@/lib/calculators/year-end-tax-optimization";
import {
  pensionCaseDocuments,
  pensionCaseTasks,
} from "@/lib/tax-cases/guided-case-definitions";
import { createGuidedTaxCase } from "@/lib/tax-cases/server";
import { insertTrackingEvent } from "@/lib/tracking";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TAXPAYER_TYPES = new Set<PensionTaxpayerType>([
  "employee",
  "business",
  "mixed",
]);
const MONEY_KEYS = [
  "annualSalaryWon",
  "comprehensiveIncomeWon",
  "pensionSavingsPaidWon",
  "irpPaidWon",
  "isaMaturityTransferWon",
  "extraBudgetWon",
] as const;

function parseInput(value: unknown): YearEndTaxOptimizationInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (!TAXPAYER_TYPES.has(input.taxpayerType as PensionTaxpayerType)) return null;
  if (
    MONEY_KEYS.some(
      (key) =>
        typeof input[key] !== "number" ||
        !Number.isFinite(input[key]) ||
        Number(input[key]) < 0 ||
        Number(input[key]) > 10_000_000_000_000_000,
    ) ||
    typeof input.emergencyFundMonths !== "number" ||
    !Number.isFinite(input.emergencyFundMonths) ||
    input.emergencyFundMonths < 0 ||
    input.emergencyFundMonths > 120
  ) {
    return null;
  }
  const booleans = [
    "needsMoneyWithinYear",
    "hasCheckedContributionStatements",
    "hasIncomeStatement",
  ] as const;
  if (booleans.some((key) => typeof input[key] !== "boolean")) return null;
  return input as unknown as YearEndTaxOptimizationInput;
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
    typeof record.sourcePath === "string" ? record.sourcePath.slice(0, 300) : null;
  if (!input || !UUID_RE.test(clientDedupeKey)) {
    return NextResponse.json({ error: "invalid_fields" }, { status: 400 });
  }

  const assessment = calculateYearEndTaxOptimization(input);
  const created = await createGuidedTaxCase({
    clientDedupeKey,
    caseType: "pension",
    sourcePath,
    input: input as unknown as Record<string, Json>,
    result: assessment as unknown as Record<string, Json>,
    complexityScore: assessment.complexityScore,
    recommendation: assessment.recommendation,
    ruleVersion: assessment.ruleVersion,
    filingPeriodLabel: assessment.filingPeriodLabel,
    filingDeadline: assessment.filingDeadline,
    tasks: pensionCaseTasks(input),
    documents: pensionCaseDocuments(input),
  });
  if (!created.token) {
    return NextResponse.json(
      { error: created.error ?? "case_create_failed" },
      { status: 500 },
    );
  }
  if (created.created) {
    void insertTrackingEvent("tax_case_created", {
      caseType: "pension",
      complexityScore: assessment.complexityScore,
      recommendation: assessment.recommendation,
      strategy: assessment.strategy,
      cashFlowStatus: assessment.cashFlowStatus,
      sourcePath,
    });
  }
  return NextResponse.json(
    { token: created.token, created: created.created, assessment },
    { status: created.created ? 201 : 200 },
  );
}
