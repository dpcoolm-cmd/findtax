import type { MetadataRoute } from "next";
import { BLOG_ARTICLES } from "@/lib/blog/posts";
import { CALCULATOR_SLUGS } from "@/lib/seo/calculators";
import { getBaseUrl } from "@/lib/seo/site";
import {
  calculatorPath,
  situationPath,
} from "@/lib/seo/urls";
import { TAX_SITUATIONS } from "@/lib/situations";
import { listIndexableRegions } from "@/lib/seo/region-index";
import { regionSidoPath, regionSigunguPath } from "@/lib/seo/urls";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl().replace(/\/$/, "");
  const baseEntry = {
    changeFrequency: "weekly" as const,
    priority: 0.8,
  };

  const urls: MetadataRoute.Sitemap = [
    { url: `${base}/`, ...baseEntry, priority: 1 },
    { url: `${base}/consult`, ...baseEntry, priority: 0.9 },
    { url: `${base}/blog`, ...baseEntry, priority: 0.82 },
    { url: `${base}/situation`, ...baseEntry, priority: 0.8 },
    { url: `${base}/calculator`, ...baseEntry, priority: 0.86 },
    { url: `${base}/calculator/jangbu`, ...baseEntry, priority: 0.72 },
    { url: `${base}/calculator/retirement-income`, ...baseEntry, lastModified: new Date("2026-09-06"), priority: 0.72 },
    { url: `${base}/calculator/savings-interest`, ...baseEntry, lastModified: new Date("2026-09-24"), priority: 0.78 },
    { url: `${base}/region`, ...baseEntry, priority: 0.5 },
    { url: `${base}/about`, ...baseEntry, priority: 0.5 },
    { url: `${base}/editorial-policy`, ...baseEntry, priority: 0.4 },
    { url: `${base}/terms`, ...baseEntry, priority: 0.3 },
    { url: `${base}/privacy`, ...baseEntry, priority: 0.3 },
  ];

  for (const article of BLOG_ARTICLES) {
    urls.push({
      url: `${base}/blog/${article.slug}`,
      ...baseEntry,
      lastModified: new Date(article.dateModified),
      priority: 0.76,
    });
  }

  for (const situation of TAX_SITUATIONS) {
    urls.push({
      url: `${base}${situationPath(situation.id)}`,
      ...baseEntry,
      priority: 0.78,
    });
  }

  for (const slug of CALCULATOR_SLUGS) {
    urls.push({
      url: `${base}${calculatorPath(slug)}`,
      ...baseEntry,
      priority: 0.72,
    });
  }

  // 공개 등록 사무소가 충분한 시·군·구와 그 시·도만 넣는다(개별 세무사 프로필은 제외).
  const regions = await listIndexableRegions();
  for (const sido of new Set(regions.map((r) => r.sido))) {
    urls.push({ url: `${base}${regionSidoPath(sido)}`, ...baseEntry, priority: 0.6 });
  }
  for (const r of regions) {
    urls.push({ url: `${base}${regionSigunguPath(r.sido, r.sigungu)}`, ...baseEntry, priority: 0.6 });
  }

  return urls;
}
