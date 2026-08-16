declare global {
  interface Window {
    gtag?: (command: "event", eventName: string, params?: Record<string, unknown>) => void;
  }
}

const GA_ALLOWED_KEYS = new Set([
  "path",
  "title",
  "referrer",
  "source",
  "medium",
  "campaign",
  "device",
  "calculatorType",
  "resultBand",
  "recommendation",
  "score",
  "taxpayerType",
  "annualRevenueManwon",
  "monthlySalesDocs",
  "monthlyPurchaseDocs",
  "clickedCtaType",
  "industry",
  "situation",
  "category",
  "destination",
  "placement",
  "caseType",
  "readinessScore",
  "complexityScore",
  "taskKey",
  "taskStatus",
  "reminderEnabled",
  "daysRemaining",
  "filingMethod",
  "complexityBand",
  "action",
]);

function googleAnalyticsPayload(payload: Record<string, unknown>) {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!GA_ALLOWED_KEYS.has(key)) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      sanitized[key] = value;
    }
  }

  if (typeof sanitized.path === "string") sanitized.page_path = sanitized.path;
  if (typeof sanitized.title === "string") sanitized.page_title = sanitized.title;
  if (typeof sanitized.referrer === "string") sanitized.page_referrer = sanitized.referrer;
  delete sanitized.path;
  delete sanitized.title;
  delete sanitized.referrer;
  return sanitized;
}

export function trackGoogleEvent(eventType: string, payload: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  if (window.localStorage.getItem("_ft_internal") === "1") return;
  try {
    window.gtag("event", eventType, googleAnalyticsPayload(payload));
  } catch {
    // Analytics failure must never affect the user flow.
  }
}

export function trackSiteEvent(eventType: string, payload: Record<string, unknown>): void {
  if (typeof window !== "undefined" && window.localStorage.getItem("_ft_internal") === "1") return;
  trackGoogleEvent(eventType, payload);
  void fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType,
      payload,
    }),
  }).catch(() => undefined);
}
