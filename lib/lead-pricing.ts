/**
 * Lead unlock pricing keys mirror `app_settings.lead_pricing` in Supabase.
 * Do not scatter magic numbers for unlock costs in UI or API — use this map + DB.
 */
import {
  FOUNDER_LEAD_UNLOCK_PRICE_MULTIPLIER,
  LEAD_PRICING,
} from "@/config/lead-policy";

export { LEAD_PRICING };

export type LeadPricingSituation = keyof typeof LEAD_PRICING;

export function getLeadUnlockBaseAmount(situation: string): number {
  const k = situation as LeadPricingSituation;
  if (k in LEAD_PRICING && k !== "default") {
    return LEAD_PRICING[k];
  }
  return LEAD_PRICING.default;
}

export function getLeadUnlockCharge(
  situation: string,
  opts: { founderDiscountActive: boolean },
): number {
  const base = getLeadUnlockBaseAmount(situation);
  if (opts.founderDiscountActive) {
    return Math.ceil(base * FOUNDER_LEAD_UNLOCK_PRICE_MULTIPLIER);
  }
  return base;
}
