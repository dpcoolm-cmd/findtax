/**
 * 계산기 결과 세액 기반 CTA 문구 (전환 UX용 참고 문구, 법적 확정 아님).
 */

import type { CalculatorCtaSlug } from "@/lib/calculator-cta-bands";

export type DynamicCtaCopy = {
  title: string;
  /** 결과 해석에 필요한 추가 확인 항목 */
  subtitle?: string;
  buttonLabel: string;
};

const BTN = {
  weak: "절세 상담 받기",
  mid: "세금 손해 줄이는 상담 받기",
  strong: "지금 바로 세무사 연결받기 →",
} as const;

export function getDynamicCalculatorConsultCopy(
  slug: CalculatorCtaSlug,
  taxWon: number,
  extraWon?: number,
): DynamicCtaCopy {
  const t = Math.max(0, taxWon);

  if (slug === "comprehensive_income") {
    if (t < 500_000) {
      return { title: "계산 결과를 바탕으로 공제·신고·구조를 점검해 보세요.", buttonLabel: BTN.weak };
    }
    if (t < 3_000_000) {
      return {
        title: "이 구간은 적용 세법·공제 조합에 따라 실제 부담이 달라질 수 있어, 전문가 점검을 권장합니다.",
        subtitle: "누락 공제, 필요경비, 신고 유형을 실제 증빙 기준으로 확인해 보세요.",
        buttonLabel: BTN.mid,
      };
    }
    return {
      title: "금액 규모가 커지면 신고·쟁점 리스크도 커질 수 있습니다. 세무사 상담으로 방향을 잡아 보세요.",
      subtitle: "소득 구분, 필요경비, 공제 누락 여부에 따라 실제 신고액이 달라질 수 있습니다.",
      buttonLabel: BTN.strong,
    };
  }

  if (slug === "transfer_tax") {
    if (t < 10_000_000) {
      return { title: "계산 결과를 바탕으로 공제·신고·구조를 점검해 보세요.", buttonLabel: BTN.weak };
    }
    if (t < 50_000_000) {
      return {
        title: "이 구간은 적용 세법·공제 조합에 따라 실제 부담이 달라질 수 있어, 전문가 점검을 권장합니다.",
        subtitle: "보유·거주 기간과 비과세·필요경비 요건을 증빙과 함께 확인해 보세요.",
        buttonLabel: BTN.mid,
      };
    }
    return {
      title: "금액 규모가 커지면 신고·쟁점 리스크도 커질 수 있습니다. 세무사 상담으로 방향을 잡아 보세요.",
      subtitle: "고가주택 안분, 장기보유특별공제, 주택 수와 특례 적용 여부를 확인해야 합니다.",
      buttonLabel: BTN.strong,
    };
  }

  if (slug === "gift_tax") {
    if (t < 1_000_000) {
      return { title: "계산 결과를 바탕으로 공제·신고·구조를 점검해 보세요.", buttonLabel: BTN.weak };
    }
    if (t < 5_000_000) {
      return {
        title: "이 구간은 적용 세법·공제 조합에 따라 실제 부담이 달라질 수 있어, 전문가 점검을 권장합니다.",
        subtitle: "증여재산 공제 이력, 재산 평가액, 이전 증여 내역을 함께 확인해 보세요.",
        buttonLabel: BTN.mid,
      };
    }
    return {
      title: "금액 규모가 커지면 신고·쟁점 리스크도 커질 수 있습니다. 세무사 상담으로 방향을 잡아 보세요.",
      subtitle:
        "⚠️ 증여세가 큽니다. 부담부증여 등 절세 전략을 세무사에게 확인하세요.",
      buttonLabel: BTN.strong,
    };
  }

  // vat: 기존 밴드만 사용 — 호출부에서 처리
  return { title: "계산 결과를 바탕으로 공제·신고·구조를 점검해 보세요.", buttonLabel: BTN.weak };
}
