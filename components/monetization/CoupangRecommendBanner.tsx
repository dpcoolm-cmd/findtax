"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    PartnersCoupang?: {
      G: new (options: {
        id: number;
        template: string;
        trackingCode: string;
        width: string;
        height: string;
        tsource: string;
      }) => unknown;
    };
  }
}

const SCRIPT_ID = "coupang-partners-script";
const COUPANG_WIDGET_SELECTOR = 'iframe[src*="ads-partners.coupang.com/widgets.html"]';
const TARGET_WIDGET_SELECTOR =
  'iframe[src*="ads-partners.coupang.com/widgets.html?id=1007781"]';

function loadScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.PartnersCoupang) {
      resolve();
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://ads-partners.coupang.com/g.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
}

export default function CoupangRecommendBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const bannerContainer = container;

    let cancelled = false;

    const reconcileWidgets = () => {
      if (cancelled) return;

      const widgets = Array.from(
        document.querySelectorAll<HTMLIFrameElement>(COUPANG_WIDGET_SELECTOR),
      );
      const target =
        widgets.find((widget) => widget.matches(TARGET_WIDGET_SELECTOR)) ?? widgets[0];

      if (!target) return;

      if (target.parentElement !== container) {
        container.appendChild(target);
      }

      target.setAttribute("title", "쿠팡 추천상품");
      target.setAttribute(
        "width",
        String(Math.max(280, Math.floor(container.getBoundingClientRect().width))),
      );
      target.style.display = "block";
      target.style.margin = "0 auto";
      target.style.maxWidth = "100%";
      target.style.minWidth = "0";
      target.style.width = "100%";
      target.style.boxSizing = "border-box";
      setIsReady(true);

      widgets
        .filter((widget) => widget !== target)
        .forEach((widget) => widget.remove());
    };

    const observer = new MutationObserver(reconcileWidgets);
    observer.observe(document.body, { childList: true, subtree: true });

    async function render() {
      try {
        await loadScript();
        if (cancelled || !window.PartnersCoupang) return;

        reconcileWidgets();

        if (!document.querySelector(COUPANG_WIDGET_SELECTOR)) {
          new window.PartnersCoupang.G({
            id: 1007781,
            template: "carousel",
            trackingCode: "AF9635676",
            width: String(Math.max(280, Math.min(860, bannerContainer.clientWidth || 860))),
            height: "110",
            tsource: "",
          });
        }

        window.setTimeout(reconcileWidgets, 400);
        window.setTimeout(reconcileWidgets, 1200);
      } catch {
        // Coupang script failure must not affect page rendering.
      }
    }

    void render();

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  return (
    <aside
      aria-label="쿠팡 추천상품 고정 배너"
      data-coupang-recommend-banner="true"
      aria-hidden={!isReady}
      className={`fixed inset-x-0 bottom-0 z-50 overflow-x-hidden border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.1)] backdrop-blur transition-opacity ${isReady ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <div className="mx-auto min-w-0 w-full max-w-[860px] px-2 py-2">
        <div className="h-[110px] min-w-0 overflow-hidden rounded-lg bg-white">
          <div
            ref={containerRef}
            aria-label="쿠팡 추천상품"
            data-coupang-recommend-slot="true"
            className="flex h-[110px] min-w-0 w-full items-center justify-center overflow-hidden [&_iframe]:mx-auto [&_iframe]:block [&_iframe]:min-w-0 [&_iframe]:w-full [&_iframe]:max-w-full"
          />
        </div>
      </div>
    </aside>
  );
}
