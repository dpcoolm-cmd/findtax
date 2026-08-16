export const VAT_READINESS_RULE_VERSION = "vat-readiness-v1-2026-07-23";

export type VatReadinessStatus = "ready" | "not_ready" | "unsure";
export type VatReadinessTaskKey = "sales" | "purchases" | "exceptions" | "deadline";

export type VatReadinessAnswers = Record<VatReadinessTaskKey, VatReadinessStatus>;

export const VAT_READINESS_TASKS: ReadonlyArray<{
  key: VatReadinessTaskKey;
  question: string;
  label: string;
  description: string;
  weight: number;
}> = [
  {
    key: "sales",
    question: "매출자료를 모았나요?",
    label: "매출자료 모으기",
    description: "카드·현금영수증·세금계산서와 플랫폼 정산자료를 한곳에 모으세요.",
    weight: 30,
  },
  {
    key: "purchases",
    question: "매입 영수증·세금계산서를 모았나요?",
    label: "매입자료 모으기",
    description: "공제받을 영수증과 매입 세금계산서가 빠지지 않았는지 확인하세요.",
    weight: 30,
  },
  {
    key: "exceptions",
    question: "취소·환불·현금·해외매출을 확인했나요?",
    label: "예외 매출 확인하기",
    description: "자동 자료에서 빠지거나 중복되기 쉬운 거래를 실제 정산자료와 맞춰보세요.",
    weight: 25,
  },
  {
    key: "deadline",
    question: "신고할 사람과 마감일을 정했나요?",
    label: "신고 일정 정하기",
    description: "직접 신고할지 검토를 맡길지 정하고 신고 마감일을 확인하세요.",
    weight: 15,
  },
] as const;

export function emptyVatReadinessAnswers(): VatReadinessAnswers {
  return {
    sales: "unsure",
    purchases: "unsure",
    exceptions: "unsure",
    deadline: "unsure",
  };
}

export function calculateVatReadiness(answers: VatReadinessAnswers) {
  const score = VAT_READINESS_TASKS.reduce(
    (total, task) => total + (answers[task.key] === "ready" ? task.weight : 0),
    0,
  );
  const pending = VAT_READINESS_TASKS.filter((task) => answers[task.key] !== "ready");

  return {
    score,
    status: score >= 85 ? ("ready" as const) : ("preparing" as const),
    pending,
    nextAction: pending[0] ?? null,
  };
}

export function isVatReadinessStatus(value: unknown): value is VatReadinessStatus {
  return value === "ready" || value === "not_ready" || value === "unsure";
}

export function isVatReadinessAnswers(value: unknown): value is VatReadinessAnswers {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const answers = value as Record<string, unknown>;
  return VAT_READINESS_TASKS.every((task) => isVatReadinessStatus(answers[task.key]));
}
