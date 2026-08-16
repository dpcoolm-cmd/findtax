/**
 * 부가가치세 — 일반과세 10% 간이 계산
 *
 * - **간이·추정용**: 세액·공급가액을 정수 원 단위로 절사(floor)하는 흔한 역산식을 사용합니다.
 * - **정식 신고용 아님**: 영세·면세·매입세액공제·카드발행공제·간이과세·불공제 등 미반영.
 *
 * 모드:
 * - `calculateVatFromSupplyAmount`: **공급가액(과세표준)** 입력 → 부가세 = floor(공급가×10%), 합계 = 공급가+부가세
 * - `calculateVatFromGrossAmount`: **총액(세포함)** 입력 → 부가세 = floor(총액×10/110), 공급가액 = 총액−부가세
 */

const VAT_NUM = 10;
const VAT_DEN = 110;

export type VatFromSupplyResult = {
  supplyAmount: number;
  vat: number;
  grossTotal: number;
};

export type VatFromGrossResult = {
  grossTotal: number;
  vat: number;
  supplyAmount: number;
};

/** 공급가액(과세표준, 부가세 별도)이 주어졌을 때 부가세·합계금액 */
export function calculateVatFromSupplyAmount(supplyAmountWon: number): VatFromSupplyResult {
  const supply = Math.max(0, Math.floor(supplyAmountWon));
  const vat = Math.floor((supply * VAT_NUM) / 100);
  return {
    supplyAmount: supply,
    vat,
    grossTotal: supply + vat,
  };
}

/**
 * 부가세 포함 총액(거래금액)이 주어졌을 때 역산.
 * 부가세 = floor(총액 × 10 ÷ 110), 공급가액 = 총액 − 부가세 (원 미만 절사).
 */
export function calculateVatFromGrossAmount(grossTotalWon: number): VatFromGrossResult {
  const gross = Math.max(0, Math.floor(grossTotalWon));
  const vat = Math.floor((gross * VAT_NUM) / VAT_DEN);
  const supply = gross - vat;
  return {
    grossTotal: gross,
    vat,
    supplyAmount: supply,
  };
}
