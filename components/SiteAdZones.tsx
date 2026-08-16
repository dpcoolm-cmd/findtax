"use client";

import { AdBanner } from "@/components/AdBanner";
import { isAdEligiblePath } from "@/lib/seo/ad-eligibility";
import { getAdSlot } from "@/lib/seo/ads";
import { usePathname } from "next/navigation";

function hasAdSense(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID);
}

function useCanShowAds(): boolean {
  return isAdEligiblePath(usePathname());
}

export function SiteAdTop() {
  const canShowAds = useCanShowAds();
  const slot = getAdSlot("top");
  if (!canShowAds || !hasAdSense() || !slot) return null;
  return (
    <div className="ad-slot-zone mx-auto w-full max-w-5xl px-4 pt-3 sm:px-6">
      <AdBanner slot={slot} />
    </div>
  );
}

export function SiteAdMid() {
  const canShowAds = useCanShowAds();
  const slot = getAdSlot("mid");
  if (!canShowAds || !hasAdSense() || !slot) return null;
  return (
    <div className="ad-slot-zone mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <AdBanner slot={slot} />
    </div>
  );
}

export function SiteAdFooter() {
  const canShowAds = useCanShowAds();
  const slot = getAdSlot("footer");
  if (!canShowAds || !hasAdSense() || !slot) return null;
  return (
    <div className="ad-slot-zone mx-auto w-full max-w-5xl px-4 pb-4 sm:px-6">
      <AdBanner slot={slot} />
    </div>
  );
}
