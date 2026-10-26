import test from "node:test";
import assert from "node:assert/strict";
import { compareShopping, evaluateJapan, evaluateReturn, type Goods, type JapanInput } from "../lib/calculators/travel-customs.ts";

const general = (valueUsd: number): Goods => ({ kind: "general", valueUsd, quantity: 1 });
const returning = (goods: Goods[]) => evaluateReturn({ arrivalDate: "2026-10-26", commercial: false, adult: true, goods });

test("one allowance per traveler with inclusive 800 dollar boundary", () => {
  assert.equal(returning([general(799)]).eligibility, "WITHIN_LIMIT");
  assert.equal(returning([general(800)]).taxKrw, 0);
  assert.equal(returning([general(801)]).taxKrw, null);
  assert.equal(returning([general(500), general(400)]).generalUsd, 900);
  assert.equal(returning([general(500), general(400)]).eligibility, "OVER_LIMIT");
});

test("alcohol uses combined volume and value, not bottle count", () => {
  const bottle = (quantity: number, unitMl: number, valueUsd = 350): Goods => ({ kind: "alcohol", quantity, unitMl, valueUsd });
  assert.equal(returning([bottle(3, 500)]).eligibility, "WITHIN_LIMIT");
  assert.equal(returning([bottle(2, 700)]).eligibility, "WITHIN_LIMIT");
  assert.equal(returning([bottle(3, 700)]).eligibility, "OVER_LIMIT");
  assert.equal(returning([bottle(2, 1000, 400)]).eligibility, "WITHIN_LIMIT");
  assert.equal(returning([bottle(2, 1000, 401)]).eligibility, "OVER_LIMIT");
  assert.equal(returning([bottle(1, 2001, 400)]).taxKrw, null);
});

test("perfume, cigarettes, minors, commercial goods and unknown values", () => {
  assert.equal(returning([{ kind: "perfume", quantity: 1, valueUsd: 30, unitMl: 100 }]).eligibility, "WITHIN_LIMIT");
  assert.equal(returning([{ kind: "perfume", quantity: 1, valueUsd: 30, unitMl: 101 }]).eligibility, "OVER_LIMIT");
  assert.equal(returning([{ kind: "cigarettes", quantity: 1, valueUsd: 30, sticks: 200 }]).eligibility, "WITHIN_LIMIT");
  assert.equal(returning([{ kind: "cigarettes", quantity: 1, valueUsd: 30, sticks: 201 }]).eligibility, "OVER_LIMIT");
  assert.equal(evaluateReturn({ arrivalDate: "2026-10-26", adult: false, commercial: false, goods: [{ kind: "alcohol", quantity: 1, unitMl: 500, valueUsd: 100 }] }).eligibility, "OVER_LIMIT");
  assert.equal(evaluateReturn({ arrivalDate: "2026-10-26", adult: true, commercial: true, goods: [general(100)] }).eligibility, "NOT_APPLICABLE");
  assert.equal(returning([{ kind: "general", quantity: 1, valueUsd: null }]).eligibility, "REVIEW_REQUIRED");
  assert.equal(returning([{ kind: "luxury", quantity: 1, valueUsd: 2000 }]).taxKrw, null);
});

const japanBase: JapanInput = { purchaseDate: "2026-11-01", departureDate: "2026-11-20", taxIncludedYen: 110000, taxRate: 10, sameStoreDayTaxExcludedYen: 100000, eligibleStore: true, eligibleTraveler: true, allGoodsExported: true, customsConfirmed: false, refundReceivedYen: null, feeYen: null };
test("Japan date change and tax-inclusive reverse calculation", () => {
  assert.equal(evaluateJapan({ ...japanBase, purchaseDate: "2026-10-31" }).regime, "legacy");
  assert.equal(evaluateJapan(japanBase).regime, "refund");
  assert.equal(evaluateJapan(japanBase).taxEquivalentYen, 10000);
  assert.equal(evaluateJapan({ ...japanBase, taxIncludedYen: 10800, taxRate: 8 }).taxEquivalentYen, 800);
  assert.equal(evaluateJapan({ ...japanBase, sameStoreDayTaxExcludedYen: 4999 }).eligibleCandidate, false);
  assert.equal(evaluateJapan({ ...japanBase, sameStoreDayTaxExcludedYen: 5000 }).eligibleCandidate, true);
  assert.equal(evaluateJapan({ ...japanBase, allGoodsExported: false }).eligibleCandidate, false);
  assert.equal(evaluateJapan({ ...japanBase, departureDate: "2027-01-31" }).eligibleCandidate, false);
  assert.equal(evaluateJapan({ ...japanBase, refundReceivedYen: 10000 }).receivedYen, null);
  assert.equal(evaluateJapan({ ...japanBase, customsConfirmed: true, refundReceivedYen: 10000 }).receivedYen, 10000);
});

test("unknown Korean tax or refund blocks a definitive saving", () => {
  assert.equal(compareShopping(330000, 390000, null, 30000).differenceKrw, null);
  assert.equal(compareShopping(330000, 390000, 0, null).differenceKrw, null);
  assert.equal(compareShopping(330000, 390000, 0, 30000).differenceKrw, 90000);
});
