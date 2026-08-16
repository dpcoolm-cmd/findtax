import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl().replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: "Mediapartners-Google",
        allow: "/",
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: (() => {
      try {
        return new URL(base).host;
      } catch {
        return undefined;
      }
    })(),
  };
}
