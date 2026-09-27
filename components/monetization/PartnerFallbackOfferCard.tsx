"use client";

import { useEffect, useState } from "react";
import { AffiliateOfferCard } from "@/components/monetization/AffiliateOfferCard";
import { PARTNER_FALLBACK_OFFER_ID, getAffiliateOfferById } from "@/config/affiliate-offers";

/** 승인된 파트너 세무사가 0명일 때만 제휴 세무사 광고를 보여준다(계산기 결과용). */
export function PartnerFallbackOfferCard() {
  const [show, setShow] = useState(false);
  const offer = getAffiliateOfferById(PARTNER_FALLBACK_OFFER_ID);

  useEffect(() => {
    if (!offer) return;
    let cancelled = false;
    fetch("/api/public-stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((stats: { partnersApproved?: number | null } | null) => {
        if (!cancelled && stats?.partnersApproved === 0) setShow(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [offer]);

  return offer && show ? <AffiliateOfferCard offer={offer} /> : null;
}
