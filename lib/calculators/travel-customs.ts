// Rules are effective-dated so a later policy revision cannot silently change old results.
export const TRAVEL_RULES = {
  effectiveFrom: "2026-10-26",
  verifiedOn: "2026-10-26",
  generalUsd: 800,
  alcoholMl: 2000,
  alcoholUsd: 400,
  perfumeMl: 100,
  cigarettes: 200,
} as const;

export type GoodsKind = "general" | "clothing" | "alcohol" | "perfume" | "cigarettes" | "luxury";
export type Eligibility = "WITHIN_LIMIT" | "OVER_LIMIT" | "REVIEW_REQUIRED" | "NOT_APPLICABLE";
export type Goods = { kind: GoodsKind; valueUsd: number | null; quantity: number; unitMl?: number; sticks?: number };
export type ReturnInput = { arrivalDate: string; commercial: boolean; adult: boolean; goods: Goods[] };
export type ReturnResult = { eligibility: Eligibility; taxKrw: number | null; generalUsd: number; alcoholUsd: number; alcoholMl: number; perfumeMl: number; cigarettes: number; reasons: string[] };

function validIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function evaluateReturn(input: ReturnInput): ReturnResult {
  const totals = { generalUsd: 0, alcoholUsd: 0, alcoholMl: 0, perfumeMl: 0, cigarettes: 0 };
  const reasons: string[] = [];
  let over = false;
  let review = false;
  if (input.commercial) return { eligibility: "NOT_APPLICABLE", taxKrw: null, ...totals, reasons: ["판매·업무용 물품에는 여행자 휴대품 면세 기준을 적용할 수 없습니다."] };
  if (!validIsoDate(input.arrivalDate) || input.arrivalDate < TRAVEL_RULES.effectiveFrom) review = true;
  if (!input.goods.length) review = true;
  for (const g of input.goods) {
    if (!Number.isInteger(g.quantity) || g.quantity < 1 || g.valueUsd === null || !Number.isFinite(g.valueUsd) || g.valueUsd <= 0) { review = true; continue; }
    if (g.kind === "general" || g.kind === "clothing") totals.generalUsd += g.valueUsd;
    else if (g.kind === "luxury") { review = true; reasons.push("고가품은 간이세율과 별도 세목 확인이 필요합니다."); }
    else if (g.kind === "alcohol") {
      totals.alcoholUsd += g.valueUsd;
      if (!g.unitMl || g.unitMl <= 0) review = true;
      else totals.alcoholMl += g.unitMl * g.quantity;
      if (!input.adult) { over = true; reasons.push("미성년자는 주류 별도 면세 대상이 아닙니다."); }
    } else if (g.kind === "perfume") {
      if (!g.unitMl || g.unitMl <= 0) review = true;
      else totals.perfumeMl += g.unitMl * g.quantity;
    } else if (g.kind === "cigarettes") {
      if (!g.sticks || !Number.isInteger(g.sticks) || g.sticks <= 0) review = true;
      else totals.cigarettes += g.sticks * g.quantity;
      if (!input.adult) { over = true; reasons.push("미성년자는 담배 별도 면세 대상이 아닙니다."); }
    }
  }
  if (totals.generalUsd > TRAVEL_RULES.generalUsd) { over = true; reasons.push("일반 물품은 품목별이 아닌 여행자 1인의 합계로 800달러를 비교합니다."); }
  if (totals.alcoholUsd > TRAVEL_RULES.alcoholUsd || totals.alcoholMl > TRAVEL_RULES.alcoholMl) { over = true; reasons.push("주류는 병 수와 무관하게 총 2L와 총 400달러를 모두 충족해야 합니다."); }
  if (totals.perfumeMl > TRAVEL_RULES.perfumeMl) { over = true; reasons.push("향수 총 용량이 별도 면세 범위 100mL를 넘습니다."); }
  if (totals.cigarettes > TRAVEL_RULES.cigarettes) { over = true; reasons.push("궐련 총 개비 수가 별도 면세 범위 200개비를 넘습니다."); }
  if (review) reasons.push("가격·수량·용량 또는 품목 분류와 적용일을 확인해야 합니다.");
  if (!over && !review) reasons.push("입력한 물품 기준으로 확인된 면세 범위 안입니다. 다른 반입 물품·검역·신고 의무는 별도 확인하세요.");
  return { eligibility: review ? "REVIEW_REQUIRED" : over ? "OVER_LIMIT" : "WITHIN_LIMIT", taxKrw: !over && !review ? 0 : null, ...totals, reasons };
}

export type JapanInput = { purchaseDate: string; departureDate: string; taxIncludedYen: number; taxRate: 8 | 10; sameStoreDayTaxExcludedYen: number | null; eligibleStore: boolean; eligibleTraveler: boolean; allGoodsExported: boolean; customsConfirmed: boolean; refundReceivedYen: number | null; feeYen: number | null };
export type JapanResult = { regime: "legacy" | "refund"; taxEquivalentYen: number; eligibleCandidate: boolean; receivedYen: number | null; reasons: string[] };
export function evaluateJapan(i: JapanInput): JapanResult {
  const regime = i.purchaseDate >= "2026-11-01" ? "refund" : "legacy";
  const validPrice = Number.isFinite(i.taxIncludedYen) && i.taxIncludedYen > 0;
  const taxEquivalentYen = validPrice ? Math.round(i.taxIncludedYen * i.taxRate / (100 + i.taxRate)) : 0;
  const reasons: string[] = [];
  const purchase = new Date(`${i.purchaseDate}T00:00:00Z`);
  const departure = new Date(`${i.departureDate}T00:00:00Z`);
  const days = Math.round((departure.getTime() - purchase.getTime()) / 86400000);
  const dateOk = validIsoDate(i.purchaseDate) && validIsoDate(i.departureDate) && Number.isFinite(days) && days >= 0 && days <= 90;
  if (regime === "legacy") reasons.push("2026년 10월 31일까지는 매장 구매 시 면세 방식입니다. 구매 당시 면세가격을 다시 환급액으로 차감하지 않습니다.");
  if (!dateOk && regime === "refund") reasons.push("구매일부터 90일 이내 일본 출국 세관 확인 요건을 다시 확인하세요.");
  const eligibleCandidate = regime === "refund" && validPrice && dateOk && i.eligibleStore && i.eligibleTraveler && i.allGoodsExported && i.sameStoreDayTaxExcludedYen !== null && i.sameStoreDayTaxExcludedYen >= 5000;
  if (!eligibleCandidate && regime === "refund") reasons.push("매장·여행자 자격, 같은 매장 같은 날 세전 5,000엔, 물품 전량 반출을 확인해야 합니다.");
  if (eligibleCandidate && !i.customsConfirmed) reasons.push("출국 전 세관 반출 확인이 필요합니다. 물품을 위탁수하물로 부치기 전에 확인하세요.");
  if (eligibleCandidate && i.customsConfirmed && i.refundReceivedYen === null) reasons.push("세관 확인과 실제 환급 지급은 별개입니다. 매장·환급사업자 지급을 확인하세요.");
  const receivedYen = eligibleCandidate && i.customsConfirmed && i.refundReceivedYen !== null && Number.isFinite(i.refundReceivedYen) && i.refundReceivedYen >= 0 && i.refundReceivedYen <= i.taxIncludedYen ? i.refundReceivedYen : null;
  return { regime, taxEquivalentYen, eligibleCandidate, receivedYen, reasons };
}

export function compareShopping(cardChargeKrw: number | null, domesticKrw: number | null, returnTaxKrw: number | null, receivedRefundKrw: number | null) {
  const valid = (n: number | null): n is number => n !== null && Number.isFinite(n) && n >= 0;
  const finalCostKrw = valid(cardChargeKrw) && valid(returnTaxKrw) && valid(receivedRefundKrw) ? cardChargeKrw + returnTaxKrw - receivedRefundKrw : null;
  return { finalCostKrw, differenceKrw: valid(domesticKrw) && finalCostKrw !== null ? domesticKrw - finalCostKrw : null };
}
