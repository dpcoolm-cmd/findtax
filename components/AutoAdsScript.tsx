"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

export function AutoAdsScript({ clientId }: { clientId: string }) {
  const pathname = usePathname();
  if (pathname === "/calculator/travel-customs") return null;

  return <Script
    id="google-adsense"
    async
    crossOrigin="anonymous"
    src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
    strategy="afterInteractive"
  />;
}
