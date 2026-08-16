/**
 * 리드 언락 포인트 — `app_settings.lead_pricing`(Supabase)과 동일 키·값을 유지하세요.
 * UI/API에서 원 단위를 직접 박지 말고 이 맵을 사용합니다.
 */

export const LEAD_PRICING = {
  default: 10_000,
  income_tax: 10_000,
  transfer_tax: 10_000,
  vat: 10_000,
  gift_tax: 10_000,
  other: 10_000,
  bookkeeping: 40_000,
  wealth_tax: 30_000,
  property_tax: 30_000,
} as const;

/** 파운더스 할인 적용 시 언락 비용 배수 (예: 0.8 = 20% 할인) */
export const FOUNDER_LEAD_UNLOCK_PRICE_MULTIPLIER = 0.8;
