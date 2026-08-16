import type { TaxCaseView } from "@/lib/tax-cases/server";

const CASE_LABEL: Record<TaxCaseView["caseType"], string> = {
  vat: "부가가치세",
  gift: "증여세",
  solo_business: "1인사업자",
  pension: "연금·IRP",
  seller: "온라인·글로벌 셀러",
};

const RECOMMENDATION_LABEL: Record<TaxCaseView["recommendation"], string> = {
  self: "직접 진행 가능성이 높음",
  review: "제출 전 최종 검토 권장",
  tax_accountant: "전문가 검토 권장",
};

function contextHighlights(taxCase: TaxCaseView): string[] {
  const context = taxCase.context;
  const lines: string[] = [];
  const addWon = (label: string, key: string) => {
    const value = context[key];
    if (typeof value === "number") {
      lines.push(`${label}: ${value.toLocaleString("ko-KR")}원`);
    }
  };
  const addText = (label: string, key: string) => {
    const value = context[key];
    if (typeof value === "string" && value.length <= 160) {
      lines.push(`${label}: ${value}`);
    }
  };

  if (taxCase.caseType === "gift") {
    addWon("관계별 10년 공제 한도", "deductionLimitWon");
    addWon("이번 증여 후 남는 한도", "remainingAfterGiftWon");
    addWon("한도 초과 가능액", "amountOverRemainingLimitWon");
  } else if (taxCase.caseType === "pension") {
    addWon("현재 예상 세금효과", "currentEstimatedTaxBenefitWon");
    addWon("추가 예상 세금효과", "additionalEstimatedTaxBenefitWon");
    addWon("공제 한도까지 남은 금액", "yearlyContributionGapWon");
  } else if (taxCase.caseType === "seller") {
    addText("판단 요약", "decisionSummary");
    const warnings = context.warnings;
    if (Array.isArray(warnings)) {
      warnings.slice(0, 3).forEach((warning) => {
        if (typeof warning === "string") lines.push(`주의: ${warning}`);
      });
    }
  } else if (taxCase.caseType === "solo_business") {
    addText("다음 신고", "nextDeadlineLabel");
    const warnings = context.warnings;
    if (Array.isArray(warnings)) {
      warnings.slice(0, 3).forEach((warning) => {
        if (typeof warning === "string") lines.push(`주의: ${warning}`);
      });
    }
  }
  return lines;
}

export function buildTaxCaseHandoffText(taxCase: TaxCaseView): string {
  const readyTasks = taxCase.tasks.filter((task) => task.status === "ready");
  const pendingTasks = taxCase.tasks.filter((task) => task.status !== "ready");
  const readyDocuments = taxCase.documents.filter(
    (document) => document.status === "ready",
  );
  const pendingDocuments = taxCase.documents.filter(
    (document) => document.status !== "ready",
  );

  const sections = [
    "[FindTax 세무 검토 인계서]",
    `분야: ${CASE_LABEL[taxCase.caseType]}`,
    `판단: ${RECOMMENDATION_LABEL[taxCase.recommendation]}`,
    `준비도: ${taxCase.readinessScore}%`,
    `복잡도: ${taxCase.complexityScore}/100`,
    `진행 방식: ${
      taxCase.filingMethod === "direct"
        ? "직접 진행"
        : taxCase.filingMethod === "professional"
          ? "전문가와 진행"
          : "미정"
    }`,
    taxCase.filingPeriodLabel
      ? `대상 일정: ${taxCase.filingPeriodLabel}`
      : null,
    taxCase.filingDeadline ? `기한: ${taxCase.filingDeadline}` : null,
    taxCase.ruleVersion ? `판단 규칙: ${taxCase.ruleVersion}` : null,
    "",
    "[핵심 진단]",
    ...contextHighlights(taxCase),
    "",
    `[완료한 준비 ${readyTasks.length}/${taxCase.tasks.length}]`,
    ...(readyTasks.length
      ? readyTasks.map((task) => `- ${task.label}`)
      : ["- 아직 없음"]),
    "",
    "[남은 할 일]",
    ...(pendingTasks.length
      ? pendingTasks.map((task) => `- ${task.label}: ${task.description}`)
      : ["- 기본 준비 완료"]),
    "",
    `[준비한 자료 ${readyDocuments.length}/${taxCase.documents.length}]`,
    ...(readyDocuments.length
      ? readyDocuments.map((document) => `- ${document.label}`)
      : ["- 아직 없음"]),
    "",
    "[확인이 필요한 자료]",
    ...(pendingDocuments.length
      ? pendingDocuments.map(
          (document) => `- ${document.label}: ${document.reason}`,
        )
      : ["- 기본 자료 준비 완료"]),
    "",
    "※ 자동 계산·진단 참고자료이며 실제 신고 전 사실관계와 증빙을 확인해야 합니다.",
  ].filter((line): line is string => line !== null);

  return sections.join("\n");
}

export function taxCaseConsultHref(token: string): string {
  return `/consult?case=${encodeURIComponent(token)}`;
}
