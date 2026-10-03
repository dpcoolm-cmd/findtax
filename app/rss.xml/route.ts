import { BLOG_ARTICLES } from "@/lib/blog/posts";
import { getBaseUrl } from "@/lib/seo/site";
export const revalidate = 3600;
function xml(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
export function GET() {
  const base = getBaseUrl().replace(/\/$/, "");
  const items = [...BLOG_ARTICLES].sort((a, b) => b.datePublished.localeCompare(a.datePublished)).slice(0, 30);
  const body = items.map(article => {
    const url = `${base}/blog/${encodeURIComponent(article.slug)}`;
    return `<item><title>${xml(article.h1)}</title><link>${xml(url)}</link><guid isPermaLink="true">${xml(url)}</guid><description>${xml(article.metaDescription)}</description><pubDate>${new Date(article.datePublished).toUTCString()}</pubDate></item>`;
  }).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>FindTax 세금 가이드</title><link>${xml(base)}</link><description>세금 계산과 신고 준비를 위한 FindTax 가이드</description><language>ko</language><atom:link href="${xml(base)}/rss.xml" rel="self" type="application/rss+xml"/>${body}</channel></rss>`, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" } });
}
