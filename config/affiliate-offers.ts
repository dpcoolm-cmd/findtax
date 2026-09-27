/**
 * 제휴 광고(CPA/CPC) 오퍼 설정.
 *
 * 원칙
 * - 세무 상담·기장은 FindTax 자체 세무사 매칭으로 보낸다. 여기에는 FindTax가 직접 다루지 않는
 *   비경쟁 상품(개인회생·파산 상담, 세무회계 교육 등)만 둔다.
 * - 한 페이지에 제휴 카드는 최대 1개. 글 첫 부분에 대가성 문구를 함께 노출한다(공정위 지침).
 * - 링크는 /go/<id> 로 나가며 클릭을 기록한 뒤 제휴 URL로 302 이동한다.
 * - url이 비어 있거나 enabled=false면 어디에도 노출되지 않는다.
 *
 * 네트워크별 주의
 * - 애드릭스 CPC는 네이버·티스토리 클릭만 인정 → 자체 사이트에는 CPA 링크만 사용.
 * - 애드픽 클릭형은 한 사이트 3회 이상 도배 금지 → slugs를 2개 이하로 유지.
 */
export type AffiliateOffer = {
  id: string;
  network: "adlix" | "adpick" | "keytoo";
  model: "CPA" | "CPC";
  advertiser: string;
  url: string;
  enabled: boolean;
  /** 이 slug의 글에만 노출(우선 적용). */
  slugs?: string[];
  /** slug·제목이 일치하는 글에 노출. */
  match?: RegExp;
  eyebrow: string;
  title: string;
  description: string;
  buttonLabel: string;
  /** 카드 하단 광고 고지. */
  notice: string;
  /** 글 첫 부분 대가성 문구에 쓰는 행동 표현. */
  disclosureAction: string;
};

export const AFFILIATE_OFFERS: AffiliateOffer[] = [
  {
    id: "tax-course",
    network: "adpick",
    model: "CPC",
    advertiser: "전산세무회계 인강(애드픽 제휴)",
    url: "https://deg.kr/125d084",
    enabled: true,
    slugs: ["전산세무-전산회계-자격증-급수-차이", "간편장부-복식부기-기장의무-기준금액"],
    eyebrow: "광고 · 세무회계 공부",
    title: "장부를 직접 이해하고 싶다면, 전산세무회계부터",
    description:
      "간편장부·복식부기와 부가세 신고 흐름을 직접 익히고 싶은 사업자·직장인이라면 한국세무사회 전산세무회계 과정이 기본 틀을 잡는 데 도움이 됩니다. 제휴 인강의 수강 조건을 확인해 보세요.",
    buttonLabel: "전산세무회계 인강 살펴보기",
    notice: "제휴 광고입니다. 이 링크를 클릭하면 FindTax가 광고 수익을 지급받습니다.",
    disclosureAction: "링크 클릭",
  },
  {
    id: "rehab-paros",
    network: "adlix",
    model: "CPA",
    advertiser: "법무법인 파로스",
    url: "https://appu.kr/?i=12539186",
    enabled: true,
    match: /폐업|개인회생|파산|채무조정|빚|체납/,
    eyebrow: "광고 · 개인회생·파산 상담",
    title: "사업을 정리한 뒤 갚기 어려운 빚이 남았다면",
    description:
      "개인회생·파산은 법원 절차라 소득·재산·채무 구성에 따라 가능 여부와 비용이 달라집니다. 도산 사건을 다루는 법무법인에 상담을 신청해 본인 조건을 확인해 보세요. 세금 체납액은 개인회생에서도 전액 변제 대상이라는 점은 미리 알아 두세요.",
    buttonLabel: "파로스 개인회생 상담 신청하기",
    notice:
      "법무법인 파로스의 광고입니다. FindTax는 상담 내용이나 수임 조건에 관여하지 않으며, 상담 신청 시 제휴 수수료를 지급받습니다.",
    disclosureAction: "상담 신청",
  },
  {
    // 파로스 대체용(승인율 81%, 52,000원). 파로스 캠페인이 중단되면 enabled를 바꿔 켠다.
    id: "rehab-sinan",
    network: "adlix",
    model: "CPA",
    advertiser: "법률사무소 신안",
    url: "https://appu.kr/?i=12519296",
    enabled: false,
    match: /폐업|개인회생|파산|채무조정|빚/,
    eyebrow: "광고 · 개인회생·파산 상담",
    title: "사업을 정리한 뒤 갚기 어려운 빚이 남았다면",
    description:
      "개인회생·파산은 법원 절차라 소득·재산·채무 구성에 따라 가능 여부와 비용이 달라집니다. 회생·파산 사건을 다루는 법률사무소에 상담을 신청해 본인 조건을 확인해 보세요.",
    buttonLabel: "개인회생 상담 신청하기",
    notice:
      "법률사무소 신안의 광고입니다. FindTax는 상담 내용이나 수임 조건에 관여하지 않으며, 상담 신청 시 제휴 수수료를 지급받습니다.",
    disclosureAction: "상담 신청",
  },
  {
    // 기투DB '세금 환급/경정청구 무료조회'(승인 DB당 30,000원). 가입·링크 발급 후 url을 넣고 켠다.
    // 사업자 대상 글에는 자체 세무사 매칭이 우선이므로 직장인·프리랜서 환급 글에만 붙인다.
    id: "tax-refund-check",
    network: "keytoo",
    model: "CPA",
    advertiser: "세금 환급 조회 서비스",
    url: "",
    enabled: false,
    match: /경정청구|환급/,
    eyebrow: "광고 · 환급금 조회",
    title: "놓친 환급금이 있는지 조회해 보세요",
    description:
      "최근 5년 신고분 가운데 빠진 공제가 있으면 경정청구로 돌려받을 수 있습니다. 홈택스에서 직접 확인할 수도 있고, 조회 서비스를 이용할 수도 있습니다. 수수료 조건은 신청 전에 확인하세요.",
    buttonLabel: "환급금 조회하기",
    notice: "제휴 광고입니다. 조회 신청 시 FindTax가 제휴 수수료를 지급받습니다.",
    disclosureAction: "조회 신청",
  },
];

function isLive(offer: AffiliateOffer): boolean {
  return offer.enabled && offer.url.startsWith("https://");
}

export function getAffiliateOfferById(id: string): AffiliateOffer | undefined {
  const offer = AFFILIATE_OFFERS.find((item) => item.id === id);
  return offer && isLive(offer) ? offer : undefined;
}

/** 글에 붙일 제휴 오퍼 1개. 명시한 slug가 regex 매칭보다 우선한다. */
export function getAffiliateOfferForArticle(article: { slug: string; h1: string }): AffiliateOffer | undefined {
  const live = AFFILIATE_OFFERS.filter(isLive);
  const bySlug = live.find((offer) => offer.slugs?.includes(article.slug));
  if (bySlug) return bySlug;
  const subject = `${article.slug} ${article.h1}`;
  return live.find((offer) => offer.match?.test(subject));
}
