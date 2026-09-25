import type { BlogArticle } from "@/lib/blog/types";
import { BLOG_ARTICLES_PART4 } from "./all-posts-part4.ts";

const checkedAt = "2026-09-25";
const NTS_COMPREHENSIVE_INCOME = "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=238978&mi=404";
const NTS_REFUND = "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=239072&mi=41095";
const NTS_VAT = "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7693&mi=2272";
const NTS_VAT_DATES = "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7694&mi=2273";
const NTS_PENSION_RISK_CAP = "https://law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lspttninfSeq=71069";
const MOEL_DEFAULT_OPTION = "https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=13711";
const NAVER_ADPOST_POLICY = "https://adpost.naver.com/help/policy";
const NAVER_ADPOST_AGREEMENT = "https://adpost.naver.com/help/agreement";

const part4BySlug = new Map(BLOG_ARTICLES_PART4.map((article) => [article.slug, article]));

function revise(slug: string, patch: Partial<BlogArticle>): BlogArticle {
  const previous = part4BySlug.get(slug);
  if (!previous) throw new Error(`Cannot find canonical article to revise: ${slug}`);
  return { ...previous, ...patch };
}

const NTS_INCOME_SOURCE = {
  title: "국세청 2026년 종합소득세 신고 안내",
  url: NTS_COMPREHENSIVE_INCOME,
  checkedAt,
};

/** Worth.IT 네이버 원문 다섯 편의 세금·신고 의도에 맞춘 5개 FindTax 업데이트입니다.
 * 기존 검색 대표 문서는 같은 canonical slug로 보강하고 새 질문만 새 URL로 발행합니다.
 */
export const BLOG_ARTICLES_PART19: BlogArticle[] = [
  {
    slug: "네이버-애드포스트-정산-세금-신고",
    category: "side_income",
    metaTitle: "네이버 애드포스트 수익 세금 신고, 정산서에서 확인할 것 | FindTax",
    metaDescription: "애드포스트 지급액과 종합소득세는 같은 숫자가 아닙니다. 정산 내역, 세금 공제, 지급명세서와 다른 소득을 함께 확인하는 방법을 정리합니다.",
    keywords: ["네이버 애드포스트 세금", "애드포스트 종합소득세", "애드포스트 정산", "블로그 수익 세금", "네이버 광고 수익 신고"],
    h1: "네이버 애드포스트 수익, 입금됐으면 세금 신고도 끝난 걸까?",
    intro: "애드포스트에서 지급된 금액은 연간 소득이나 최종 세액과 같지 않을 수 있습니다. 지급 전 정산액, 세금 공제, 계좌에 들어온 금액을 나누고 다른 소득과 비용까지 확인해야 합니다. 네이버 애드포스트 수익을 얼마 받았다는 사례만으로 신고 의무나 환급액을 판단할 수는 없습니다.",
    sections: [
      {
        h2: "정산액·세금 공제·실제 입금액을 따로 기록하세요",
        paragraphs: [
          "네이버의 현재 도움말은 개인 회원의 현금 지급 최소 기준액을 5만 원으로 안내하고, 실제 지급액은 세금 공제 후 달라질 수 있다고 설명합니다. 따라서 세전 정산액과 계좌 입금액이 다를 수 있습니다. 원문에서 언급한 3만8천 원 입금 사례를 모든 회원의 지급 기준으로 일반화하지 말고, 본인의 지급 방식과 해당 월 정산 내역을 확인하세요.",
          "월별로 정산 대상 기간, 확정된 광고 수익, 조정액, 공제 내역, 지급일, 실제 입금액을 저장하세요. 지급 보류·취소·다른 지급 방식이 있었다면 함께 적어 두면 연말에 금액 차이를 다시 맞추기 쉽습니다.",
        ],
        checklist: [
          "애드포스트 정산 화면과 지급 내역을 내려받아 보관한다.",
          "정산 전 금액, 공제액, 계좌 입금액을 각각 기록한다.",
          "네이버에서 제공하는 지급·원천징수 자료가 있으면 국세청 조회자료와 대조한다.",
        ],
      },
      {
        h2: "입금됐다는 사실만으로 종합소득세 신고가 끝나지 않습니다",
        paragraphs: [
          "플랫폼에서 지급할 때 세금이 공제되었더라도 그 금액이 모든 소득을 반영한 최종 세액이라는 뜻은 아닙니다. 종합소득세 신고 여부와 계산은 애드포스트 외의 근로·사업·프리랜서 소득, 비용, 공제 및 적용되는 소득 구분을 함께 확인해야 합니다.",
          "애드포스트 수익에 3.3%가 항상 적용된다고 단정하지 마세요. 지급 명세서의 소득 구분과 원천징수 내역을 기준으로 확인하고, 활동이 반복·확대되거나 판매·제휴 수익과 결합되어 있으면 사업자등록과 부가가치세까지 별도로 살펴볼 수 있습니다.",
        ],
      },
      {
        h2: "애드포스트 외 수익과 비용도 한 해 기준으로 합칩니다",
        paragraphs: [
          "애드센스, 제휴마케팅, 원고료, 강의, 전자책 수익을 여러 채널에서 받았다면 플랫폼별 지급액만 따로 보고 결론을 내리지 마세요. 각 서비스의 연간 지급명세와 정산서를 모으고, 통장 거래와 누락·중복을 확인합니다.",
          "서버·도메인·편집 도구 등 지출은 업무와의 관련성을 설명할 자료를 남기세요. 개인 사용이 섞인 구입비를 모두 비용으로 처리할 수 있는 것은 아니며, 고가 장비나 공동 사용 비용은 사용 내역과 세법상 처리 기준을 확인해야 합니다.",
        ],
      },
      {
        h2: "신고 전 빠르게 확인할 자료",
        paragraphs: ["애드포스트만으로 신고 결과를 계산하지 말고 다음 자료를 한 표에 모아 국세청 신고 안내와 대조하세요. 분류가 불분명하거나 소득원이 여러 개라면 신고 전 국세청 또는 세무전문가에게 확인하는 편이 안전합니다."],
        checklist: [
          "애드포스트 월별 정산서와 연간 지급·원천징수 자료",
          "플랫폼 밖에서 받은 원고료·강의료·제휴 수익 자료",
          "업무 관련 비용의 증빙과 사용 목적 메모",
          "홈택스에 조회되는 지급명세서와 신고안내 내역",
        ],
      },
    ],
    closing: "애드포스트 입금액은 신고 검토의 출발점입니다. 지급 내역과 세금 공제를 따로 저장하고, 한 해의 다른 소득 및 관련 비용을 합쳐 확인하세요. 특정 금액 이하이면 신고할 필요가 없다는 식의 단일 기준은 적용하지 마세요.",
    datePublished: checkedAt,
    dateModified: checkedAt,
    revisionNote: "Worth.IT 네이버 애드포스트 정산 후기에서 출발해 지급액과 세금 신고를 구분하고, 현행 네이버 지급 안내와 국세청 신고자료 확인 절차를 추가했습니다.",
    originalSource: {
      title: "네이버 애드포스트 3.8만원 받았습니다｜클릭률 떨어지는 건 내 탓일까, 네이버 탓일까?",
      url: "https://blog.naver.com/keepcalm2022/224412534343",
    },
    sources: [
      { title: "네이버 애드포스트 지급 정책", url: NAVER_ADPOST_POLICY, checkedAt },
      { title: "네이버 애드포스트 회원 약관과 세금 안내", url: NAVER_ADPOST_AGREEMENT, checkedAt },
      NTS_INCOME_SOURCE,
    ],
  },
  revise("프리랜서-3점3-종합소득세-환급-추가납부", {
    dateModified: checkedAt,
    revisionNote: "Worth.IT 프리랜서 3.3% 연재를 바탕으로, 3.3%가 최종세액이 아닌 선납액이라는 점과 2026년 국세청 신고 안내를 다시 대조했습니다.",
    sources: [
      { title: "국세청 2026년 종합소득세 신고 안내: 인적용역 사업소득", url: NTS_COMPREHENSIVE_INCOME, checkedAt },
      { title: "국세청 모두채움 신고 안내: 원천징수와 환급 구조", url: NTS_REFUND, checkedAt },
    ],
  }),
  revise("부가세-신고-세무사-직접-판단", {
    dateModified: checkedAt,
    revisionNote: "Worth.IT의 부가세 신고·세무사 선택 글을 바탕으로 과세유형과 기간별 신고기한은 국세청 현행 안내에서 확인하도록 갱신했습니다. 본문 비교표는 공식 의무 기준이 아닌 자료 복잡도에 따른 편집상 판단 도구입니다.",
    sources: [
      { title: "국세청 부가가치세 개요: 과세유형과 계산 구조", url: NTS_VAT, checkedAt },
      { title: "국세청 부가가치세 신고납부기한 안내", url: NTS_VAT_DATES, checkedAt },
    ],
  }),
  revise("애드센스-쿠팡파트너스-부업-종합소득세", {
    metaTitle: "애드센스·쿠팡파트너스·애드포스트 세금 자료 정리법 | FindTax",
    metaDescription: "블로그 광고·제휴수익의 정산액, 지급명세, 환율, 비용을 구분하고 종합소득세 전에 대조하는 방법을 안내합니다.",
    keywords: ["애드센스 세금", "쿠팡파트너스 세금", "애드포스트 종합소득세", "블로그 수익 신고", "제휴마케팅 세금"],
    intro: "애드센스·쿠팡파트너스·애드포스트 수익은 플랫폼 입금액만으로 신고 의무나 최종 세금을 판단할 수 없습니다. 채널별 연간 정산액, 지급명세·세금 공제, 실제 입금, 업무 관련 비용을 모아 다른 소득과 함께 확인하세요. 세금 처리는 플랫폼 이름이 아니라 실제 활동과 소득 자료를 기준으로 검토합니다.",
    dateModified: checkedAt,
    revisionNote: "Worth.IT의 애드센스 승인 후기와 플랫폼 부업 글을 연결해 애드포스트 지급·공제 자료까지 보강하고, 소득 구분은 지급명세와 실제 활동에 따라 확인하도록 명확히 했습니다.",
    sections: [
      ...part4BySlug.get("애드센스-쿠팡파트너스-부업-종합소득세")!.sections,
      {
        h2: "네이버 애드포스트도 정산서와 실제 입금액을 나눕니다",
        paragraphs: [
          "애드포스트는 네이버가 안내하는 지급 기준액과 공제 후 지급액을 확인하고, 월별 정산서·세금 공제·실제 입금 내역을 각각 보관하세요. 포스팅에서 본 특정 수령액이나 다른 플랫폼의 3.3% 원천징수율을 애드포스트에 그대로 적용하면 안 됩니다.",
          "애드센스·쿠팡파트너스·애드포스트처럼 수입원이 다르면 서비스별 연간 자료와 홈택스 조회자료를 대조한 뒤 전체 소득 신고를 검토합니다. 과세 구분, 사업자등록 및 부가세 여부는 채널 이름이나 월 수익만으로 결정되지 않습니다.",
        ],
        checklist: [
          "플랫폼별 연간 정산서와 실제 지급액을 맞춘다.",
          "원천징수 자료의 소득 구분과 공제액을 확인한다.",
          "업무 관련 비용에 증빙과 사용 목적을 연결한다.",
          "다른 근로·사업·프리랜서 소득과 중복·누락을 대조한다.",
        ],
      },
    ],
    sources: [
      NTS_INCOME_SOURCE,
      { title: "네이버 애드포스트 지급 정책", url: NAVER_ADPOST_POLICY, checkedAt },
      { title: "네이버 애드포스트 회원 약관과 세금 안내", url: NAVER_ADPOST_AGREEMENT, checkedAt },
    ],
  }),
  revise("연금저축-irp-etf-구성-초보", {
    dateModified: checkedAt,
    revisionNote: "Worth.IT 퇴직연금 DC형 안전자산 비교 글을 바탕으로 IRP·DC형의 위험자산 한도와 사전지정운용방법의 한정된 예외를 법령·고용노동부 안내로 보강했습니다. 특정 ETF·TDF를 추천하지 않습니다.",
    sections: [
      ...part4BySlug.get("연금저축-irp-etf-구성-초보")!.sections,
      {
        h2: "DC형·IRP의 위험자산 70% 한도는 상품 확인부터 해야 합니다",
        paragraphs: [
          "근로자퇴직급여 보장법 시행규칙은 DC형과 IRP 적립금의 위험자산 운용 한도를 두고 있습니다. 일반적인 한도는 적립금 총액의 70%이며, 나머지를 반드시 현금이나 예금으로만 보유해야 한다는 뜻은 아닙니다. 어떤 펀드·채권혼합형 상품이 한도에 포함되는지는 상품 설명서와 금융회사 분류를 확인하세요.",
          "고용노동부가 안내한 사전지정운용방법(디폴트옵션)에는 이 한도의 예외가 적용될 수 있습니다. 승인된 디폴트옵션이라고 해서 모든 TDF가 자동으로 예외가 되는 것은 아닙니다. 상품명만 보고 안전자산 비중을 계산하지 말고, 본인 계좌에 편입된 방식과 적용 요건을 금융회사에 확인하세요.",
        ],
      },
      {
        h2: "안전자산 30%는 추천 종목이 아니라 계좌 규정 점검 항목입니다",
        paragraphs: [
          "예금·채권혼합형·TDF를 비교할 때는 기대수익률 광고보다 원금손실 가능성, 보수, 주식 편입비중, 위험자산 분류와 퇴직연금 계좌에서의 매수 가능 여부를 확인하세요. 같은 상품군 이름이라도 실제 한도 적용은 다를 수 있습니다.",
          "연금저축과 DC형·IRP는 적용 규정이 같지 않습니다. 여기서 설명한 70% 한도를 모든 연금저축계좌에 그대로 적용하지 말고, 계좌 유형과 금융회사 상품 정보를 기준으로 확인해야 합니다.",
        ],
        checklist: [
          "계좌가 연금저축, DC형, IRP 중 무엇인지 확인한다.",
          "금융회사 화면에서 해당 상품의 위험자산 분류와 한도 반영을 확인한다.",
          "디폴트옵션 적용 여부와 승인된 상품명을 확인한다.",
          "보수, 원금손실 가능성, 인출 계획을 함께 비교한다.",
        ],
      },
    ],
    sources: [
      { title: "근로자퇴직급여 보장법 시행규칙: 위험자산 운용 한도", url: NTS_PENSION_RISK_CAP, checkedAt },
      { title: "고용노동부 사전지정운용방법 제도 안내", url: MOEL_DEFAULT_OPTION, checkedAt },
    ],
  }),
];
