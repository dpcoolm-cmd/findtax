import type { GiftCaseInput } from "@/lib/tax-cases/gift-case";
import type { SoloBusinessInput } from "@/lib/tax-cases/solo-business-case";
import type { YearEndTaxOptimizationInput } from "@/lib/calculators/year-end-tax-optimization";
import type { SellerTaxInput } from "@/lib/tax-cases/seller-case";

export type GuidedCaseType = "gift" | "solo_business" | "pension" | "seller";
export type TaxCaseType = "vat" | GuidedCaseType;
export type TaxCaseRecommendation = "self" | "review" | "tax_accountant";
export type TaxCaseTaskStatus = "ready" | "not_ready" | "unsure";

export type GuidedTaskDefinition = {
  key: string;
  label: string;
  description: string;
  status: TaxCaseTaskStatus;
  weight: number;
  sortOrder: number;
};

export type GuidedDocumentDefinition = {
  key: string;
  label: string;
  description: string;
  reason: string;
  required: boolean;
  status: "pending" | "ready";
  sortOrder: number;
};

export function giftCaseTasks(input: GiftCaseInput): GuidedTaskDefinition[] {
  return [
    {
      key: "gift_history",
      label: "10년 증여 내역 확인",
      description: "같은 증여자에게 받은 과거 10년 증여일과 금액을 합산해 확인합니다.",
      status: input.knowsPriorGifts ? "ready" : "unsure",
      weight: 25,
      sortOrder: 0,
    },
    {
      key: "transfer_evidence",
      label: "증여 실행 증빙 준비",
      description: "계좌이체 내역, 증여계약서 등 재산이 이전된 근거를 준비합니다.",
      status: input.hasTransferEvidence ? "ready" : "not_ready",
      weight: 25,
      sortOrder: 1,
    },
    {
      key: "relationship_document",
      label: "가족관계 확인서류 준비",
      description: "수증자와 증여자의 관계 및 공제 적용 근거를 확인합니다.",
      status: input.hasRelationshipDocument ? "ready" : "not_ready",
      weight: 15,
      sortOrder: 2,
    },
    {
      key: "valuation",
      label: "증여재산 평가 확인",
      description: "증여일 기준 세법상 평가액과 평가 근거 자료를 확인합니다.",
      status:
        input.assetType === "cash" || input.hasValuationEvidence
          ? "ready"
          : "not_ready",
      weight: 20,
      sortOrder: 3,
    },
    {
      key: "deadline",
      label: "신고기한 확인",
      description: "증여일이 속한 달의 말일부터 3개월 이내 신고 일정을 확인합니다.",
      status: input.giftDate ? "ready" : "not_ready",
      weight: 15,
      sortOrder: 4,
    },
  ];
}

export function giftCaseDocuments(input: GiftCaseInput): GuidedDocumentDefinition[] {
  const documents: GuidedDocumentDefinition[] = [
    {
      key: "gift_agreement",
      label: "증여계약서·이체확인증",
      description: "증여 의사와 실제 자금·재산 이전을 확인할 수 있는 자료입니다.",
      reason: "증여일과 증여재산가액의 기본 근거가 됩니다.",
      required: true,
      status: input.hasTransferEvidence ? "ready" : "pending",
      sortOrder: 0,
    },
    {
      key: "family_relation",
      label: "가족관계증명서",
      description: "증여자와 수증자의 관계를 확인합니다.",
      reason: "배우자·직계존비속 등 관계별 공제 판단에 필요합니다.",
      required: true,
      status: input.hasRelationshipDocument ? "ready" : "pending",
      sortOrder: 1,
    },
    {
      key: "prior_gift_history",
      label: "과거 10년 증여 내역",
      description: "같은 증여자에게 받은 종전 증여의 신고서와 이체 내역을 모읍니다.",
      reason: "10년 합산과 공제 사용액을 정확히 계산하기 위해 필요합니다.",
      required: true,
      status: input.knowsPriorGifts ? "ready" : "pending",
      sortOrder: 2,
    },
  ];
  if (input.assetType !== "cash") {
    documents.push({
      key: "valuation_evidence",
      label: "재산 평가 근거",
      description: "시가, 기준시가, 거래가액 등 증여일 현재 평가 근거를 준비합니다.",
      reason: "주식·부동산·사업지분은 현금과 평가 방식이 다릅니다.",
      required: true,
      status: input.hasValuationEvidence ? "ready" : "pending",
      sortOrder: 3,
    });
  }
  return documents;
}

export function soloBusinessTasks(
  input: SoloBusinessInput,
): GuidedTaskDefinition[] {
  return [
    {
      key: "business_status",
      label: "사업자·과세유형 확인",
      description: "사업자등록 여부와 일반·간이·면세 등 현재 과세유형을 확인합니다.",
      status:
        input.businessStatus === "registered" && input.vatStatus !== "unsure"
          ? "ready"
          : "unsure",
      weight: 20,
      sortOrder: 0,
    },
    {
      key: "sales_ledger",
      label: "매출 통합 장부 만들기",
      description: "플랫폼·계좌·카드·현금 매출을 월별 한 장부로 합칩니다.",
      status: input.hasEvidenceRoutine ? "ready" : "not_ready",
      weight: 25,
      sortOrder: 1,
    },
    {
      key: "expense_evidence",
      label: "경비 증빙 루틴 만들기",
      description: "사업용 카드·계좌와 세금계산서, 현금영수증을 월별로 정리합니다.",
      status: input.hasEvidenceRoutine ? "ready" : "not_ready",
      weight: 25,
      sortOrder: 2,
    },
    {
      key: "tax_calendar",
      label: "연간 세무 일정 저장",
      description: "부가세·종소세·원천세·지급명세서 중 내게 필요한 일정을 저장합니다.",
      status: input.hasTaxCalendar ? "ready" : "not_ready",
      weight: 15,
      sortOrder: 3,
    },
    {
      key: "payroll",
      label: "인건비 신고체계 확인",
      description: "직원·프리랜서 지급 시 원천세와 지급명세서 처리 방식을 정합니다.",
      status:
        !input.hasEmployees && !input.paysFreelancers
          ? "ready"
          : input.hasBookkeeping
            ? "ready"
            : "not_ready",
      weight: 15,
      sortOrder: 4,
    },
  ];
}

export function soloBusinessDocuments(
  input: SoloBusinessInput,
): GuidedDocumentDefinition[] {
  const documents: GuidedDocumentDefinition[] = [
    {
      key: "business_registration",
      label: "사업자등록·과세유형 자료",
      description: "사업자등록증과 홈택스의 사업자 상태를 확인합니다.",
      reason: "신고 종류와 주기를 결정하는 출발점입니다.",
      required: true,
      status: input.businessStatus === "registered" ? "ready" : "pending",
      sortOrder: 0,
    },
    {
      key: "sales_settlements",
      label: "매출·플랫폼 정산자료",
      description: "카드, 계좌, 오픈마켓, 배달앱 등 채널별 정산자료를 모읍니다.",
      reason: "누락·중복 매출을 막고 신고 금액을 대조하기 위해 필요합니다.",
      required: true,
      status: input.hasEvidenceRoutine ? "ready" : "pending",
      sortOrder: 1,
    },
    {
      key: "expense_evidence",
      label: "사업 경비 증빙",
      description: "세금계산서, 카드전표, 현금영수증과 사업용 계좌 내역을 모읍니다.",
      reason: "부가세 매입공제와 종합소득세 필요경비의 핵심 자료입니다.",
      required: true,
      status: input.hasEvidenceRoutine ? "ready" : "pending",
      sortOrder: 2,
    },
  ];
  if (input.hasEmployees || input.paysFreelancers) {
    documents.push({
      key: "payroll_records",
      label: "급여·외주 지급자료",
      description: "계약서, 지급내역, 원천징수 자료를 월별로 정리합니다.",
      reason: "원천세와 지급명세서 제출에 필요합니다.",
      required: true,
      status: input.hasBookkeeping ? "ready" : "pending",
      sortOrder: 3,
    });
  }
  if (input.hasForeignTransactions) {
    documents.push({
      key: "foreign_evidence",
      label: "해외 거래·영세율 증빙",
      description: "인보이스, 송금내역, 수출·플랫폼 정산자료를 준비합니다.",
      reason: "환율 적용과 영세율·국외거래 판단에 필요합니다.",
      required: true,
      status: "pending",
      sortOrder: 4,
    });
  }
  return documents;
}

export function pensionCaseTasks(
  input: YearEndTaxOptimizationInput,
): GuidedTaskDefinition[] {
  return [
    {
      key: "income_basis",
      label: "공제율 기준소득 확인",
      description: "총급여 또는 종합소득금액을 소득자료에서 확인합니다.",
      status: input.hasIncomeStatement ? "ready" : "not_ready",
      weight: 20,
      sortOrder: 0,
    },
    {
      key: "contribution_statement",
      label: "연금계좌 납입액 확인",
      description: "금융회사 납입확인서에서 연금저축·IRP 누적 납입액을 확인합니다.",
      status: input.hasCheckedContributionStatements ? "ready" : "not_ready",
      weight: 20,
      sortOrder: 1,
    },
    {
      key: "emergency_reserve",
      label: "비상자금 우선 확보",
      description: "중도 인출 불이익을 피하도록 최소 3개월 생활비를 별도로 확보합니다.",
      status:
        !input.needsMoneyWithinYear && input.emergencyFundMonths >= 3
          ? "ready"
          : "not_ready",
      weight: 25,
      sortOrder: 2,
    },
    {
      key: "contribution_plan",
      label: "연금저축·IRP 배분 확정",
      description: "연금저축 600만원, 합산 900만원 한도 안에서 올해 납입액을 정합니다.",
      status: input.extraBudgetWon > 0 ? "ready" : "not_ready",
      weight: 20,
      sortOrder: 3,
    },
    {
      key: "year_end_evidence",
      label: "연말 증빙 반영 확인",
      description: "연말정산 간소화 또는 종합소득세 신고자료에 납입액이 반영됐는지 확인합니다.",
      status: "not_ready",
      weight: 15,
      sortOrder: 4,
    },
  ];
}

export function pensionCaseDocuments(
  input: YearEndTaxOptimizationInput,
): GuidedDocumentDefinition[] {
  const documents: GuidedDocumentDefinition[] = [
    {
      key: "income_statement",
      label: "소득 기준자료",
      description: "근로소득 원천징수영수증 또는 종합소득세 신고자료입니다.",
      reason: "15%·12% 세액공제율 구간을 판단하는 기준입니다.",
      required: true,
      status: input.hasIncomeStatement ? "ready" : "pending",
      sortOrder: 0,
    },
    {
      key: "pension_statement",
      label: "연금저축·IRP 납입확인서",
      description: "계좌별 올해 누적 납입액과 세액공제 대상액을 확인합니다.",
      reason: "중복·초과 납입 없이 공제 대상액을 확정하기 위해 필요합니다.",
      required: true,
      status: input.hasCheckedContributionStatements ? "ready" : "pending",
      sortOrder: 1,
    },
  ];
  if (input.isaMaturityTransferWon > 0) {
    documents.push({
      key: "isa_transfer_statement",
      label: "ISA 만기자금 전환 확인서",
      description: "ISA 만기자금이 연금계좌로 이전된 금액과 날짜를 확인합니다.",
      reason: "전환액의 10%, 최대 300만원 추가 세액공제 한도를 확인합니다.",
      required: true,
      status: "pending",
      sortOrder: 2,
    });
  }
  return documents;
}

export function sellerCaseTasks(
  input: SellerTaxInput,
): GuidedTaskDefinition[] {
  return [
    {
      key: "seller_status",
      label: "사업자·과세유형 확인",
      description: "사업자등록과 일반·간이·면세 여부를 홈택스 기준으로 확인합니다.",
      status:
        input.businessStatus === "registered" && input.vatStatus !== "unsure"
          ? "ready"
          : "unsure",
      weight: 15,
      sortOrder: 0,
    },
    {
      key: "gross_sales",
      label: "총매출과 정산금 분리",
      description: "상품 판매액, 쿠폰, 반품, 플랫폼 수수료와 실제 입금액을 구분합니다.",
      status: input.grossSalesSeparated ? "ready" : "not_ready",
      weight: 20,
      sortOrder: 1,
    },
    {
      key: "settlement_reconciliation",
      label: "월 정산 대사표 만들기",
      description: "주문번호 기준으로 플랫폼 주문과 통장·PG·외화 정산을 연결합니다.",
      status: input.hasMonthlySettlementRoutine ? "ready" : "not_ready",
      weight: 25,
      sortOrder: 2,
    },
    {
      key: "expense_evidence",
      label: "매입·광고·배송비 증빙 정리",
      description: "비용별 적격증빙과 업무 관련성을 월별로 보관합니다.",
      status: input.hasExpenseEvidence ? "ready" : "not_ready",
      weight: 15,
      sortOrder: 3,
    },
    {
      key: "export_evidence",
      label: "해외거래 증빙 확인",
      description: "수출·배송·외화입금·환율 자료를 거래별로 연결합니다.",
      status:
        input.profile !== "reverse_export" || input.hasExportEvidence
          ? "ready"
          : "not_ready",
      weight: 15,
      sortOrder: 4,
    },
    {
      key: "seller_calendar",
      label: "셀러 신고 일정 저장",
      description: "부가세·종소세와 인건비 관련 일정을 내 세금 운영표에 저장합니다.",
      status: "not_ready",
      weight: 10,
      sortOrder: 5,
    },
  ];
}

export function sellerCaseDocuments(
  input: SellerTaxInput,
): GuidedDocumentDefinition[] {
  const documents: GuidedDocumentDefinition[] = [
    {
      key: "platform_settlements",
      label: "플랫폼 주문·정산 CSV",
      description: "주문일, 결제액, 쿠폰, 반품, 수수료, 정산액이 포함된 자료입니다.",
      reason: "총매출과 실제 입금액의 차이를 대조하는 핵심 자료입니다.",
      required: true,
      status: input.hasMonthlySettlementRoutine ? "ready" : "pending",
      sortOrder: 0,
    },
    {
      key: "sales_reconciliation",
      label: "월 매출 대사표",
      description: "플랫폼별 총매출과 통장·PG 정산액의 차이를 설명하는 표입니다.",
      reason: "누락·중복 매출과 수수료 순액 인식을 방지합니다.",
      required: true,
      status: input.grossSalesSeparated ? "ready" : "pending",
      sortOrder: 1,
    },
    {
      key: "purchase_expenses",
      label: "상품 매입·광고·배송비 증빙",
      description: "세금계산서, 카드전표, 해외결제와 배송비 자료를 모읍니다.",
      reason: "부가세 매입공제와 종합소득세 필요경비를 확인합니다.",
      required: true,
      status: input.hasExpenseEvidence ? "ready" : "pending",
      sortOrder: 2,
    },
  ];

  if (input.profile === "reverse_export") {
    documents.push({
      key: "export_package",
      label: "수출·배송·외화입금 증빙",
      description: "수출신고필증 또는 배송증빙과 해외 정산·입금 내역을 연결합니다.",
      reason: "영세율 적용 여부와 외화 매출 환산의 근거가 됩니다.",
      required: true,
      status: input.hasExportEvidence ? "ready" : "pending",
      sortOrder: 3,
    });
  }

  if (input.profile === "purchase_agency") {
    documents.push({
      key: "agency_contracts",
      label: "구매대행 거래 구조 자료",
      description: "고객 주문, 해외 구매, 대리결제와 대행수수료 산정 근거를 모읍니다.",
      reason: "상품 전체 금액과 대행수수료 중 매출 인식 범위를 판단합니다.",
      required: true,
      status: "pending",
      sortOrder: 3,
    });
  }

  return documents;
}
