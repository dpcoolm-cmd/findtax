export type AdvisorCostBenefitInput = {
  advisorFeeWon: number;
  missedDeductionWon: number;
  taxRatePercent: number;
  penaltyRiskWon: number;
  timeHours: number;
  hourlyValueWon: number;
};

export type AdvisorCostBenefitResult = {
  estimatedBenefitWon: number;
  netBenefitWon: number;
  taxSavingFromDeductionWon: number;
  timeValueWon: number;
  recommendation: "self" | "borderline" | "advisor";
  title: string;
  summary: string;
  reasons: string[];
};

export function calculateAdvisorCostBenefit(
  input: AdvisorCostBenefitInput,
): AdvisorCostBenefitResult {
  const advisorFeeWon = Math.max(0, Math.floor(input.advisorFeeWon));
  const missedDeductionWon = Math.max(0, Math.floor(input.missedDeductionWon));
  const taxRate = Math.max(0, Math.min(60, input.taxRatePercent)) / 100;
  const penaltyRiskWon = Math.max(0, Math.floor(input.penaltyRiskWon));
  const timeHours = Math.max(0, input.timeHours);
  const hourlyValueWon = Math.max(0, Math.floor(input.hourlyValueWon));

  const taxSavingFromDeductionWon = Math.floor(missedDeductionWon * taxRate);
  const timeValueWon = Math.floor(timeHours * hourlyValueWon);
  const estimatedBenefitWon = taxSavingFromDeductionWon + penaltyRiskWon + timeValueWon;
  const netBenefitWon = estimatedBenefitWon - advisorFeeWon;

  const reasons: string[] = [];
  if (taxSavingFromDeductionWon > 0) {
    reasons.push(`누락 가능 비용·공제에서 약 ${taxSavingFromDeductionWon.toLocaleString("ko-KR")}원의 세액 차이가 날 수 있습니다.`);
  }
  if (penaltyRiskWon > 0) {
    reasons.push(`신고 오류·지연·자료 누락 리스크를 약 ${penaltyRiskWon.toLocaleString("ko-KR")}원으로 반영했습니다.`);
  }
  if (timeValueWon > 0) {
    reasons.push(`직접 정리에 쓰는 시간가치를 약 ${timeValueWon.toLocaleString("ko-KR")}원으로 반영했습니다.`);
  }
  if (advisorFeeWon > 0) {
    reasons.push(`예상 세무사 비용은 ${advisorFeeWon.toLocaleString("ko-KR")}원입니다.`);
  }

  if (netBenefitWon >= Math.max(100_000, advisorFeeWon * 0.2)) {
    return {
      estimatedBenefitWon,
      netBenefitWon,
      taxSavingFromDeductionWon,
      timeValueWon,
      recommendation: "advisor",
      title: "세무사 비용보다 기대 이익이 커 보입니다",
      summary: "공제 누락, 가산세 리스크, 직접 처리 시간을 감안하면 전문가 검토가 비용을 상쇄할 가능성이 큽니다.",
      reasons,
    };
  }

  if (netBenefitWon >= -Math.max(100_000, advisorFeeWon * 0.25)) {
    return {
      estimatedBenefitWon,
      netBenefitWon,
      taxSavingFromDeductionWon,
      timeValueWon,
      recommendation: "borderline",
      title: "단건 검토 또는 비교견적 구간입니다",
      summary: "세무사 비용과 기대 이익이 비슷합니다. 월 기장보다 신고 전 1회 검토나 비교견적이 현실적입니다.",
      reasons,
    };
  }

  return {
    estimatedBenefitWon,
    netBenefitWon,
    taxSavingFromDeductionWon,
    timeValueWon,
    recommendation: "self",
    title: "직접 처리도 검토할 수 있습니다",
    summary: "현재 입력값 기준으로는 세무사 비용을 넘는 기대 이익이 크지 않습니다. 자료가 단순하다면 직접 신고가 효율적일 수 있습니다.",
    reasons,
  };
}
