export type IndustryTaxProfile =
  | "smartstore"
  | "purchase_agency"
  | "reverse_export"
  | "freelance"
  | "creator_ads"
  | "restaurant"
  | "rental";

export type IndustryTaxDiagnosisInput = {
  profile: IndustryTaxProfile;
  annualRevenueWon: number;
  monthlyDocs: number;
  hasEmployees: boolean;
  hasForeignTransactions: boolean;
  hasVatIssue: boolean;
  hasMissingReceipts: boolean;
};

export type IndustryTaxDiagnosisResult = {
  score: number;
  level: "low" | "mid" | "high";
  title: string;
  summary: string;
  reasons: string[];
  priorityCalculators: {
    label: string;
    href: string;
    reason: string;
  }[];
  documents: string[];
};

const PROFILE_BASE: Record<IndustryTaxProfile, { score: number; reasons: string[]; documents: string[] }> = {
  smartstore: {
    score: 28,
    reasons: ["플랫폼 정산, 반품, 쿠폰, 배송비, 광고비가 섞여 통장 입금액만으로 판단하기 어렵습니다."],
    documents: ["스마트스토어 정산서", "상품 매입증빙", "배송비·광고비 내역", "반품·취소 내역"],
  },
  purchase_agency: {
    score: 42,
    reasons: ["국내 주문, 해외 매입, 대리결제, 배대지 비용을 주문번호 기준으로 연결해야 합니다."],
    documents: ["국내 주문내역", "해외 구매내역", "대리결제 정산서", "배대지 청구서"],
  },
  reverse_export: {
    score: 44,
    reasons: ["해외 정산, 환율, 수출증빙, 영세율 검토가 함께 얽힐 수 있습니다."],
    documents: ["해외 마켓 주문 CSV", "Payoneer 등 정산내역", "배송·수출증빙", "환율 적용 자료"],
  },
  freelance: {
    score: 20,
    reasons: ["3.3% 원천징수와 실제 경비 인정 범위를 함께 확인해야 합니다."],
    documents: ["지급명세서", "원천징수 내역", "업무 관련 경비 영수증", "입금 통장 내역"],
  },
  creator_ads: {
    score: 26,
    reasons: ["애드센스, 제휴수익, 강의료, 전자책 판매는 정산 주기와 증빙 방식이 다릅니다."],
    documents: ["플랫폼별 정산서", "해외 입금내역", "콘텐츠 제작비 영수증", "원천징수 내역"],
  },
  restaurant: {
    score: 30,
    reasons: ["카드매출, 현금영수증, 배달앱 정산, 식자재 매입이 함께 움직입니다."],
    documents: ["카드매출·현금영수증 자료", "배달앱 정산서", "식자재 매입자료", "인건비 자료"],
  },
  rental: {
    score: 24,
    reasons: ["임대소득은 보증금, 월세, 필요경비, 분리과세 여부를 함께 봐야 합니다."],
    documents: ["임대차계약서", "월세 입금내역", "수선비·관리비 영수증", "재산세 등 보유비용"],
  },
};

export function calculateIndustryTaxDiagnosis(
  input: IndustryTaxDiagnosisInput,
): IndustryTaxDiagnosisResult {
  const base = PROFILE_BASE[input.profile];
  let score = base.score;
  const reasons = [...base.reasons];
  const documents = [...base.documents];

  if (input.annualRevenueWon >= 100_000_000) {
    score += 24;
    reasons.push("연 매출 1억원 이상이면 부가세, 종합소득세, 장부 방식의 세액 차이가 커질 수 있습니다.");
  } else if (input.annualRevenueWon >= 50_000_000) {
    score += 14;
    reasons.push("연 매출 5천만원 이상이면 신고 전 자료 누락 여부를 점검하는 편이 좋습니다.");
  } else if (input.annualRevenueWon > 0 && input.annualRevenueWon < 20_000_000) {
    score -= 8;
  }

  if (input.monthlyDocs >= 80) {
    score += 22;
    reasons.push("월 거래자료가 80건 이상이면 직접 정리 시간과 누락 리스크가 큽니다.");
  } else if (input.monthlyDocs >= 30) {
    score += 14;
    reasons.push("월 거래자료가 30건 이상이면 월별 정리 기준을 잡아두는 편이 안전합니다.");
  }

  if (input.hasEmployees) {
    score += 18;
    reasons.push("직원이나 외주 인건비가 있으면 원천세·지급명세서까지 함께 확인해야 합니다.");
    documents.push("급여대장 또는 외주비 지급내역");
  }

  if (input.hasForeignTransactions) {
    score += 18;
    reasons.push("해외거래가 있으면 환율, 수수료, 수출·수입 증빙을 분리해야 합니다.");
    documents.push("해외 결제·정산 내역");
  }

  if (input.hasVatIssue) {
    score += 16;
    reasons.push("부가세 신고 대상이면 매출·매입자료가 종합소득세까지 이어집니다.");
    documents.push("부가세 신고서 또는 신고 안내문");
  }

  if (input.hasMissingReceipts) {
    score += 14;
    reasons.push("증빙이 빠진 비용은 신고 전 인정 가능성과 대체 자료를 확인해야 합니다.");
  }

  const normalizedScore = Math.max(0, Math.min(100, score));
  const level = normalizedScore >= 62 ? "high" : normalizedScore >= 34 ? "mid" : "low";

  const priorityCalculators = [
    {
      label: "업종별 첫 진단",
      href: "/calculator/부업",
      reason: "수입·비용·원천징수·사업자등록 상태를 먼저 정리합니다.",
    },
    {
      label: "종합소득세 직접신고 판단",
      href: "/calculator/종합소득세",
      reason: "소득원과 증빙 상태를 기준으로 직접 신고 가능성을 봅니다.",
    },
    {
      label: "부가세 직접신고 판단",
      href: "/calculator/부가세",
      reason: "매출·매입자료와 플랫폼·해외거래 구조를 점검합니다.",
    },
  ];

  if (normalizedScore >= 50 || input.monthlyDocs >= 30 || input.hasEmployees) {
    priorityCalculators.push({
      label: "기장료·직접관리 손익 판단",
      href: "/calculator/jangbu",
      reason: "직접 관리와 월 기장 의뢰 중 어느 쪽이 유리한지 비교합니다.",
    });
  }

  return {
    score: normalizedScore,
    level,
    title:
      level === "high"
        ? "세무사 검토가 필요한 업종 구조입니다"
        : level === "mid"
          ? "직접 처리 전 기준 점검이 필요합니다"
          : "직접 정리부터 시작할 수 있습니다",
    summary:
      level === "high"
        ? "매출·자료·업종 특성상 신고 전 전문가에게 구조를 보여주는 편이 안전합니다."
        : level === "mid"
          ? "홈택스만으로 끝낼 수 있는지, 자료 누락 리스크가 있는지 먼저 확인하세요."
          : "현재 입력값 기준으로는 거래 구조가 비교적 단순합니다. 다만 매출이나 자료가 늘면 다시 진단하세요.",
    reasons,
    priorityCalculators,
    documents: Array.from(new Set(documents)),
  };
}
