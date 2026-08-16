import { NextResponse } from "next/server";
import type { VatFilingDecisionInput } from "@/lib/calculators/vat-filing-decision";
import {
  checkRequestRateLimit,
  isSameOriginMutation,
} from "@/lib/request-security";
import { createVatTaxCase } from "@/lib/tax-cases/server";
import { isVatReadinessAnswers } from "@/lib/tax-cases/vat-readiness";
import { calculateVatReadiness } from "@/lib/tax-cases/vat-readiness";
import { insertTrackingEvent } from "@/lib/tracking";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TAXPAYER_TYPES = new Set(["unknown", "simplified", "general"]);

function isBoundedNumber(value: unknown, max: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max;
}

function parseDecisionInput(value: unknown): VatFilingDecisionInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (!TAXPAYER_TYPES.has(String(input.taxpayerType))) return null;
  if (!isBoundedNumber(input.annualRevenueWon, 1_000_000_000_000_000)) return null;
  if (!isBoundedNumber(input.monthlySalesDocs, 1_000_000)) return null;
  if (!isBoundedNumber(input.monthlyPurchaseDocs, 1_000_000)) return null;
  const booleanKeys = [
    "hasEmployees",
    "hasPaperOrCashData",
    "hasOnlineMarketplace",
    "hasCrossBorderSales",
    "isNearDeadline",
  ] as const;
  if (booleanKeys.some((key) => typeof input[key] !== "boolean")) return null;

  return {
    taxpayerType: input.taxpayerType as VatFilingDecisionInput["taxpayerType"],
    annualRevenueWon: input.annualRevenueWon as number,
    monthlySalesDocs: input.monthlySalesDocs as number,
    monthlyPurchaseDocs: input.monthlyPurchaseDocs as number,
    hasEmployees: input.hasEmployees as boolean,
    hasPaperOrCashData: input.hasPaperOrCashData as boolean,
    hasOnlineMarketplace: input.hasOnlineMarketplace as boolean,
    hasCrossBorderSales: input.hasCrossBorderSales as boolean,
    isNearDeadline: input.isNearDeadline as boolean,
  };
}

export async function POST(req: Request) {
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const rateLimit = checkRequestRateLimit(req, "tax-case-create");
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
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const clientDedupeKey =
    typeof input.clientDedupeKey === "string" ? input.clientDedupeKey : "";
  const decisionInput = parseDecisionInput(input.decisionInput);
  const readinessAnswers = input.readinessAnswers;
  const sourcePath =
    typeof input.sourcePath === "string" ? input.sourcePath.slice(0, 300) : null;

  if (!UUID_RE.test(clientDedupeKey) || !decisionInput || !isVatReadinessAnswers(readinessAnswers)) {
    return NextResponse.json({ error: "invalid_fields" }, { status: 400 });
  }

  const result = await createVatTaxCase({
    clientDedupeKey,
    sourcePath,
    decisionInput,
    readinessAnswers,
  });
  if (!result.token) {
    return NextResponse.json({ error: result.error ?? "case_create_failed" }, { status: 500 });
  }

  if (result.created) {
    const readiness = calculateVatReadiness(readinessAnswers);
    void insertTrackingEvent("tax_case_created", {
      caseType: "vat",
      readinessScore: readiness.score,
      complexityScore: result.decisionResult.score,
      recommendation: result.decisionResult.recommendation,
      sourcePath,
    });
  }

  return NextResponse.json(
    { token: result.token, created: result.created },
    { status: result.created ? 201 : 200 },
  );
}
