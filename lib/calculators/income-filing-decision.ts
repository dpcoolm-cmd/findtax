export type IncomeFilingSource =
  | "employment_only"
  | "freelance"
  | "business"
  | "side_hustle"
  | "rental"
  | "mixed";

export type IncomeFilingRecommendation = "self" | "review" | "tax_accountant";

export type IncomeFilingDecisionInput = {
  source: IncomeFilingSource;
  annualIncomeWon: number;
  annualExpenseWon: number;
  withholdingWon: number;
  incomePayersCount: number;
  hasBookkeepingNotice: boolean;
  hasVatBusiness: boolean;
  hasEmployees: boolean;
  hasPlatformOrForeignIncome: boolean;
  hasMissingReceipts: boolean;
  isNearDeadline: boolean;
};

export type IncomeFilingDecisionResult = {
  recommendation: IncomeFilingRecommendation;
  score: number;
  title: string;
  summary: string;
  reasons: string[];
  nextActions: string[];
  documents: string[];
};

export function calculateIncomeFilingDecision(
  input: IncomeFilingDecisionInput,
): IncomeFilingDecisionResult {
  let score = 0;
  const reasons: string[] = [];
  const nextActions: string[] = [];
  const documents = [
    "홈택스 종합소득세 신고 안내문",
    "수입금액 자료와 지급명세서",
    "사업 관련 카드·현금영수증·세금계산서",
    "통장 입금내역과 플랫폼 정산서",
  ];

  const profitWon = Math.max(0, input.annualIncomeWon - input.annualExpenseWon);
  const expenseRatio = input.annualIncomeWon > 0 ? input.annualExpenseWon / input.annualIncomeWon : 0;

  if (input.source === "employment_only") {
    score -= 20;
    reasons.push("근로소득만 있고 회사 연말정산으로 대부분 정리되는 구조라면 직접 확인 가능성이 높습니다.");
  }

  if (input.source === "freelance") {
    score += 16;
    reasons.push("프리랜서 소득은 3.3% 원천징수와 실제 경비 인정 범위를 함께 봐야 합니다.");
  }

  if (input.source === "business") {
    score += 24;
    reasons.push("사업소득은 수입금액보다 장부·경비·증빙 정리가 실제 세액에 더 큰 영향을 줍니다.");
  }

  if (input.source === "side_hustle") {
    score += 14;
    reasons.push("부업 소득은 근로소득과 합산될 때 세율 구간이 달라질 수 있습니다.");
  }

  if (input.source === "rental") {
    score += 18;
    reasons.push("임대소득은 보증금, 필요경비, 분리과세 여부 등 별도 판단이 필요할 수 있습니다.");
  }

  if (input.source === "mixed") {
    score += 30;
    reasons.push("근로·프리랜서·사업·임대 등 소득원이 섞이면 직접 신고 난도가 크게 올라갑니다.");
  }

  if (input.annualIncomeWon >= 100_000_000) {
    score += 24;
    reasons.push("연 수입금액이 1억원 이상이면 실수 한 번의 세액 차이가 커질 수 있습니다.");
  } else if (input.annualIncomeWon >= 50_000_000) {
    score += 14;
    reasons.push("연 수입금액이 5천만원 이상이면 경비와 공제 누락 여부를 점검하는 편이 좋습니다.");
  } else if (input.annualIncomeWon > 0 && input.annualIncomeWon < 20_000_000) {
    score -= 8;
  }

  if (profitWon >= 50_000_000) {
    score += 18;
    reasons.push("예상 이익이 커서 누락 공제나 장부 방식에 따른 세액 차이가 커질 수 있습니다.");
  } else if (profitWon >= 20_000_000) {
    score += 10;
  }

  if (expenseRatio >= 0.55 && input.annualExpenseWon >= 10_000_000) {
    score += 15;
    reasons.push("경비 비중이 높아 업무 관련성·증빙 적정성을 설명할 준비가 필요합니다.");
  }

  if (input.withholdingWon > 0 && input.withholdingWon >= profitWon * 0.06) {
    score -= 5;
    reasons.push("원천징수된 금액이 있어 신고 결과가 환급 또는 추가납부로 갈릴 수 있습니다.");
  }

  if (input.incomePayersCount >= 5) {
    score += 16;
    reasons.push("거래처가 여러 곳이면 지급명세서 누락과 입금내역 대조가 필요합니다.");
  } else if (input.incomePayersCount >= 2) {
    score += 8;
  }

  if (input.hasBookkeepingNotice) {
    score += 28;
    reasons.push("기장의무 또는 장부 안내를 받았다면 신고 방식 선택 자체가 중요합니다.");
    documents.push("간편장부 또는 복식부기 관련 장부 자료");
  }

  if (input.hasVatBusiness) {
    score += 16;
    reasons.push("부가세 신고 대상 사업자는 종합소득세와 매출·매입 자료가 이어집니다.");
    documents.push("부가세 신고서와 매출·매입처별 합계표");
  }

  if (input.hasEmployees) {
    score += 22;
    reasons.push("직원이나 외주 인건비가 있으면 원천세·지급명세서까지 함께 확인해야 합니다.");
    documents.push("급여대장, 원천세 신고내역, 지급명세서");
  }

  if (input.hasPlatformOrForeignIncome) {
    score += 18;
    reasons.push("플랫폼·해외 소득은 정산서, 환율, 수수료가 섞여 통장 입금액만으로 판단하기 어렵습니다.");
    documents.push("플랫폼 정산서, 해외 입금내역, 환율 적용 자료");
  }

  if (input.hasMissingReceipts) {
    score += 15;
    reasons.push("증빙이 빠진 비용이 있다면 신고 전 비용 인정 가능성을 따로 정리해야 합니다.");
  }

  if (input.isNearDeadline) {
    score += 10;
    reasons.push("신고 마감이 임박하면 자료 검토 시간이 줄어 전문가 검토 가치가 커집니다.");
  }

  const normalizedScore = Math.max(0, Math.min(100, score));

  if (normalizedScore >= 62) {
    nextActions.push("수입·비용·원천징수·부가세 신고 자료를 묶어 세무사 검토를 요청하세요.");
    nextActions.push("기장의무, 경비 인정, 소득 구분이 맞는지 먼저 확인하세요.");
    nextActions.push("상담 전 플랫폼 정산서와 통장 입금내역을 월별로 정리하세요.");
    return {
      recommendation: "tax_accountant",
      score: normalizedScore,
      title: "세무사에게 맡기는 편이 안전합니다",
      summary: "소득원과 증빙 구조가 복잡해 직접 신고보다 전문가 검토 가치가 큽니다.",
      reasons,
      nextActions,
      documents,
    };
  }

  if (normalizedScore >= 34) {
    nextActions.push("홈택스 신고 안내문과 지급명세서를 먼저 대조하세요.");
    nextActions.push("경비가 큰 항목, 누락된 증빙, 소득 구분이 애매한 항목만 1회 검토받으세요.");
    nextActions.push("부가세 신고 대상이라면 부가세 자료와 종소세 비용 자료를 함께 맞추세요.");
    return {
      recommendation: "review",
      score: normalizedScore,
      title: "직접 신고 전 1회 검토를 권장합니다",
      summary: "직접 신고가 불가능한 수준은 아니지만, 몇 가지 항목은 확인하고 진행하는 편이 좋습니다.",
      reasons,
      nextActions,
      documents,
    };
  }

  nextActions.push("홈택스 미리채움 자료와 지급명세서가 맞는지 확인하세요.");
  nextActions.push("소득공제와 세액공제 자료를 빠뜨리지 않았는지 체크하세요.");
  nextActions.push("내년에도 같은 소득이 반복되면 월별 수입·비용표를 만들어 두세요.");
  return {
    recommendation: "self",
    score: normalizedScore,
    title: "직접 신고 가능성이 높습니다",
    summary: "소득원이 단순하고 증빙 리스크가 낮아 홈택스로 직접 진행할 여지가 큽니다.",
    reasons: reasons.length > 0 ? reasons : ["소득원과 비용 구조가 단순해 신고 난도가 낮은 편입니다."],
    nextActions,
    documents,
  };
}
