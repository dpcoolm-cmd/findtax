const BOT_USER_AGENT_RE =
  /googlebot|adsbot-google|bingbot|applebot|yeti|naverbot|daumoa|yandexbot|baiduspider|duckduckbot|headlesschrome|crawler|spider|semrush|ahrefsbot|slurp|bot\.html|compatible;\s*[a-z0-9_-]*bot/i;

const TEST_MARKER_RE =
  /(?:^|[\/_-])(codex|playwright|api-test|e2e|test)(?:[\/_-]|$)|localhost|127\.0\.0\.1/i;

export function isBotUserAgent(userAgent: string | null) {
  return BOT_USER_AGENT_RE.test(userAgent ?? "");
}

export function isLocalRequest(req: Request) {
  const host = new URL(req.url).hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

export function isLikelyTestValue(value: unknown) {
  return typeof value === "string" && TEST_MARKER_RE.test(value);
}
