import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SavingsInterestCalculator } from "@/components/calculators/SavingsInterestCalculator";
import { SAVINGS_INTEREST_REFERENCE } from "@/lib/calculators/savings-interest";
import { breadcrumbJsonLd } from "@/lib/seo/auto-content";
import { absoluteUrl } from "@/lib/seo/urls";

const path = "/calculator/savings-interest";
const title = "예금·적금 이자 계산기 | 세후 만기 금액 계산";
const description = "예금 목돈이나 적금 월 납입액, 연이율과 기간을 입력해 세전 이자·일반과세 세금·세후 만기 수령액을 비교하세요.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: { title, description, url: absoluteUrl(path), type: "website" },
  twitter: { card: "summary", title, description },
};

export default function SavingsInterestPage() {
  return <div className="app-shell-frame py-10 md:py-14">
    <JsonLd data={breadcrumbJsonLd([{ name: "홈", url: "/" }, { name: "계산기", url: "/calculator" }, { name: "예금·적금 이자 계산기", url: path }])} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: "FindTax 예금·적금 이자 계산기", url: absoluteUrl(path), description, applicationCategory: "FinanceApplication", operatingSystem: "Any", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" } }} />
    <div className="mx-auto max-w-3xl">
      <nav className="text-sm text-ink-muted" aria-label="현재 위치"><Link href="/calculator" className="underline underline-offset-4">계산기</Link> / 연금·재무</nav>
      <h1 className="mt-5 text-3xl font-extrabold leading-tight md:text-4xl">예금·적금 이자 계산기</h1>
      <p className="mb-7 mt-4 text-base leading-7 text-ink-muted">가입 금액과 기간, 금리를 넣고 세금을 뺀 뒤 만기에 받을 금액을 비교해 보세요.</p>
      <SavingsInterestCalculator />
      <section className="mt-10 border-t border-line pt-7">
        <h2 className="text-xl font-bold">계산 방식과 적용 범위</h2>
        <p className="mt-3 text-sm leading-7">예금은 예치 원금에 연이율과 가입 개월 수를 곱해 단리로 계산합니다. 적금은 매월 초 납입한다고 가정하고, 각 납입액이 실제 예치된 개월 수만큼 이자를 얻도록 계산합니다. 일반과세 예상액은 이자소득세 14%와 지방소득세(소득세액의 10%)를 합친 15.4%를 세전 이자에 적용합니다.</p>
        <h3 className="mt-5 text-base font-bold">결과를 실제 상품과 비교할 때</h3>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-ink-muted">
          <li>은행 상품은 납입일·만기일, 실제 일수와 원 단위 절사 방식에 따라 이자가 달라질 수 있습니다.</li>
          <li>우대금리, 중도해지 이율, 복리 상품의 약정 방식은 계산하지 않습니다. 상품설명서의 만기 예상 이자를 확인하세요.</li>
          <li>비과세는 선택한 상품에 자동 적용되는 혜택이 아닙니다. 가입 자격과 납입 한도를 금융회사 및 공식 안내에서 확인하세요.</li>
          <li>금융소득 종합과세, 다른 소득과의 합산, 개인별 세금 신고 결과는 이 계산기에 포함되지 않습니다.</li>
        </ul>
        <p className="mt-5 text-xs text-ink-muted">세율 기준 확인 {SAVINGS_INTEREST_REFERENCE.lastVerifiedAt}</p>
        <ul className="mt-3 space-y-2 text-sm">{SAVINGS_INTEREST_REFERENCE.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">{source.title}</a></li>)}</ul>
        <p className="mt-5 border-l-2 border-primary pl-4 text-sm leading-7 text-ink-muted">이 결과는 입력값과 표시된 가정을 바탕으로 한 참고용 추정치입니다. 금융상품의 실제 수익이나 개인별 세액·비과세 적용을 보장하지 않습니다.</p>
      </section>
      <section className="mt-8 border-t border-line pt-6">
        <h2 className="text-lg font-bold">함께 확인할 계산기</h2>
        <div className="mt-4 flex flex-col gap-4 text-sm font-semibold">
          <Link className="underline underline-offset-4" href="/calculator/연말정산">연금저축·IRP 절세 시뮬레이터</Link>
          <Link className="underline underline-offset-4" href="/calculator/retirement-income">노후월급 계산기</Link>
        </div>
      </section>
    </div>
  </div>;
}
