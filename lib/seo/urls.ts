import { getBaseUrl } from "@/lib/seo/site";

export function absoluteUrl(path: string): string {
  const base = getBaseUrl().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function regionSidoPath(sido: string): string {
  return `/region/${encodeURIComponent(sido)}`;
}

export function regionSigunguPath(sido: string, sigungu: string): string {
  return `/region/${encodeURIComponent(sido)}/${encodeURIComponent(sigungu)}`;
}

export function regionAccountantPath(
  sido: string,
  sigungu: string,
  slug: string,
): string {
  return `/region/${encodeURIComponent(sido)}/${encodeURIComponent(sigungu)}/${encodeURIComponent(slug)}`;
}

export function situationPath(situationId: string): string {
  return `/situation/${encodeURIComponent(situationId)}`;
}

export function calculatorPath(slug: string): string {
  return `/calculator/${encodeURIComponent(slug)}`;
}

export function taxAccountantProfilePath(id: string): string {
  return `/taxaccountant/${encodeURIComponent(id)}`;
}
