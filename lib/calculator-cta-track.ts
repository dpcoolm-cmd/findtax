import type { CalculatorCtaSlug, ResultBand } from "@/lib/calculator-cta-bands";

/**
 * 계산기 CTA 클릭 → `/api/track` (Supabase `tracking_events`).
 * payload: calculator_type, result_band, clicked_cta_type (+ 클라이언트 시각은 서버 created_at).
 */
export function trackCalculatorCtaClick(input: {
  calculatorType: CalculatorCtaSlug;
  resultBand: ResultBand;
  clickedCtaType: "open_lead_modal";
}): void {
  const pagePath = typeof window !== "undefined" ? window.location.pathname : undefined;
  const referrer = typeof document !== "undefined" ? document.referrer : undefined;

  void fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType: "calculator_cta_click",
      payload: {
        calculator_type: input.calculatorType,
        result_band: input.resultBand,
        clicked_cta_type: input.clickedCtaType,
        path: pagePath,
        referrer,
        source: "findtax.kr",
      },
    }),
  });
}
