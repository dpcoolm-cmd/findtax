import fs from 'node:fs/promises';
const base = (process.env.AUDIT_BASE_URL || 'https://findtax.kr').replace(/\/$/, '');
const source = await fs.readFile(new URL('../lib/seo/calculators.ts', import.meta.url), 'utf8');
const paths = ['/calculator', ...new Set([...source.matchAll(/href: "(\/calculator\/[^"\n]+)"/g)].map(m => m[1]))];
const sitemapResponse = await fetch(`${base}/sitemap.xml`);
const sitemap = await sitemapResponse.text();
const rows = [];
for (const path of paths) {
  const response = await fetch(`${base}${path}`);
  const html = await response.text();
  const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
  const robots = html.match(/<meta[^>]*name="robots"[^>]*content="([^"]+)"/)?.[1] || '';
  const canonicalPath = canonical ? new URL(canonical).pathname : '';
  const row = { path: decodeURI(path), status: response.status, title: html.match(/<title>(.*?)<\/title>/s)?.[1], h1: [...html.matchAll(/<h1[\s>]/g)].length, canonical: decodeURI(canonicalPath) === decodeURI(path), indexable: !/noindex/i.test(robots + (response.headers.get('x-robots-tag') || '')), sitemap: sitemap.includes(canonical || '___'), guide: html.includes('계산 전 준비할 정보'), schema: html.includes('WebApplication') };
  rows.push(row);
}
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), base, sitemapStatus: sitemapResponse.status, rows }, null, 2));
if (rows.some(r => r.status !== 200 || r.h1 !== 1 || !r.canonical || !r.indexable || !r.sitemap)) process.exitCode = 1;
