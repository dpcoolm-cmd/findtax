"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackSiteEvent } from "@/lib/site-track";

function isBotLike() {
  const ua = navigator.userAgent.toLowerCase();
  return (
    /googlebot|adsbot-google|bingbot|applebot|yeti|naverbot|daumoa|yandexbot|baiduspider|duckduckbot|headlesschrome|crawler|spider|semrush|ahrefsbot|slurp|bot\.html|claude\/|compatible;\s*[a-z0-9_-]*bot/.test(
      ua,
    ) || navigator.webdriver === true
  );
}

function deviceType() {
  const ua = navigator.userAgent;
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  if (/Mobi|Android/i.test(ua)) return "mobile";
  return "desktop";
}

function trafficSource(referrer: string, params: URLSearchParams) {
  const utm = params.get("utm_source");
  if (utm) return utm;
  if (!referrer) return "direct";
  if (/naver\.com/i.test(referrer)) return "naver";
  if (/google\./i.test(referrer)) return "google";
  if (/facebook|instagram|twitter|tiktok|kakao/i.test(referrer)) return "social";
  return "referral";
}

function getStoredId(storage: Storage, key: string) {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const id = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  storage.setItem(key, id);
  return id;
}

function getSessionAttribution(referrer: string, params: URLSearchParams) {
  const key = "_ft_attribution";
  const existing = sessionStorage.getItem(key);
  if (existing) {
    try {
      return JSON.parse(existing) as {
        referrer: string;
        source: string;
        medium: string | null;
        campaign: string | null;
      };
    } catch {
      sessionStorage.removeItem(key);
    }
  }

  const attribution = {
    referrer,
    source: trafficSource(referrer, params),
    medium: params.get("utm_medium"),
    campaign: params.get("utm_campaign"),
  };
  sessionStorage.setItem(key, JSON.stringify(attribution));
  return attribution;
}

const ENGAGED_MS = 10_000;

export function SitePageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (isBotLike()) return;
    if (localStorage.getItem("_ft_internal") === "1") return;

    const params = new URLSearchParams(window.location.search);
    const referrer = document.referrer || "";
    const visitorId = getStoredId(localStorage, "_ft_vid");
    const sessionId = getStoredId(sessionStorage, "_ft_sid");
    const attribution = getSessionAttribution(referrer, params);

    const base = {
      path: pathname,
      source: attribution.source,
      medium: attribution.medium,
      campaign: attribution.campaign,
      device: deviceType(),
      visitorId,
      sessionId,
    };

    trackSiteEvent("page_view", {
      ...base,
      query: params.toString() || null,
      title: document.title,
      referrer: attribution.referrer,
    });

    // 실제 사람 방문 지표: 페이지에 10초 이상 머물고 스크롤·클릭·터치·키 입력이 있을 때 1회 기록.
    // 한 페이지만 열고 바로 닫는 자동화 브라우저를 걸러내는 용도.
    const startedAt = Date.now();
    let interacted = false;
    let sent = false;
    const trySend = () => {
      if (sent || !interacted || Date.now() - startedAt < ENGAGED_MS) return;
      sent = true;
      trackSiteEvent("page_engaged", { ...base, seconds: Math.round((Date.now() - startedAt) / 1000) });
      cleanup();
    };
    const onInteract = () => {
      interacted = true;
      trySend();
    };
    const timer = window.setTimeout(trySend, ENGAGED_MS);
    const events = ["scroll", "pointerdown", "keydown", "touchstart"] as const;
    for (const name of events) window.addEventListener(name, onInteract, { passive: true });
    function cleanup() {
      window.clearTimeout(timer);
      for (const name of events) window.removeEventListener(name, onInteract);
    }
    return cleanup;
  }, [pathname]);

  return null;
}
