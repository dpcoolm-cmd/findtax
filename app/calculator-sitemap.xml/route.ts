import { CALCULATOR_DIRECTORY } from '@/lib/seo/calculators';
import { absoluteUrl } from '@/lib/seo/urls';

export const dynamic = 'force-static';
// The date records this release's content change, not the time of a crawler request.
export function GET() {
  const paths = ['/calculator', ...CALCULATOR_DIRECTORY.map(item => item.href)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${absoluteUrl(path)}</loc><lastmod>2026-10-11</lastmod></url>`).join('')}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
