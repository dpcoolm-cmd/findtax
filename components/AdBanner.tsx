"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdBanner({
  slot,
  className = "",
}: {
  slot?: string;
  className?: string;
}) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (!client || !slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* ignore */
    }
  }, [client, slot]);

  if (!client || !slot) {
    return null;
  }

  return (
    <aside
      className={`ad-banner-root overflow-hidden rounded-xl bg-transparent ${className}`}
    >
      <ins
        key={slot}
        className="adsbygoogle block w-full"
        style={{ display: "block", minHeight: 0, height: "auto" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
