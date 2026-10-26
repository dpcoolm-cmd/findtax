import type { Metadata } from "next";
import Link from "next/link";
import { TravelCustomsCalculator } from "@/components/calculators/TravelCustomsCalculator";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/auto-content";
import { absoluteUrl } from "@/lib/seo/urls";
import { TRAVEL_RULES } from "@/lib/calculators/travel-customs";

const path = "/calculator/travel-customs";
const title = "해외여행 면세·관세 계산기 | 800달러·술 2L·일본 면세 환급 - FindTax";
const description = "한국 입국 면세한도를 확인하고 일본 소비세 환급, 카드 청구액, 국내 가격을 따로 비교해 보세요. 확인되지 않은 세액은 숫자로 단정하지 않습니다.";
export const metadata: Metadata = { title, description, alternates: { canonical: absoluteUrl(path) }, robots: { index: true, follow: true }, openGraph: { title, description, url: absoluteUrl(path), type: "website" }, twitter: { card: "summary", title, description } };

export default function TravelCustomsPage() {
  return <div className="app-shell-frame py-9 md:py-14"><JsonLd data={breadcrumbJsonLd([{ name: "홈", url: "/" }, { name: "계산기", url: "/calculator" }, { name: "해외여행 면세·관세", url: path }])} />
    <div className="mx-auto max-w-3xl">
      <nav className="text-sm text-ink-muted" aria-label="현재 위치"><Link href="/calculator" className="underline underline-offset-4">계산기</Link> / 여행·해외쇼핑</nav>
      <h1 className="mt-5 text-3xl font-extrabold leading-tight md:text-4xl">해외여행 면세·관세 계산기</h1>
      <p className="mt-3 text-base leading-7 text-ink-muted">해외에서 사 온 물건, 한국 입국 때 면세 범위에 들어올까요? 일본 쇼핑이라면 현지 소비세 환급과 실제 지출도 따로 확인해 보세요.</p>
      <p className="mt-3 text-sm text-ink-muted">정책 확인일 {TRAVEL_RULES.verifiedOn} · 적용 기준 {TRAVEL_RULES.effectiveFrom} 이후 · 관세환율은 입국일을 기준으로 별도 조회</p>
      <div className="mt-7"><TravelCustomsCalculator /></div>
      <section className="mt-10 border-t border-line pt-7"><h2 className="text-xl font-bold">계산 기준과 확인할 점</h2>
        <p className="mt-3 text-sm leading-7">한국 입국 여행자 1인의 일반 물품 기본 면세 범위는 총 미화 800달러입니다. 주류는 합산 2L 이하이면서 총 400달러 이하, 향수는 100mL, 궐련은 200개비가 별도 기준입니다. 국내·입국장 면세점 구매분과 선물도 빠뜨리지 마세요. 미성년자에게는 주류·담배 별도 면세를 적용하지 않습니다.</p>
        <p className="mt-3 text-sm leading-7">한도 이내 판정은 입력한 물품에 한정됩니다. 한도를 넘는 경우 품목별 공제, 세율, 관세환율, 자진신고 감면은 관세청 공식 조회에서 확인하세요. 판매용·검역 대상·고가품은 별도 규정이 적용될 수 있습니다. 이 도구는 세관의 확정 판정이나 신고를 대신하지 않습니다.</p>
        <p className="mt-3 text-sm leading-7">일본은 2026년 11월 1일 구매분부터 사후환급 방식으로 전환됩니다. 면세점의 같은 날 세전 5,000엔 이상 구매, 90일 이내 출국·반출 확인 등이 필요하며 환급은 매장이나 사업자가 지급합니다. 현지 환급액을 한국 입국 세액에서 자동 공제하지 않습니다.</p>
        <h3 className="mt-6 font-bold">공식 자료</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6">
          <li><a className="underline" target="_blank" rel="noopener noreferrer" href="https://www.customs.go.kr/incheon_airport/cm/cntnts/cntntsView.do?cntntsId=6689&mi=12546">인천공항본부세관 여행자 입국 안내</a></li>
          <li><a className="underline" target="_blank" rel="noopener noreferrer" href="https://www.customs.go.kr/kcs/ad/tax/ItemTaxCalculation.do">관세청 여행자 휴대품 예상세액 조회</a></li>
          <li><a className="underline" target="_blank" rel="noopener noreferrer" href="https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00028.html">일본 관광청 여행자 면세·사후환급 안내</a></li>
          <li><a className="underline" target="_blank" rel="noopener noreferrer" href="https://www.nta.go.jp/publication/pamph/shohi/menzei/201805/format/002.htm">일본 국세청 사후환급 제도 개정</a></li>
        </ul>
      </section>
    </div>
  </div>;
}
