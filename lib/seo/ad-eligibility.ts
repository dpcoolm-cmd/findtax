const AD_EXCLUDED_PREFIXES = [
  "/about",
  "/admin",
  "/api",
  "/auth",
  "/case",
  "/consult",
  "/editorial-policy",
  "/my-taxes",
  "/partner",
  "/privacy",
  "/register",
  "/support",
  "/terms",
] as const;

export function isAdEligiblePath(pathname: string): boolean {
  return !AD_EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
