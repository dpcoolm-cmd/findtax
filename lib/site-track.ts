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
  "calculator_type",
  "blog_slug",
  "target",
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

let previousPageLocation: string | null = null;

function googleAnalyticsPayload(eventType: string, payload: Record<string, unknown>) {
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
  if (eventType === "page_view" && typeof sanitized.path === "string" && typeof window !== "undefined") {
    const pageUrl = new URL(window.location.href);
    pageUrl.pathname = sanitized.path;
    pageUrl.search = "";
    const currentParams = new URLSearchParams(window.location.search);
    for (const key of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "gclid",
      "dclid",
      "gbraid",
      "wbraid",
    ]) {
      const value = currentParams.get(key);
      if (value) pageUrl.searchParams.set(key, value);
    }
    pageUrl.hash = "";
    sanitized.page_location = pageUrl.toString();
    if (previousPageLocation) {
      sanitized.page_referrer = previousPageLocation;
    } else if (typeof sanitized.page_referrer === "string" && sanitized.page_referrer) {
      try {
        const referrerUrl = new URL(sanitized.page_referrer);
        sanitized.page_referrer = `${referrerUrl.origin}${referrerUrl.pathname}`;
      } catch {
        delete sanitized.page_referrer;
      }
    }
    previousPageLocation = `${pageUrl.origin}${pageUrl.pathname}`;
  }
  delete sanitized.path;
  delete sanitized.title;
  delete sanitized.referrer;
  return sanitized;
}

function isInternalTraffic(): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem("_ft_internal") === "1";
  } catch {
    return false;
  }
}

export function trackGoogleEvent(eventType: string, payload: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  if (isInternalTraffic()) return;
  try {
    window.gtag("event", eventType, googleAnalyticsPayload(eventType, payload));
  } catch {
    // Analytics failure must never affect the user flow.
  }
}

export function trackSiteEvent(eventType: string, payload: Record<string, unknown>): void {
  if (isInternalTraffic()) return;
  trackGoogleEvent(eventType, payload);
  void fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      eventType,
      payload,
    }),
  }).catch(() => undefined);
}
