export type AdZone = "top" | "mid" | "footer";

const LEGACY = process.env.NEXT_PUBLIC_ADSENSE_BANNER_SLOT;

export function getAdSlot(zone: AdZone): string | undefined {
  const map: Record<AdZone, string | undefined> = {
    top: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ?? LEGACY,
    mid: process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID ?? LEGACY,
    footer: process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER ?? LEGACY,
  };
  return map[zone];
}
