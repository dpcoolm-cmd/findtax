import { REGIONS, getSigunguBySido } from "@/lib/regions";
import {
  TAX_SITUATIONS,
  getSituationLabel,
  type TaxSituation,
} from "@/lib/situations";
import {
  absoluteUrl,
  calculatorPath,
  regionSigunguPath,
  situationPath,
} from "@/lib/seo/urls";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface InternalLink {
  href: string;
  label: string;
}

function deterministicPick<T>(
  arr: readonly T[],
  n: number,
  seed: string,
  exclude?: T,
): T[] {
  const filtered = [...arr].filter((x) => x !== exclude);
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out: T[] = [];
  while (out.length < n && filtered.length) {
    const i = h % filtered.length;
    out.push(filtered.splice(i, 1)[0]!);
    h = (h * 17 + 1) >>> 0;
  }
  return out;
}

export function buildMainIntroBody(): string {
  return (
    "우리동네 세무사는 전국 시·도와 시·군·구 단위로 세무사 사무실 정보를 정리하고, 무료 상담 신청을 통해 실제 사건을 맡을 수 있는 세무사와 연결해 드리는 리드 플랫폼입니다. " +
    "종합소득세·법인세·부가가치세·원천징수·4대보험·창업 세팅·세무조사 대응·상속·증여·국제조세까지 업종과 규모에 따라 필요한 전문 영역이 다릅니다. " +
    "지역 페이지에서는 해당 지역에 등록된 세무사를 프리미엄 우선 순으로 확인할 수 있고, 상황 페이지에서는 특정 세목·업무에 맞춘 검색 의도에 대응하는 설명과 관련 지역으로의 내부 링크를 제공합니다. " +
    "계산기 메뉴에서는 종합소득세·양도세·부가세·증여세를 간이 산출해 보고, 결과 화면에서 절세 상담으로 이어질 수 있도록 구성했습니다. " +
    "상담 신청 시 이름·연락처·희망 지역·상담 내용을 남기시면 담당자가 확인 후 연락드립니다. 검색엔진을 통해 유입된 사용자가 지역·세목·도구까지 자연스럽게 이동하도록 콘텐츠와 링크를 자동으로 확장합니다."
  );
}

export function buildRegionSidoBody(sido: string): string {
  const n = getSigunguBySido(sido).length;
  return (
    `${sido}에는 총 ${n}개의 시·군·구 단위 행정구역이 있으며, 사업장 소재지·거주지·실제 상담 동선을 기준으로 가까운 세무사를 고르는 것이 신고·조사 대응 모두에 유리합니다. ` +
    `${sido} 지역 사업자는 업태와 과세 유형(일반·간이·면세)에 따라 장부·증빙 관리 강도가 달라지므로, 동일 업종 사례를 다수 경험한 세무사를 우선 검토하는 것이 좋습니다. ` +
    "법인은 결산·주주총회·배당·지배구조 변경 시 세무 이슈가 함께 따라오기 때문에 회계·세무를 통합 자문할 수 있는 사무소를 선택하는 전략이 흔합니다. " +
    "프리랜서·플랫폼 노동자는 원천징수 영수증·사업소득·기타소득 분류를 정확히 정리해야 공제와 분할납부 전략을 세울 수 있습니다. " +
    "아래 목록에서 세부 지역을 선택하면 해당 시·군·구에 등록된 세무사 목록, 프리미엄 노출, 무료 상담 신청 폼으로 바로 이동합니다. " +
    "지역명·세목 키워드 조합으로 유입된 방문자에게 동일한 맥락의 FAQ와 관련 상황 페이지 링크를 함께 제공하여 이탈을 줄이고 상담 전환을 돕습니다."
  );
}

export function buildRegionSigunguBody(sido: string, sigungu: string): string {
  return (
    `${sido} ${sigungu} 지역을 대상으로 등록된 세무사·세무법인 정보를 한곳에서 비교할 수 있습니다. ` +
    `${sigungu} 인근에서 사업장을 두었거나 거주하는 납세자는 지역 밀착 상담·방문·온라인 혼합 미팅 등 실무 편의를 고려해 세무사를 선택하는 경우가 많습니다. ` +
    "프리미엄 등록 세무사는 목록 상단에 배치되어 노출 강도가 높으며, 일반 등록 세무사 역시 동일한 상담 신청 경로로 리드가 연결됩니다. " +
    "법인세·부가세·종합소득세·원천세·지방세 신고 일정은 사업 연도와 납세자 유형에 따라 달라지므로, 상담 시 최근 분기 매출·비용·인건비·자산 취득 내역을 함께 준비하면 초기 진단 정확도가 올라갑니다. " +
    "세무조사·경정 등 쟁점이 있는 경우에는 과세자료 제출 이력과 쟁점 세목을 중심으로 사례를 설명해 주시면 대응 전략을 빠르게 좁힐 수 있습니다. " +
    "이 페이지는 검색 의도가 명확한 지역 키워드와 연결되도록 본문·FAQ·내부 링크를 자동 생성했으며, 인근 지역·대표 세목 페이지로 이동해 정보 탐색을 이어갈 수 있습니다. " +
    "무료 상담 신청을 남기시면 담당자가 지역·업종에 맞는 세무사 매칭을 도와드립니다."
  );
}

export function buildSituationRegionBridge(
  situationId: string,
  label: string,
): string {
  const picks = deterministicPick(REGIONS as typeof REGIONS, 3, `${situationId}|bridge`);
  const names = picks
    .map((p) => `${p.name} ${p.sigungu[0] ?? ""}`.trim())
    .join(", ");
  return (
    `${label} 키워드로 방문한 사용자가 바로 지역 세무사를 찾을 수 있도록 ${names} 등 지역 허브 페이지와 상호 연결했습니다. ` +
    "지역 페이지에서는 해당 시·군·구에 등록된 세무사 목록과 프리미엄 노출, 무료 상담 신청 폼을 제공하며, 상황 페이지 간 이동으로 세목별 정보 탐색을 이어갈 수 있습니다. " +
    "검색엔진 관점에서도 주제·지역·도구가 서로 링크되도록 자동 문단을 생성해 크롤러가 사이트 구조를 이해하기 쉽게 했습니다. " +
    "상담 신청 시 관심 지역과 상황을 함께 남기면 매칭 정확도가 올라갑니다."
  );
}

export function buildSituationBody(situation: TaxSituation): string {
  const label = situation.label;
  return (
    `${label} 관련 세무 이슈는 시기·증빙·과세 표준 확정 과정에서 변수가 많아, 일반적인 검색 정보만으로는 개별 최적해를 찾기 어렵습니다. ` +
    `이 페이지는 "${label}" 키워드로 방문한 사용자에게 대표적인 검토 포인트와 다음 행동(상담·신고·조사 대응)을 안내하기 위해 자동 생성된 설명 텍스트입니다. ` +
    "사업자는 과세 유형과 매출 규모에 따라 의무·면제·간이 적용 여부가 달라지고, 법인은 특수관계·가지급금·업무용승용차·퇴직급여 충당 등 반복 점검 항목이 존재합니다. " +
    "개인 사업소득자는 분기별 부가세와 종합소득세 신고의 연계, 공제 증빙 관리가 핵심이며, 프리랜서는 원천징수와 실제 소득 귀속 시기를 맞추는 작업이 중요합니다. " +
    "상속·증여·양도는 평가·공제·보유기간에 따라 실효세율이 크게 달라지므로, 서류 정리 전 단계에서 구조를 설계하는 편이 유리합니다. " +
    "국제거래·해외 거주는 조세조약·해외금융계좌 신고·상호합의 절차 등 별도 층위의 검토가 필요합니다. " +
    "아래 지역 링크로 이동하면 해당 지역 세무사 목록과 무료 상담 폼을 바로 이용할 수 있습니다."
  );
}

export function buildCalculatorIntro(
  title: string,
  body: string,
): string {
  return (
    `${title} 계산기는 참고용 간이 산출 도구이며, 실제 과세·신고·납부는 관할 세무서 기준과 최신 법령·세율에 따라 달라질 수 있습니다. ` +
    `${body} ` +
    "입력값은 브라우저에 저장하지 않으며, 결과는 영업·의사결정·신고서 작성을 대체하지 않습니다. " +
    "정확한 금액 확정·최적화 전략은 세무사·회계사와의 상담을 권장드리며, 결과 화면에서 바로 무료 상담 신청으로 연결할 수 있습니다. " +
    "지역·업종·거래 형태에 따라 예외 규정이 많으므로, 동일 입력이라도 사례별로 결과가 달라질 수 있음을 유의해 주세요."
  );
}

export function buildMainFaq(): FaqItem[] {
  return [
    {
      question: "세무사는 어떻게 연결되나요?",
      answer:
        "상담 신청 폼에 연락처와 지역·상황을 남기시면 담당자가 확인 후 적합한 등록 세무사 또는 매칭 절차를 안내합니다.",
    },
    {
      question: "프리미엄 노출은 무엇인가요?",
      answer:
        "유료 등록 세무사에게 제공되는 목록 상단 노출 옵션으로, 선택과 상담 최종 결정은 사용자에게 있습니다.",
    },
    {
      question: "계산기 결과를 신고에 그대로 쓸 수 있나요?",
      answer:
        "아니요. 계산기는 교육·참고용이며, 실제 신고는 세무사 검토와 세법 적용이 필요합니다.",
    },
    {
      question: "전 지역을 지원하나요?",
      answer:
        "시·도·시군구 페이지를 자동 생성하며, 등록 세무사 DB가 비어 있는 지역은 상담 신청으로 매칭을 도와드립니다.",
    },
  ];
}

export function buildRegionSigunguFaq(
  sido: string,
  sigungu: string,
): FaqItem[] {
  return [
    {
      question: `${sido} ${sigungu} 지역 세무사는 어디서 보나요?`,
      answer:
        "이 페이지 목록에서 사무소명·연락처·프리미엄 여부를 확인하고, 상담 신청 버튼으로 리드를 남기실 수 있습니다.",
    },
    {
      question: "방문 상담이 가능한가요?",
      answer:
        "세무사마다 방문·비대면 정책이 다릅니다. 상담 요청 시 희망 방식을 메모에 적어 주시면 조율에 도움이 됩니다.",
    },
    {
      question: "목록에 없으면 어떻게 하나요?",
      answer:
        "해당 지역 담당자에게 무료 상담 신청을 남기면 신규 매칭·추천 절차를 안내해 드립니다.",
    },
    {
      question: "법인과 개인 사업자 모두 상담 가능한가요?",
      answer:
        "네. 다만 사무소별 특화 분야가 다를 수 있어 상담 내용에 업태·매출 규모를 함께 적어 주시면 좋습니다.",
    },
  ];
}

export function buildSituationFaq(situation: TaxSituation): FaqItem[] {
  return [
    {
      question: `${situation.label} 상담 시 준비할 서류는 무엇인가요?`,
      answer:
        "사업자등록증, 최근 결산·장부 요약, 계약서·세금계산서 샘플, 급여대장 등이 대표적이며, 사안별로 담당자가 추가를 요청할 수 있습니다.",
    },
    {
      question: "얼마나 걸리나요?",
      answer:
        "간단한 문의는 수 일 내, 조사·쟁점 사안은 자료 규모에 따라 수 주 이상 소요될 수 있습니다.",
    },
    {
      question: "비용은 어떻게 되나요?",
      answer:
        "세무사 보수는 사무소·난이도·긴급도에 따라 상이합니다. 상담 단계에서 견적 범위를 확인하세요.",
    },
  ];
}

export function internalLinksForSigungu(
  sido: string,
  sigungu: string,
): InternalLink[] {
  const districts = getSigunguBySido(sido);
  const others = deterministicPick(districts, 3, `${sido}|${sigungu}`, sigungu);
  const links: InternalLink[] = others.map((d) => ({
    href: regionSigunguPath(sido, d),
    label: `${sido} ${d} 세무사`,
  }));
  const sit = deterministicPick(
    TAX_SITUATIONS as readonly TaxSituation[],
    2,
    `${sido}|${sigungu}|sit`,
  );
  for (const s of sit) {
    links.push({
      href: situationPath(s.id),
      label: `${s.label} 안내`,
    });
  }
  links.push(
    { href: calculatorPath("종합소득세"), label: "종합소득세 계산" },
    { href: calculatorPath("부가세"), label: "부가세 계산" },
    { href: "/consult", label: "상담 신청 페이지" },
  );
  return links.slice(0, 10);
}

export function internalLinksForSituation(situationId: string): InternalLink[] {
  const links: InternalLink[] = [];
  const pickRegions = deterministicPick(REGIONS as typeof REGIONS, 4, situationId);
  for (const r of pickRegions) {
    const sg = r.sigungu[0];
    if (sg) {
      links.push({
        href: regionSigunguPath(r.name, sg),
        label: `${r.name} ${sg} 세무사 찾기`,
      });
    }
  }
  for (const s of TAX_SITUATIONS) {
    if (s.id !== situationId) {
      links.push({ href: situationPath(s.id), label: s.label });
    }
  }
  links.push(
    { href: calculatorPath("증여세"), label: "증여세 계산" },
    { href: "/consult", label: "무료 상담 신청" },
  );
  return links.slice(0, 12);
}

export function faqJsonLd(faqs: FaqItem[], pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
    url: pageUrl,
  };
}

export function breadcrumbJsonLd(
  items: { name: string; url: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.url),
    })),
  };
}

export function localBusinessJsonLd(args: {
  name: string;
  description?: string | null;
  url: string;
  telephone?: string | null;
  streetAddress?: string | null;
  addressLocality: string;
  addressRegion: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "AccountingService",
    name: args.name,
    description: args.description ?? undefined,
    url: args.url,
    telephone: args.telephone ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: args.streetAddress ?? undefined,
      addressLocality: args.addressLocality,
      addressRegion: args.addressRegion,
      addressCountry: "KR",
    },
    areaServed: {
      "@type": "AdministrativeArea",
      name: `${args.addressRegion} ${args.addressLocality}`,
    },
  };
}

export { getSituationLabel, TAX_SITUATIONS };
