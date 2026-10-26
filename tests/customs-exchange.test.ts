import test from "node:test";
import assert from "node:assert/strict";
import { parseCustomsExchangeXml, yenToUsd } from "../lib/calculators/customs-exchange.ts";

const xml = (jpy = "8.4277", importCode = "2") => `<response><header><resultCode>00</resultCode></header><body><items><item><currSgn>USD</currSgn><fxrt>1330.52</fxrt><aplyBgnDt>20261025</aplyBgnDt><imexTp>2</imexTp></item><item><currSgn>JPY</currSgn><fxrt>${jpy}</fxrt><aplyBgnDt>20261025</aplyBgnDt><imexTp>${importCode}</imexTp></item></items></body></response>`;

test("GW adapter accepts one dated import quote per currency without converting units", () => {
  assert.deepEqual(parseCustomsExchangeXml(xml(), "2026-10-26"), { ok: true, rates: [{ currency: "USD", rawRate: 1330.52, appliedFrom: "20261025" }, { currency: "JPY", rawRate: 8.4277, appliedFrom: "20261025" }] });
});
test("GW adapter rejects ambiguous or wrong-unit quotes", () => {
  assert.deepEqual(parseCustomsExchangeXml(xml("842.77"), "2026-10-26"), { ok: false, reason: "unit_or_rate_requires_review" });
  assert.deepEqual(parseCustomsExchangeXml(xml("8.4277", "1"), "2026-10-26"), { ok: false, reason: "not_import_rate" });
  assert.deepEqual(parseCustomsExchangeXml(xml(), "2026-10-24"), { ok: false, reason: "invalid_rate" });
});

test("JPY converts to USD equivalent only with valid same-period rates", () => {
  assert.ok(Math.abs(yenToUsd(210000, 8.4277, 1330.52)! - 1330.1694) < 0.001);
  assert.equal(yenToUsd(210000, 0, 1330.52), null);
  assert.equal(yenToUsd(Number.NaN, 8.4277, 1330.52), null);
});
