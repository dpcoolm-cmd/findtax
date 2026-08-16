import type { Json } from "@/types/database";
import type {
  VatFilingDecisionInput,
  VatFilingDecisionResult,
} from "@/lib/calculators/vat-filing-decision";
import { calculateVatFilingDecision } from "@/lib/calculators/vat-filing-decision";
import {
  createTaxCaseClient,
  createTaxCaseWriterClient,
} from "@/lib/supabase-service";
import type {
  GuidedCaseType,
  GuidedDocumentDefinition,
  GuidedTaskDefinition,
  TaxCaseRecommendation,
  TaxCaseType,
} from "@/lib/tax-cases/guided-case-definitions";
import {
  VAT_READINESS_RULE_VERSION,
  type VatReadinessAnswers,
  type VatReadinessStatus,
  type VatReadinessTaskKey,
} from "@/lib/tax-cases/vat-readiness";
import type {
  VatCaseDocumentStatus,
  VatFilingMethod,
} from "@/lib/tax-cases/vat-filing-execution";

export type TaxCaseTask = {
  key: string;
  label: string;
  description: string;
  status: VatReadinessStatus;
  weight: number;
  sortOrder: number;
};

export type TaxCaseDocument = {
  key: string;
  label: string;
  description: string;
  reason: string;
  required: boolean;
  status: VatCaseDocumentStatus;
  sortOrder: number;
};

export type TaxCaseView = {
  token: string;
  caseType: TaxCaseType;
  title: string;
  status: "preparing" | "ready" | "completed";
  readinessScore: number;
  complexityScore: number;
  recommendation: TaxCaseRecommendation;
  filingPeriodLabel: string | null;
  filingDeadline: string | null;
  reminderEnabled: boolean;
  reminderDays: number[];
  filingMethod: VatFilingMethod;
  filingCompletedAt: string | null;
  completionOutcome:
    | "filed_self"
    | "filed_professional"
    | "prepared_only"
    | "not_required"
    | null;
  actualTaxAmountWon: number | null;
  completionBlocker:
    | "none"
    | "documents"
    | "hometax"
    | "rules"
    | "expert"
    | null;
  completionNote: string | null;
  feedbackSubmittedAt: string | null;
  nextReviewDate: string | null;
  ruleVersion: string | null;
  context: Record<string, Json | undefined>;
  createdAt: string;
  updatedAt: string;
  tasks: TaxCaseTask[];
  documents: TaxCaseDocument[];
};

export type VatTaxCaseTask = TaxCaseTask & { key: VatReadinessTaskKey };
export type VatTaxCaseDocument = TaxCaseDocument;
export type VatTaxCaseView = TaxCaseView & { caseType: "vat" };

export type CreateVatTaxCaseInput = {
  clientDedupeKey: string;
  sourcePath: string | null;
  decisionInput: VatFilingDecisionInput;
  readinessAnswers: VatReadinessAnswers;
};

export type CreateGuidedTaxCaseInput = {
  clientDedupeKey: string;
  caseType: GuidedCaseType;
  sourcePath: string | null;
  input: Record<string, Json | undefined>;
  result: Record<string, Json | undefined>;
  complexityScore: number;
  recommendation: TaxCaseRecommendation;
  ruleVersion: string;
  filingPeriodLabel: string;
  filingDeadline: string;
  tasks: GuidedTaskDefinition[];
  documents: GuidedDocumentDefinition[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTask(value: unknown): value is TaxCaseTask {
  if (!isRecord(value)) return false;
  return (
    typeof value.key === "string" &&
    /^[a-z0-9_]{1,80}$/.test(value.key) &&
    typeof value.label === "string" &&
    typeof value.description === "string" &&
    ["ready", "not_ready", "unsure"].includes(String(value.status)) &&
    typeof value.weight === "number" &&
    typeof value.sortOrder === "number"
  );
}

function isDocument(value: unknown): value is TaxCaseDocument {
  if (!isRecord(value)) return false;
  return (
    typeof value.key === "string" &&
    typeof value.label === "string" &&
    typeof value.description === "string" &&
    typeof value.reason === "string" &&
    typeof value.required === "boolean" &&
    ["pending", "ready"].includes(String(value.status)) &&
    typeof value.sortOrder === "number"
  );
}

function parseTaxCase(value: Json | null): TaxCaseView | null {
  if (!isRecord(value) || !Array.isArray(value.tasks)) return null;
  const documents = Array.isArray(value.documents) ? value.documents : [];
  const caseType = value.caseType ?? "vat";
  const context = isRecord(value.context)
    ? (value.context as Record<string, Json | undefined>)
    : {};
  if (
    !["vat", "gift", "solo_business", "pension", "seller"].includes(String(caseType)) ||
    typeof value.token !== "string" ||
    typeof value.title !== "string" ||
    !["preparing", "ready", "completed"].includes(String(value.status)) ||
    typeof value.readinessScore !== "number" ||
    typeof value.complexityScore !== "number" ||
    !["self", "review", "tax_accountant"].includes(String(value.recommendation)) ||
    (value.filingPeriodLabel !== null &&
      value.filingPeriodLabel !== undefined &&
      typeof value.filingPeriodLabel !== "string") ||
    (value.filingDeadline !== null &&
      value.filingDeadline !== undefined &&
      typeof value.filingDeadline !== "string") ||
    (value.reminderEnabled !== undefined &&
      typeof value.reminderEnabled !== "boolean") ||
    (value.reminderDays !== undefined &&
      (!Array.isArray(value.reminderDays) ||
        !value.reminderDays.every((day) => typeof day === "number"))) ||
    (value.filingMethod !== undefined &&
      !["undecided", "direct", "professional"].includes(
        String(value.filingMethod),
      )) ||
    (value.filingCompletedAt !== null &&
      value.filingCompletedAt !== undefined &&
      typeof value.filingCompletedAt !== "string") ||
    (value.completionOutcome !== null &&
      value.completionOutcome !== undefined &&
      !["filed_self", "filed_professional", "prepared_only", "not_required"].includes(
        String(value.completionOutcome),
      )) ||
    (value.actualTaxAmountWon !== null &&
      value.actualTaxAmountWon !== undefined &&
      typeof value.actualTaxAmountWon !== "number") ||
    (value.completionBlocker !== null &&
      value.completionBlocker !== undefined &&
      !["none", "documents", "hometax", "rules", "expert"].includes(
        String(value.completionBlocker),
      )) ||
    (value.completionNote !== null &&
      value.completionNote !== undefined &&
      typeof value.completionNote !== "string") ||
    (value.feedbackSubmittedAt !== null &&
      value.feedbackSubmittedAt !== undefined &&
      typeof value.feedbackSubmittedAt !== "string") ||
    (value.nextReviewDate !== null &&
      value.nextReviewDate !== undefined &&
      typeof value.nextReviewDate !== "string") ||
    (value.ruleVersion !== null &&
      value.ruleVersion !== undefined &&
      typeof value.ruleVersion !== "string") ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string" ||
    !value.tasks.every(isTask) ||
    !documents.every(isDocument)
  ) {
    return null;
  }

  return {
    token: value.token,
    caseType: caseType as TaxCaseType,
    title: value.title,
    status: value.status as TaxCaseView["status"],
    readinessScore: value.readinessScore,
    complexityScore: value.complexityScore,
    recommendation: value.recommendation as TaxCaseRecommendation,
    filingPeriodLabel: (value.filingPeriodLabel as string | null) ?? null,
    filingDeadline: (value.filingDeadline as string | null) ?? null,
    reminderEnabled: value.reminderEnabled === true,
    reminderDays: Array.isArray(value.reminderDays)
      ? (value.reminderDays as number[])
      : [7, 3, 1],
    filingMethod: (value.filingMethod as VatFilingMethod) ?? "undecided",
    filingCompletedAt: (value.filingCompletedAt as string | null) ?? null,
    completionOutcome:
      (value.completionOutcome as TaxCaseView["completionOutcome"]) ?? null,
    actualTaxAmountWon: (value.actualTaxAmountWon as number | null) ?? null,
    completionBlocker:
      (value.completionBlocker as TaxCaseView["completionBlocker"]) ?? null,
    completionNote: (value.completionNote as string | null) ?? null,
    feedbackSubmittedAt:
      (value.feedbackSubmittedAt as string | null) ?? null,
    nextReviewDate: (value.nextReviewDate as string | null) ?? null,
    ruleVersion: (value.ruleVersion as string | null) ?? null,
    context,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    tasks: value.tasks,
    documents,
  };
}

export async function getTaxCaseByToken(
  token: string,
): Promise<TaxCaseView | null> {
  const client = createTaxCaseClient();
  if (!client) return null;
  const { data, error } = await client.rpc("api_get_tax_case_v2", {
    p_access_token: token,
  });
  if (error) return null;
  return parseTaxCase(data);
}

export async function getVatTaxCaseByToken(
  token: string,
): Promise<VatTaxCaseView | null> {
  const taxCase = await getTaxCaseByToken(token);
  return taxCase?.caseType === "vat" ? (taxCase as VatTaxCaseView) : null;
}

export async function createVatTaxCase(input: CreateVatTaxCaseInput): Promise<{
  token: string | null;
  created: boolean;
  error: string | null;
  decisionResult: VatFilingDecisionResult;
}> {
  const decisionResult = calculateVatFilingDecision(input.decisionInput);
  const client = createTaxCaseWriterClient();
  if (!client) {
    return {
      token: null,
      created: false,
      error: "supabase_not_configured",
      decisionResult,
    };
  }

  const { data, error } = await client.rpc("api_create_vat_tax_case_v1", {
    p_client_dedupe_key: input.clientDedupeKey,
    p_source_path: input.sourcePath,
    p_decision_input: input.decisionInput as unknown as Json,
    p_readiness_answers: input.readinessAnswers as unknown as Json,
    p_complexity_score: decisionResult.score,
    p_recommendation: decisionResult.recommendation,
    p_rule_version: VAT_READINESS_RULE_VERSION,
  });
  if (error || !isRecord(data) || typeof data.token !== "string") {
    return {
      token: null,
      created: false,
      error: error?.message ?? "case_create_failed",
      decisionResult,
    };
  }

  return {
    token: data.token,
    created: data.created === true,
    error: null,
    decisionResult,
  };
}

export async function createGuidedTaxCase(
  input: CreateGuidedTaxCaseInput,
): Promise<{ token: string | null; created: boolean; error: string | null }> {
  const client = createTaxCaseWriterClient();
  if (!client) {
    return { token: null, created: false, error: "supabase_not_configured" };
  }
  const { data, error } = await client.rpc("api_create_guided_tax_case_v1", {
    p_client_dedupe_key: input.clientDedupeKey,
    p_case_type: input.caseType,
    p_source_path: input.sourcePath,
    p_input_json: input.input as Json,
    p_result_json: input.result as Json,
    p_complexity_score: input.complexityScore,
    p_recommendation: input.recommendation,
    p_rule_version: input.ruleVersion,
    p_filing_period_label: input.filingPeriodLabel,
    p_filing_deadline: input.filingDeadline,
    p_tasks: input.tasks as unknown as Json,
    p_documents: input.documents as unknown as Json,
  });
  if (error || !isRecord(data) || typeof data.token !== "string") {
    return {
      token: null,
      created: false,
      error: error?.message ?? "case_create_failed",
    };
  }
  return {
    token: data.token,
    created: data.created === true,
    error: null,
  };
}

export async function updateTaxCaseTask(
  token: string,
  taskKey: string,
  status: VatReadinessStatus,
): Promise<{ taxCase: TaxCaseView | null; error: string | null }> {
  const client = createTaxCaseClient();
  if (!client) return { taxCase: null, error: "supabase_not_configured" };
  const { data, error } = await client.rpc("api_update_tax_case_task_v2", {
    p_access_token: token,
    p_task_key: taskKey,
    p_status: status,
  });
  if (error) return { taxCase: null, error: error.message };
  const taxCase = parseTaxCase(data);
  return { taxCase, error: taxCase ? null : "case_not_found" };
}

export async function updateTaxCaseDocument(
  token: string,
  documentKey: string,
  status: VatCaseDocumentStatus,
): Promise<{ taxCase: TaxCaseView | null; error: string | null }> {
  const client = createTaxCaseClient();
  if (!client) return { taxCase: null, error: "supabase_not_configured" };
  const { data, error } = await client.rpc("api_update_tax_case_document_v2", {
    p_access_token: token,
    p_document_key: documentKey,
    p_status: status,
  });
  if (error) return { taxCase: null, error: error.message };
  const taxCase = parseTaxCase(data);
  return { taxCase, error: taxCase ? null : "case_not_found" };
}

export async function setTaxCaseFilingMethod(
  token: string,
  filingMethod: Exclude<VatFilingMethod, "undecided">,
): Promise<{ taxCase: TaxCaseView | null; error: string | null }> {
  const client = createTaxCaseClient();
  if (!client) return { taxCase: null, error: "supabase_not_configured" };
  const { data, error } = await client.rpc(
    "api_set_tax_case_filing_method_v2",
    {
      p_access_token: token,
      p_filing_method: filingMethod,
    },
  );
  if (error) return { taxCase: null, error: error.message };
  const taxCase = parseTaxCase(data);
  return { taxCase, error: taxCase ? null : "case_not_found" };
}

export type TaxCaseCompletionFeedback = {
  outcome:
    | "filed_self"
    | "filed_professional"
    | "prepared_only"
    | "not_required";
  actualTaxAmountWon: number | null;
  blocker: "none" | "documents" | "hometax" | "rules" | "expert";
  note: string;
};

export async function completeTaxCase(
  token: string,
  feedback: TaxCaseCompletionFeedback,
): Promise<{ taxCase: TaxCaseView | null; error: string | null }> {
  const client = createTaxCaseClient();
  if (!client) return { taxCase: null, error: "supabase_not_configured" };
  const { data, error } = await client.rpc("api_complete_tax_case_v3", {
    p_access_token: token,
    p_completion_outcome: feedback.outcome,
    p_actual_tax_amount_won: feedback.actualTaxAmountWon,
    p_completion_blocker: feedback.blocker,
    p_completion_note: feedback.note,
  });
  if (error) return { taxCase: null, error: error.message };
  const taxCase = parseTaxCase(data);
  return { taxCase, error: taxCase ? null : "case_not_found" };
}

export async function recordTaxCaseAction(
  token: string,
  action: "hometax_open" | "consultation_open",
): Promise<{ taxCase: TaxCaseView | null; error: string | null }> {
  const client = createTaxCaseClient();
  if (!client) return { taxCase: null, error: "supabase_not_configured" };
  const { data, error } = await client.rpc("api_record_tax_case_action_v2", {
    p_access_token: token,
    p_action: action,
  });
  if (error) return { taxCase: null, error: error.message };
  const taxCase = parseTaxCase(data);
  return { taxCase, error: taxCase ? null : "case_not_found" };
}

export const updateVatTaxCaseTask = updateTaxCaseTask;
export const updateVatTaxCaseDocument = updateTaxCaseDocument;
export const setVatTaxCaseFilingMethod = setTaxCaseFilingMethod;
export const completeVatTaxCase = completeTaxCase;
export const recordVatTaxCaseAction = recordTaxCaseAction;
