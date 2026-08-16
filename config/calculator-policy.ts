/**
 * 계산기 **UX·간이 추정** 튜닝 상수 (법적 확정 세액 아님).
 * 전환 CTA, 보조 문구, 양도세 참고 세율 UI 등 운영에서 자주 바뀌는 값을 모읍니다.
 */

/** CalculatorEstimateNotice 기본 배지 문구 */
export const CALCULATOR_ESTIMATE_DEFAULT_BADGE_LABEL = "참고 · 간이 추정";

/** 계산기 하단 CTA — 종합소득세 result_band 임계값(원) */
export const CTA_BAND_COMPREHENSIVE_INCOME = {
  high: { minTaxWon: 10_000_000, minTaxableWon: 150_000_000 },
  mid: { minTaxWon: 1_000_000, minTaxableWon: 50_000_000 },
} as const;

/** 계산기 하단 CTA — 증여세 */
export const CTA_BAND_GIFT_TAX = {
  high: { minTaxWon: 5_000_000, minTaxableWon: 500_000_000 },
  mid: { minTaxWon: 500_000, minTaxableWon: 100_000_000 },
} as const;

/** 계산기 하단 CTA — 양도소득 간이 추정 */
export const CTA_BAND_TRANSFER_TAX = {
  high: { minTaxWon: 10_000_000, minGainWon: 200_000_000 },
  mid: { minTaxWon: 1_000_000, minGainWon: 50_000_000 },
} as const;

/** 계산기 하단 CTA — 부가세 */
export const CTA_BAND_VAT = {
  high: { minVatWon: 1_000_000 },
  mid: { minVatWon: 100_000 },
} as const;

/** CTA 카피(밴드별) — 문구만 변경할 때 이 객체를 수정 */
export const CALCULATOR_CTA_BAND_COPY = {
  high: {
    title:
      "금액 규모가 커지면 신고·쟁점 리스크도 커질 수 있습니다. 세무사 상담으로 방향을 잡아 보세요.",
    buttonLabel: "지금 세무사 상담 연결하기",
  },
  mid: {
    title:
      "이 구간은 적용 세법·공제 조합에 따라 실제 부담이 달라질 수 있어, 전문가 점검을 권장합니다.",
    buttonLabel: "세무사 상담 요청하기",
  },
  low: {
    title: "계산 결과를 바탕으로 공제·신고·구조를 점검해 보세요.",
    buttonLabel: "절세 상담 받기",
  },
} as const;

/**
 * 보유기간(년) 구간별 **참고 세율(%)** — `suggestedTransferTaxRatePercentFromHoldingYears`용.
 * 상한 미만이면 해당 ratePct 적용; 모두 아니면 fallback.
 */
export const TRANSFER_TAX_SUGGESTED_RATE_HOLDING_THRESHOLDS = [
  { belowYears: 1, ratePct: 40 },
  { belowYears: 2, ratePct: 30 },
  { belowYears: 5, ratePct: 24 },
] as const;

export const TRANSFER_TAX_SUGGESTED_RATE_FALLBACK_PCT = 15;

/** 양도세 계산기 — 빠른 선택 세율(%) 버튼 */
export const TRANSFER_TAX_UI_RATE_PRESETS: readonly {
  label: string;
  ratePct: number;
}[] = [
  { label: "참고 15%", ratePct: 15 },
  { label: "참고 40% (단기·중과 등 단순모델)", ratePct: 40 },
  { label: "참고 30%", ratePct: 30 },
  { label: "참고 24%", ratePct: 24 },
  { label: "참고 10%", ratePct: 10 },
  { label: "참고 6%", ratePct: 6 },
];
