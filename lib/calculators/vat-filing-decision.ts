export type VatTaxpayerType = "unknown" | "simplified" | "general";
export type VatFilingRecommendation = "self" | "review" | "tax_accountant";

export type VatFilingDecisionInput = {
  taxpayerType: VatTaxpayerType;
  annualRevenueWon: number;
  monthlySalesDocs: number;
  monthlyPurchaseDocs: number;
  hasEmployees: boolean;
  hasPaperOrCashData: boolean;
  hasOnlineMarketplace: boolean;
  hasCrossBorderSales: boolean;
  isNearDeadline: boolean;
};

export type VatFilingDecisionResult = {
  recommendation: VatFilingRecommendation;
  score: number;
  title: string;
  summary: string;
  reasons: string[];
  nextActions: string[];
  checkpoints: string[];
};

const SIMPLIFIED_TAX_EXEMPT_REVENUE_WON = 48_000_000;
const SIMPLIFIED_TAX_LIMIT_REVENUE_WON = 104_000_000;

export function calculateVatFilingDecision(
  input: VatFilingDecisionInput,
): VatFilingDecisionResult {
  let score = 0;
  const reasons: string[] = [];
  const nextActions: string[] = [];
  const checkpoints = [
    "홈택스에서 과세유형과 직전 연매출을 먼저 확인하세요.",
    "매출자료, 매입 세금계산서, 카드·현금영수증, 플랫폼 정산서를 월별로 모으세요.",
    "면세·영세율·불공제·간이과세 특례는 실제 신고 전 별도 확인이 필요합니다.",
  ];

  if (input.taxpayerType === "general") {
    score += 28;
    reasons.push("일반과세자는 매출세액과 매입세액 공제를 함께 맞춰야 해서 단순 계산보다 검토 범위가 넓습니다.");
  }

  if (input.taxpayerType === "unknown") {
    score += 12;
    reasons.push("과세유형을 모르는 상태라면 직접 신고 전에 홈택스 기준부터 확인해야 합니다.");
  }

  if (input.annualRevenueWon >= SIMPLIFIED_TAX_LIMIT_REVENUE_WON) {
    score += 30;
    reasons.push("직전 연매출이 일반과세 전환 검토 구간에 있어 신고 구조가 복잡해질 수 있습니다.");
  } else if (input.annualRevenueWon >= SIMPLIFIED_TAX_EXEMPT_REVENUE_WON) {
    score += 16;
    reasons.push("연매출이 간이과세 납부면제 기준을 넘는 구간이라 납부세액과 업종별 세율을 확인해야 합니다.");
  } else if (input.taxpayerType === "simplified" && input.annualRevenueWon > 0) {
    score -= 12;
    reasons.push("간이과세자이고 연매출이 낮은 편이라 거래가 단순하면 직접 신고 가능성이 있습니다.");
  }

  if (input.monthlyPurchaseDocs >= 30) {
    score += 30;
    reasons.push("월 매입자료가 30건 이상이면 공제 누락 하나가 세무사 비용보다 커질 수 있습니다.");
  } else if (input.monthlyPurchaseDocs >= 10) {
    score += 20;
    reasons.push("월 매입자료가 10건 이상이면 매입세액 공제 누락 여부를 따로 점검하는 편이 좋습니다.");
  } else if (input.monthlyPurchaseDocs <= 3) {
    score -= 5;
  }

  if (input.monthlySalesDocs >= 50) {
    score += 20;
    reasons.push("매출자료 건수가 많아 카드매출, 현금영수증, 세금계산서 간 중복·누락 확인이 필요합니다.");
  } else if (input.monthlySalesDocs >= 20) {
    score += 12;
    reasons.push("매출자료가 적지 않아 홈택스 미리채움만 믿기보다 정산자료 대조가 필요합니다.");
  }

  if (input.hasEmployees) {
    score += 22;
    reasons.push("직원이 있으면 원천세, 4대보험, 인건비 증빙까지 함께 보게 됩니다.");
  }

  if (input.hasPaperOrCashData) {
    score += 18;
    reasons.push("종이 세금계산서나 단말기 밖 현금매출은 자동 수집에서 빠질 수 있어 직접 입력 실수가 잦습니다.");
  }

  if (input.hasOnlineMarketplace) {
    score += 14;
    reasons.push("스마트스토어·쿠팡 등 플랫폼 정산은 수수료, 쿠폰, 반품, 배송비가 섞여 대조가 필요합니다.");
  }

  if (input.hasCrossBorderSales) {
    score += 24;
    reasons.push("해외판매·구매대행·역직구는 영세율, 수출증빙, 대리결제 자료 등 쟁점이 생길 수 있습니다.");
  }

  if (input.isNearDeadline) {
    score += 12;
    reasons.push("마감이 임박했다면 누락 자료를 찾을 시간이 줄어들어 전문가 검토 가치가 커집니다.");
  }

  const normalizedScore = Math.max(0, Math.min(100, score));

  if (normalizedScore >= 62) {
    nextActions.push("부가세 신고 전 월별 매출·매입 자료를 묶어 세무사에게 검토 요청하세요.");
    nextActions.push("기장료가 부담된다면 최소한 이번 부가세 신고만 단건 검토하는 선택지도 확인하세요.");
    nextActions.push("플랫폼 정산서, 세금계산서, 카드·현금영수증 자료를 빠짐없이 준비하세요.");
    return {
      recommendation: "tax_accountant",
      score: normalizedScore,
      title: "전문가 검토 필요성이 높은 편입니다",
      summary: "자료 구조가 복잡하거나 공제 누락 위험이 있어, 직접 신고 여부를 정하기 전에 전문가 검토를 권장합니다.",
      reasons,
      nextActions,
      checkpoints,
    };
  }

  if (normalizedScore >= 34) {
    nextActions.push("홈택스 미리채움 자료와 실제 정산자료를 먼저 대조하세요.");
    nextActions.push("애매한 공제, 플랫폼 정산, 현금매출이 있다면 신고 전 1회 검토를 받는 편이 안전합니다.");
    nextActions.push("다음 신고부터 반복 자료가 늘면 월 기장 전환도 비교해 보세요.");
    return {
      recommendation: "review",
      score: normalizedScore,
      title: "직접 신고 전 확인할 항목이 있습니다",
      summary: "직접 신고가 불가능한 수준은 아니지만, 몇 가지 누락 위험을 확인하고 진행하는 편이 좋습니다.",
      reasons,
      nextActions,
      checkpoints,
    };
  }

  nextActions.push("홈택스 미리채움 자료를 확인하고 매출·매입 자료가 모두 반영됐는지 체크하세요.");
  nextActions.push("납부세액이 작더라도 신고 기한과 자료 보관은 놓치지 마세요.");
  nextActions.push("다음 신고 때 매입자료가 늘거나 플랫폼 매출이 커지면 다시 진단하세요.");
  return {
    recommendation: "self",
    score: normalizedScore,
    title: "신고 자료 구조가 비교적 단순합니다",
    summary: "간이과세 또는 단순 거래 구조라면 홈택스 미리채움 자료를 대조한 뒤 직접 진행할 여지가 있습니다.",
    reasons: reasons.length > 0 ? reasons : ["거래 건수와 매입자료가 많지 않아 신고 난도가 낮은 편입니다."],
    nextActions,
    checkpoints,
  };
}
