import type { Json } from "@/types/database";
import type { TaxCaseType } from "@/lib/tax-cases/guided-case-definitions";

export type MyTaxCaseSummary = {
  token: string;
  caseType: TaxCaseType;
  title: string;
  status: "preparing" | "ready" | "completed";
  readinessScore: number;
  complexityScore: number;
  recommendation: "self" | "review" | "tax_accountant";
  filingPeriodLabel: string | null;
  filingDeadline: string | null;
  reminderEnabled: boolean;
  completionOutcome:
    | "filed_self"
    | "filed_professional"
    | "prepared_only"
    | "not_required"
    | null;
  actualTaxAmountWon: number | null;
  nextReviewDate: string | null;
  createdAt: string;
  updatedAt: string;
  nextTask: {
    key: string;
    label: string;
    description: string;
  } | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCase(value: unknown): MyTaxCaseSummary | null {
  if (!isRecord(value)) return null;
  const nextTask = value.nextTask;
  if (
    typeof value.token !== "string" ||
    !["vat", "gift", "solo_business", "pension", "seller"].includes(String(value.caseType)) ||
    typeof value.title !== "string" ||
    !["preparing", "ready", "completed"].includes(String(value.status)) ||
    typeof value.readinessScore !== "number" ||
    typeof value.complexityScore !== "number" ||
    !["self", "review", "tax_accountant"].includes(String(value.recommendation)) ||
    (value.filingPeriodLabel !== null && typeof value.filingPeriodLabel !== "string") ||
    (value.filingDeadline !== null && typeof value.filingDeadline !== "string") ||
    typeof value.reminderEnabled !== "boolean" ||
    (value.completionOutcome !== null &&
      value.completionOutcome !== undefined &&
      !["filed_self", "filed_professional", "prepared_only", "not_required"].includes(
        String(value.completionOutcome),
      )) ||
    (value.actualTaxAmountWon !== null &&
      value.actualTaxAmountWon !== undefined &&
      typeof value.actualTaxAmountWon !== "number") ||
    (value.nextReviewDate !== null &&
      value.nextReviewDate !== undefined &&
      typeof value.nextReviewDate !== "string") ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string" ||
    (nextTask !== null &&
      (!isRecord(nextTask) ||
        typeof nextTask.key !== "string" ||
        typeof nextTask.label !== "string" ||
        typeof nextTask.description !== "string"))
  ) {
    return null;
  }

  return {
    token: value.token,
    caseType: value.caseType as TaxCaseType,
    title: value.title,
    status: value.status as MyTaxCaseSummary["status"],
    readinessScore: value.readinessScore,
    complexityScore: value.complexityScore,
    recommendation: value.recommendation as MyTaxCaseSummary["recommendation"],
    filingPeriodLabel: value.filingPeriodLabel as string | null,
    filingDeadline: value.filingDeadline as string | null,
    reminderEnabled: value.reminderEnabled,
    completionOutcome:
      (value.completionOutcome as MyTaxCaseSummary["completionOutcome"]) ?? null,
    actualTaxAmountWon: (value.actualTaxAmountWon as number | null) ?? null,
    nextReviewDate: (value.nextReviewDate as string | null) ?? null,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    nextTask: nextTask as MyTaxCaseSummary["nextTask"],
  };
}

export function parseMyTaxCases(value: Json | null): MyTaxCaseSummary[] {
  if (!Array.isArray(value)) return [];
  return value.map(parseCase).filter((item): item is MyTaxCaseSummary => item !== null);
}
