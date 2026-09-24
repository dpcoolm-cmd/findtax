import test from "node:test";
import assert from "node:assert/strict";
import { calculateSavingsInterest, validateSavingsInterestInput, type SavingsInterestInput } from "../lib/calculators/savings-interest.ts";

const base: SavingsInterestInput = { productType: "deposit", principalWon: 10_000_000, monthlyPaymentWon: 0, annualRatePercent: 3, months: 12, taxType: "taxable" };

test("fixed deposit estimates annual simple interest and 15.4% withholding", () => {
  assert.deepEqual(calculateSavingsInterest(base), {
    paidPrincipalWon: 10_000_000,
    grossInterestWon: 300_000,
    withholdingTaxWon: 46_200,
    netInterestWon: 253_800,
    maturityAmountWon: 10_253_800,
  });
});

test("installment savings gives early deposits more interest", () => {
  const result = calculateSavingsInterest({ ...base, productType: "installment", principalWon: 0, monthlyPaymentWon: 500_000, months: 12 });
  assert.equal(result.paidPrincipalWon, 6_000_000);
  assert.equal(result.grossInterestWon, 97_500);
  assert.equal(result.withholdingTaxWon, 15_015);
  assert.equal(result.maturityAmountWon, 6_082_485);
});

test("tax-exempt scenario keeps all estimated interest", () => {
  const result = calculateSavingsInterest({ ...base, taxType: "tax-exempt" });
  assert.equal(result.withholdingTaxWon, 0);
  assert.equal(result.maturityAmountWon, 10_300_000);
});

test("zero rate, one month, and validation boundaries are handled", () => {
  assert.equal(calculateSavingsInterest({ ...base, annualRatePercent: 0, months: 1 }).maturityAmountWon, 10_000_000);
  assert.equal(validateSavingsInterestInput({ ...base, months: 0 })?.includes("기간"), true);
  assert.equal(validateSavingsInterestInput({ ...base, annualRatePercent: 31 })?.includes("연이율"), true);
});
