import type { BlogArticle } from "./types.ts";

export function getBlogCta(article: Pick<BlogArticle, "slug" | "h1">) {
  // Main subject determines the destination; incidental keywords must not win.
  const subject = `${article.slug} ${article.h1}`.toLowerCase();
  const options = [
    { matches: /가업상속|가업승계/, title: "일반 상속·증여 비교가 필요한가요?", description: "일반 자산 이전의 참고 계산입니다. 가업상속공제 자격·주식평가·사후관리 추징은 계산하지 않습니다.", href: "/calculator/상속증여", calculatorType: "inheritance_gift" },
    { matches: /부담부증여|상속/, title: "상속과 증여, 가정을 나눠 비교하세요", description: "현재 증여와 상속의 예상 차이를 살펴봅니다. 채무·양도세·취득세 등 복합 사례는 별도 검토가 필요합니다.", href: "/calculator/상속증여", calculatorType: "inheritance_gift" },
    { matches: /증여|차용증/, title: "가족에게 줄 금액, 증여세부터 확인하세요", description: "증여 금액과 관계별 공제를 확인합니다. 차용의 인정 여부나 적정 이자 판정을 대신하지는 않습니다.", href: "/calculator/증여세", calculatorType: "gift_tax" },
    { matches: /연금저축계좌-세액공제-입문|연금저축-irp-etf-구성-초보|노후|은퇴/, title: "모은 연금으로 생활비를 얼마나 채울까요?", description: "국민연금 수령 전 공백과 물가를 반영해 부족한 노후 생활비를 계산합니다.", href: "/calculator/retirement-income", calculatorType: "retirement_income" },
    { matches: /기장/, title: "기장료 견적, 범위부터 비교하세요", description: "입력한 조건의 참고 범위를 확인하고, 실제 포함 업무와 추가 비용은 세무사에게 확인하세요.", href: "/calculator/jangbu", calculatorType: "bookkeeping_decision" },
    { matches: /부가세|구매대행|역직구|스마트스토어/, title: "부가세 신고 준비 상태를 확인하세요", description: "과세유형과 매출·매입 자료를 바탕으로 신고 복잡도를 살펴봅니다.", href: "/calculator/부가세", calculatorType: "vat_decision" },
    { matches: /부업|애드센스|쿠팡파트너스/, title: "부업 소득, 신고할 세금을 확인하세요", description: "소득과 비용을 정리해 종합소득세·부가세 검토가 필요한 부분을 확인합니다.", href: "/calculator/부업", calculatorType: "side_hustle" },
    { matches: /양도/, title: "현재 조건의 양도세를 확인하세요", description: "개정안의 혜택을 확정해 반영하지 않습니다. 보유·거주 요건과 적용 제한을 함께 확인하세요.", href: "/calculator/양도세", calculatorType: "transfer_tax" },
    { matches: /연금|irp|연말정산/, title: "연금·IRP 납입 공제액을 확인하세요", description: "소득 구간과 납입액에 따른 세액공제 추정치입니다. 실제 환급액이나 ETF 수익을 보장하지 않습니다.", href: "/calculator/연말정산", calculatorType: "year_end_tax" },
    { matches: /종합소득세|프리랜서|3[.점]3|플랫폼노동자|인적용역/, title: "종합소득세 신고 준비를 확인하세요", description: "수입·비용과 증빙 상태를 정리하고 검토할 항목을 살펴봅니다. 기본 산출세액 계산은 환급액 정산과 다릅니다.", href: "/calculator/종합소득세", calculatorType: "income_decision" },
  ];
  const found = options.find((option) => option.matches.test(subject));
  return found ?? { title: "다른 세금도 궁금하다면", description: "필요한 계산기를 찾아 적용 범위와 가정을 먼저 확인하세요.", href: "/calculator", calculatorType: "directory" };
}
