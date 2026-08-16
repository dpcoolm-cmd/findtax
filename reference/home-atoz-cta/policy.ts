/**
 * home-atoz.kr 계산기별 CTA 3단계 정책.
 * 이 파일을 home-atoz 프로젝트의 `lib/` 또는 `config/`로 복사한 뒤 각 페이지에서 import 하세요.
 * (findtax 워크스페이스에는 해당 `app/*` 라우트가 없어 참조용으로만 둡니다.)
 */

export type CtaIntensity = "low" | "mid" | "high";

export type CtaVisualVariant = "default" | "orange" | "red" | "blue" | "amber";

export type HomeAtozCtaSpec = {
  intensity: CtaIntensity;
  /** CTA 박스 테두리·배경 */
  visual: CtaVisualVariant;
  title: string;
  buttonLabel: string;
  href: string;
  /** true면 `<a target="_blank">`, false면 내부 `Link` */
  external: boolean;
};

const FINDTAX_ORIGIN = "https://findtax.kr";

function consultHref(type: string): string {
  return `/consult?type=${encodeURIComponent(type)}`;
}

/** 총 추가비용(원). <500만 약함, 500~1500만 중간, 초과 강함 */
export function getTransactionCostCta(totalExtraCostWon: number): HomeAtozCtaSpec {
  const w = Math.max(0, totalExtraCostWon);
  const midLo = 5_000_000;
  const midHi = 15_000_000;
  const href = consultHref("법무사");

  if (w < midLo) {
    return {
      intensity: "low",
      visual: "default",
      title: "비용 확인 완료! 전문가 상담으로 절세 포인트 찾아보세요",
      buttonLabel: "세무사/법무사 무료 상담 →",
      href,
      external: false,
    };
  }
  if (w <= midHi) {
    return {
      intensity: "mid",
      visual: "default",
      title: "취득세 절감 여지가 있을 수 있어요. 법무사에게 확인해보세요",
      buttonLabel: "법무사 무료 상담 받기 →",
      href,
      external: false,
    };
  }
  return {
    intensity: "high",
    visual: "orange",
    title:
      "⚠️ 거래비용이 크게 발생합니다. 지금 법무사/세무사 상담으로\n절세 전략을 확인하세요. 수백만원 차이 날 수 있어요",
    buttonLabel: "지금 바로 무료 상담 →",
    href,
    external: false,
  };
}

/** 위험도(%) = (보증금+근저당)/공시지가×100 */
export function getJeonseSafetyCta(riskRatioPercent: number): HomeAtozCtaSpec {
  const r = Number.isFinite(riskRatioPercent) ? riskRatioPercent : 0;
  const href = consultHref("법무사");

  if (r < 40) {
    return {
      intensity: "low",
      visual: "default",
      title: "안전한 편이에요. 계약 전 법무사 검토로 한 번 더 확인해보세요",
      buttonLabel: "법무사에게 무료 검토받기 →",
      href,
      external: false,
    };
  }
  if (r <= 70) {
    return {
      intensity: "mid",
      visual: "default",
      title: "주의 구간이에요. 계약 전 법무사 권리관계 검토를 추천합니다",
      buttonLabel: "법무사 무료 검토 신청하기 →",
      href,
      external: false,
    };
  }
  return {
    intensity: "high",
    visual: "red",
    title:
      "🚨 위험 신호! 이 조건으로 계약하면 보증금을 돌려받지 못할 수\n있어요. 반드시 법무사 검토 후 진행하세요",
    buttonLabel: "지금 즉시 법무사 연결받기 →",
    href,
    external: false,
  };
}

/** 예상 대출한도(원). <1억 약함, 1~3억 중간, 초과 강함 */
export function getAffordabilityCta(expectedLoanLimitWon: number): HomeAtozCtaSpec {
  const l = Math.max(0, expectedLoanLimitWon);
  const href = consultHref("대출상담사");

  if (l < 100_000_000) {
    return {
      intensity: "low",
      visual: "default",
      title: "대출 규모가 작아요. 금리 조건 비교 상담 받아보세요",
      buttonLabel: "대출상담사 무료 상담 →",
      href,
      external: false,
    };
  }
  if (l <= 300_000_000) {
    return {
      intensity: "mid",
      visual: "default",
      title: "대출 조건에 따라 월 상환액 차이가 커요. 최적 상품을 비교해보세요",
      buttonLabel: "대출상담사에게 무료 상담받기 →",
      href,
      external: false,
    };
  }
  return {
    intensity: "high",
    visual: "blue",
    title:
      "💰 대규모 대출이 필요해요. 금리 0.1% 차이가 수백만원입니다.\n지금 바로 대출상담사 무료 비교상담 받으세요",
    buttonLabel: "지금 바로 대출상담사 연결 →",
    href,
    external: false,
  };
}

/**
 * 연간 수익률(%). 양도차익은 추후 `opts`로 밴드 상향 등 확장 가능.
 * 외부 링크는 findtax.kr 고정.
 */
export function getInvestmentCta(
  annualReturnPercent: number,
  _opts?: { transferGainWon?: number },
): HomeAtozCtaSpec {
  const y = Number.isFinite(annualReturnPercent) ? annualReturnPercent : 0;

  if (y < 3) {
    return {
      intensity: "low",
      visual: "default",
      title: "수익률이 낮아요. 절세 전략으로 실수익을 높여보세요",
      buttonLabel: "세무사 무료 상담 (findtax.kr) →",
      href: FINDTAX_ORIGIN,
      external: true,
    };
  }
  if (y <= 8) {
    return {
      intensity: "mid",
      visual: "default",
      title: "양도 시점과 보유기간에 따라 세금이 달라져요. 절세 포인트 확인해보세요",
      buttonLabel: "세무사에게 절세 전략 받기 →",
      href: FINDTAX_ORIGIN,
      external: true,
    };
  }
  return {
    intensity: "high",
    visual: "amber",
    title:
      "📈 수익이 크면 세금도 커요. 지금 세무사 상담으로 절세하면\n실수익률이 달라집니다",
    buttonLabel: "지금 세무사 무료 상담 →",
    href: FINDTAX_ORIGIN,
    external: true,
  };
}

export function ctaBoxClass(visual: CtaVisualVariant): string {
  switch (visual) {
    case "orange":
      return "border-orange-400 bg-orange-50 text-orange-950";
    case "red":
      return "border-red-400 bg-red-50 text-red-950";
    case "blue":
      return "border-blue-600 bg-blue-50 text-blue-950";
    case "amber":
      return "border-amber-500 bg-amber-50 text-amber-950";
    default:
      return "border-sky-300 bg-sky-50 text-sky-950";
  }
}
