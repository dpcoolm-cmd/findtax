import { NextResponse } from "next/server";
import { getAffiliateOfferById } from "@/config/affiliate-offers";
import { insertTrackingEvent } from "@/lib/tracking";

export const dynamic = "force-dynamic";

// 봇·미리보기 요청은 제휴 클릭으로 넘기지 않는다(부정 클릭 방지).
const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|python|curl|wget|httpclient|axios|node-fetch/i;

const NO_INDEX = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" };

function sourcePath(referer: string | null): string | undefined {
  if (!referer) return undefined;
  try {
    const url = new URL(referer);
    return /(^|\.)findtax\.kr$/.test(url.hostname) ? decodeURIComponent(url.pathname) : undefined;
  } catch {
    return undefined;
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ offer: string }> }) {
  const { offer: offerId } = await params;
  const offer = getAffiliateOfferById(offerId);
  if (!offer) {
    return NextResponse.redirect(new URL("/", req.url), { status: 302, headers: NO_INDEX });
  }

  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT_UA.test(ua)) {
    return new NextResponse(null, { status: 204, headers: NO_INDEX });
  }

  const err = await insertTrackingEvent("affiliate_click", {
    offer_id: offer.id,
    network: offer.network,
    model: offer.model,
    path: sourcePath(req.headers.get("referer")),
  });
  if (err) console.error("[go] affiliate_click tracking failed", err);

  return NextResponse.redirect(offer.url, { status: 302, headers: NO_INDEX });
}
