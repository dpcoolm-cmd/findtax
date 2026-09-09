import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CALCULATOR_DIRECTORY, calculatorGroup } from "../lib/seo/calculators.ts";
import { calculateRetirementIncome, RETIREMENT_DEFAULTS, validateRetirementInput } from "../lib/calculators/retirement-income.ts";

const flat = { ...RETIREMENT_DEFAULTS, currentAge: 60, retirementAge: 60, targetAge: 70,
  assetsWon: 120_000_000, monthlyContributionWon: 0, pensionMonthlyWon: 0,
  spendingMonthlyWon: 1_000_000, annualReturn: 0, inflation: 0 };
test("zero return matches exact monthly withdrawals and target boundary", () => {
  const result = calculateRetirementIncome(flat);
  assert.equal(result.points.at(-1)?.assetsWon, 0);
  assert.equal(result.depletionAfterMonths, null);
  assert.equal(result.additionalNeededWon, 0);
  assert.equal(calculateRetirementIncome({ ...flat, targetAge: 71 }).depletionAfterMonths, 120);
});
test("no assets identifies immediate gap, zero spending never depletes", () => {
  assert.equal(calculateRetirementIncome({ ...flat, assetsWon: 0 }).depletionAfterMonths, 0);
  assert.equal(calculateRetirementIncome({ ...flat, assetsWon: 0, spendingMonthlyWon: 0 }).depletionAfterMonths, null);
});
test("pension starts at specified age, not at retirement", () => {
  const r = calculateRetirementIncome({ ...flat, assetsWon: 0, pensionMonthlyWon: 1_000_000, pensionStartAge: 65 });
  assert.equal(r.firstMonthGapWon, 1_000_000);
  assert.equal(r.additionalNeededWon, 60_000_000);
  assert.equal(r.points[4].pensionWon, 0);
  assert.equal(r.points[5].pensionWon, 1_000_000);
});
test("income exceeds spending, surplus is not automatically invested", () => {
  const r = calculateRetirementIncome({ ...flat, pensionStartAge: 60, pensionMonthlyWon: 2_000_000 });
  assert.equal(r.depletionAfterMonths, null);
  assert.equal(r.points.at(-1)?.assetsWon, flat.assetsWon);
  assert.equal(r.additionalNeededWon, 0);
});
test("monthly contributions stop at retirement", () => {
  const r = calculateRetirementIncome({ ...flat, currentAge: 59, assetsWon: 0, monthlyContributionWon: 100_000 });
  assert.equal(r.retirementAssetsWon, 1_200_000);
});
test("discounted additional capital funds full horizon, including negative returns", () => {
  for (const rate of [-5, 0, 4, 15]) {
    const input = { ...flat, annualReturn: rate, inflation: 2, assetsWon: 0 };
    const need = calculateRetirementIncome(input).additionalNeededWon;
    const funded = calculateRetirementIncome({ ...input, assetsWon: need });
    assert.equal(funded.depletionAfterMonths, null);
    assert.ok(Math.abs(funded.points.at(-1)!.assetsWon) < 0.1);
  }
});
test("invalid, negative and inconsistent inputs are rejected", () => {
  for (const patch of [{ assetsWon: NaN }, { assetsWon: Infinity }, { assetsWon: -1 },
    { retirementAge: 59 }, { targetAge: 60 }, { currentAge: 45.5 }, { inflation: -1 }, { annualReturn: 16 }]) {
    assert.ok(validateRetirementInput({ ...flat, ...patch }).length);
    assert.throws(() => calculateRetirementIncome({ ...flat, ...patch }), RangeError);
  }
});
test("upper bounds and default scenarios remain finite", () => {
  for (const input of [RETIREMENT_DEFAULTS, { ...RETIREMENT_DEFAULTS, assetsWon: 1e12,
    currentAge: 18, retirementAge: 80, targetAge: 120, annualReturn: 15 }]) {
    const r = calculateRetirementIncome(input);
    assert.ok(Number.isFinite(r.retirementAssetsWon));
    assert.ok(r.points.every(p => Number.isFinite(p.assetsWon) && p.assetsWon >= 0));
  }
});

test("calculator directory preserves existing links and groups the two pension tools", () => {
  assert.equal(CALCULATOR_DIRECTORY.length, 14);
  assert.equal(new Set(CALCULATOR_DIRECTORY.map(i => i.href)).size, 14);
  assert.deepEqual(CALCULATOR_DIRECTORY.filter(i => calculatorGroup(i) === "연금·재무").map(i => i.key), ["year-end-tax", "retirement-income"]);
});
test("retirement uses a distinct page, keeps private inputs out of tracking and URLs", () => {
  const page = readFileSync(new URL("../app/calculator/retirement-income/page.tsx", import.meta.url), "utf8");
  const ui = readFileSync(new URL("../components/calculators/RetirementIncomeCalculator.tsx", import.meta.url), "utf8");
  const route = readFileSync(new URL("../app/api/track/route.ts", import.meta.url), "utf8");
  assert.doesNotMatch(page, /StickyPageLeadSection|Article|FAQPage/);
  assert.doesNotMatch(ui, /result-email|localStorage.setItem|history.replaceState/);
  const tracking = ui.slice(ui.indexOf("function track("), ui.indexOf("export function RetirementIncomeCalculator"));
  assert.doesNotMatch(tracking, /assetsWon|snapshot|spendingMonthlyWon|email/);
  for (const name of ["calculator_view", "calculator_start", "calculator_complete", "calculator_pdf_click", "related_calculator_click"]) assert.ok(route.includes(`"${name}"`));
});
