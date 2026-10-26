/** Parses import customs rates. fxrt is KRW per 1 unit of the foreign currency (verified against the customs calculator on 2026-10-26). */
export type CustomsRate = { currency: "USD" | "JPY"; rawRate: number; appliedFrom: string };
export type CustomsRateParse = { ok: true; rates: CustomsRate[] } | { ok: false; reason: string };

/** Converts a JPY purchase to its USD equivalent using the same customs-rate period. */
export function yenToUsd(yen: number, jpyKrw: number, usdKrw: number): number | null {
  if (![yen, jpyKrw, usdKrw].every(Number.isFinite) || yen <= 0 || jpyKrw <= 0 || usdKrw <= 0) return null;
  return (yen * jpyKrw) / usdKrw;
}

function tag(xml: string, name: string): string | null {
  const match = xml.match(new RegExp(`<${name}>([^<]*)</${name}>`, "i"));
  return match?.[1]?.trim() ?? null;
}

export function parseCustomsExchangeXml(xml: string, requestedDate: string): CustomsRateParse {
  if (xml.length > 1_000_000) return { ok: false, reason: "response_too_large" };
  if (tag(xml, "resultCode") !== "00") return { ok: false, reason: "upstream_error" };
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(match => match[1]);
  if (items.length === 0) return { ok: false, reason: "no_items" };
  const rates: CustomsRate[] = [];
  for (const item of items) {
    const currency = tag(item, "currSgn");
    if (currency !== "USD" && currency !== "JPY") continue;
    if (tag(item, "imexTp") !== "2") return { ok: false, reason: "not_import_rate" };
    const appliedFrom = tag(item, "aplyBgnDt");
    const rawRate = Number(tag(item, "fxrt"));
    if (!appliedFrom || !/^\d{8}$/.test(appliedFrom) || appliedFrom > requestedDate.replaceAll("-", "") || !Number.isFinite(rawRate) || rawRate <= 0) return { ok: false, reason: "invalid_rate" };
    // Guard against an unexpected quote unit or an implausible response.
    if ((currency === "USD" && (rawRate < 500 || rawRate > 3000)) || (currency === "JPY" && (rawRate < 1 || rawRate > 30))) return { ok: false, reason: "unit_or_rate_requires_review" };
    rates.push({ currency, rawRate, appliedFrom });
  }
  if (rates.filter(r => r.currency === "USD").length !== 1 || rates.filter(r => r.currency === "JPY").length !== 1) return { ok: false, reason: "missing_or_duplicate_currency" };
  return { ok: true, rates };
}
