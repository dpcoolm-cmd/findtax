/** 주택 취득세 참고 산출 (간이, 실제 면제·감면·지역별 세율 미전부 반영) */

export type AcquisitionHomeType = "one" | "two" | "three_or_corp" | "corp";
export type AcquisitionZone = "adjusted" | "normal";

const E6 = 600_000_000;
const E9 = 900_000_000;
/** 3억 (분모: 취득가액×2와 맞물리는 행안부 안내식 기준) */
const WON_3EOK = 300_000_000;

/**
 * 1주택 등 1~3% 누진 구간 (6억 이하 1%, 9억 초과 3%).
 * 6억 초과~9억 이하는 행정안전부 안내와 동일하게
 * `취득세율(%) = (취득가액 × 2 ÷ 3억) − 3` → 소수로는 `((가액×2/3억)−3)/100`.
 * 예: 7.5억 → (5−3)% = 2% → 취득세 1,500만원.
 */
export function progressiveRate1to3(priceWon: number): number {
  if (!Number.isFinite(priceWon)) return 0;
  const p = Math.max(0, priceWon);
  if (p <= E6) return 0.01;
  if (p <= E9) {
    const ratePercent = (p * 2) / WON_3EOK - 3;
    return ratePercent / 100;
  }
  return 0.03;
}

export function acquisitionTaxRate(input: {
  priceWon: number;
  homeType: AcquisitionHomeType;
  zone: AcquisitionZone;
}): number {
  const { priceWon, homeType, zone } = input;
  if (homeType === "corp" || homeType === "three_or_corp") return 0.12;
  if (homeType === "one") return progressiveRate1to3(priceWon);
  if (homeType === "two") {
    if (zone === "adjusted") return 0.08;
    return progressiveRate1to3(priceWon);
  }
  return progressiveRate1to3(priceWon);
}

export function calculateAcquisitionTax(input: {
  priceWon: number;
  homeType: AcquisitionHomeType;
  zone: AcquisitionZone;
}): {
  rate: number;
  acquisitionTax: number;
  localEducationTax: number;
  ruralSpecialTax: number;
} {
  const priceWon = input.priceWon;
  if (!Number.isFinite(priceWon) || priceWon <= 0) {
    return { rate: 0, acquisitionTax: 0, localEducationTax: 0, ruralSpecialTax: 0 };
  }
  const rate = acquisitionTaxRate({ ...input, priceWon });
  const acquisitionTax = Math.floor(priceWon * rate);
  const localEducationTax = Math.floor(acquisitionTax * 0.1);
  const ruralSpecialTax = 0;
  return { rate, acquisitionTax, localEducationTax, ruralSpecialTax };
}

export function explainAcquisitionTaxLines(input: {
  priceWon: number;
  homeType: AcquisitionHomeType;
  zone: AcquisitionZone;
}): string[] {
  const r = calculateAcquisitionTax(input);
  const ratePct = (r.rate * 100).toFixed(4).replace(/\.?0+$/, "");
  return [
    `적용 세율: ${ratePct}%`,
    `취득세 = floor(취득가액 × 세율) = floor(${input.priceWon.toLocaleString("ko-KR")} × ${r.rate}) = ${r.acquisitionTax.toLocaleString("ko-KR")}원`,
    `지방교육세 = floor(취득세 × 10%) = ${r.localEducationTax.toLocaleString("ko-KR")}원`,
  ];
}
