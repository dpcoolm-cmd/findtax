import type { AffiliateOffer } from "@/config/affiliate-offers";

/** 글 첫 부분 대가성 문구(공정위 추천·보증 심사지침: 첫 부분 표시, '지급받습니다' 표현). */
export function AffiliateDisclosure({ offer }: { offer: AffiliateOffer }) {
  return (
    <p className="mt-3 rounded-md bg-bg-muted px-3 py-2 text-xs leading-5 text-neutral-700">
      <span className="font-bold text-ink">광고</span> · 이 글에는 제휴 광고 링크가 포함되어 있으며, 링크를 통해{" "}
      {offer.disclosureAction}이 발생하면 FindTax는 제휴사로부터 수수료를 지급받습니다.
    </p>
  );
}

export function AffiliateOfferCard({ offer }: { offer: AffiliateOffer }) {
  return (
    <aside aria-label="제휴 광고" className="mt-6 rounded-lg border border-line bg-white p-6">
      <p className="text-xs font-bold text-neutral-500">{offer.eyebrow}</p>
      <h2 className="mt-2 text-xl font-black leading-snug text-ink">{offer.title}</h2>
      <p className="mt-3 text-sm leading-6 text-neutral-700">{offer.description}</p>
      <a
        href={`/go/${offer.id}`}
        target="_blank"
        rel="sponsored nofollow noopener"
        className="mt-5 inline-flex min-h-12 items-center justify-center rounded-lg border border-ink px-5 text-sm font-bold text-ink transition-colors hover:bg-bg-muted"
      >
        {offer.buttonLabel}
      </a>
      <p className="mt-3 text-xs leading-5 text-neutral-500">{offer.notice}</p>
    </aside>
  );
}
