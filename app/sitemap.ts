import type { MetadataRoute } from "next";
import { getAllBlogSlugs } from "@/lib/blog/posts";
import { CALCULATOR_SLUGS } from "@/lib/seo/calculators";
import { getBaseUrl } from "@/lib/seo/site";
import {
  calculatorPath,
  regionSidoPath,
  regionSigunguPath,
  situationPath,
} from "@/lib/seo/urls";
import { TAX_SITUATIONS } from "@/lib/situations";
import { listActiveRegionPairs } from "@/lib/tax-accountants";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl().replace(/\/$/, "");
  const now = new Date();
  const baseEntry = {
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  };

  const urls: MetadataRoute.Sitemap = [
    { url: `${base}/`, ...baseEntry, priority: 1 },
    { url: `${base}/consult`, ...baseEntry, priority: 0.9 },
    { url: `${base}/register`, ...baseEntry, priority: 0.85 },
    { url: `${base}/blog`, ...baseEntry, priority: 0.82 },
    { url: `${base}/situation`, ...baseEntry, priority: 0.8 },
    { url: `${base}/calculator`, ...baseEntry, priority: 0.86 },
    { url: `${base}/calculator/jangbu`, ...baseEntry, priority: 0.72 },
    { url: `${base}/about`, ...baseEntry, priority: 0.5 },
    { url: `${base}/editorial-policy`, ...baseEntry, priority: 0.4 },
    { url: `${base}/terms`, ...baseEntry, priority: 0.3 },
    { url: `${base}/privacy`, ...baseEntry, priority: 0.3 },
  ];

  for (const slug of getAllBlogSlugs()) {
    urls.push({
      url: `${base}/blog/${slug}`,
      ...baseEntry,
      priority: 0.76,
    });
  }

  const activeRegionPairs = await listActiveRegionPairs();
  const activeSidos = [...new Set(activeRegionPairs.map((row) => row.sido))];

  for (const sido of activeSidos) {
    urls.push({
      url: `${base}${regionSidoPath(sido)}`,
      ...baseEntry,
      priority: 0.85,
    });
  }

  for (const row of activeRegionPairs) {
    urls.push({
      url: `${base}${regionSigunguPath(row.sido, row.sigungu)}`,
      ...baseEntry,
      priority: 0.8,
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

  return urls;
}
