import type { Metadata } from "next";
import Link from "next/link";
import { RetirementIncomeCalculator } from "@/components/calculators/RetirementIncomeCalculator";
import { RETIREMENT_REFERENCE } from "@/lib/calculators/retirement-income";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/auto-content";
import { absoluteUrl } from "@/lib/seo/urls";

const path = "/calculator/retirement-income";
const title = "퇴직연금 노후월급 계산기 | 월 얼마가 부족할까?";
const description = "퇴직연금 자산, 국민연금 시작 나이, 생활비와 물가를 반영해 부족생활비·자산 지속기간·추가 필요자금을 비교하세요. 가입 없이 무료로 계산합니다.";
export const metadata: Metadata = { title, description, alternates: { canonical: absoluteUrl(path) },
  robots: { index: true, follow: true }, openGraph: { title, description, url: absoluteUrl(path), type: "website" },
  twitter: { card: "summary", title, description } };

export default function RetirementIncomePage() {
  return <div className="retirement-page app-shell-frame py-10 md:py-14">
    <JsonLd data={breadcrumbJsonLd([{ name: "홈", url: "/" }, { name: "계산기", url: "/calculator" }, { name: "노후월급 계산기", url: path }])} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: "FindTax 노후월급 계산기", url: absoluteUrl(path), description, applicationCategory: "FinanceApplication", operatingSystem: "Any", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" } }} />
    <div className="mx-auto max-w-3xl">
      <nav className="text-sm text-ink-muted" aria-label="현재 위치"><Link href="/calculator" className="underline underline-offset-4">계산기</Link> / 연금·재무</nav>
      <h1 className="mt-5 text-3xl font-extrabold leading-tight md:text-4xl">내 퇴직연금은<br />월급으로 몇 년 나올까?</h1>
      <p className="mb-7 mt-4 text-base leading-7 text-ink-muted">퇴직 후 부족한 생활비, 준비한 자산으로 얼마나 채울 수 있을까요?</p>
      <RetirementIncomeCalculator />
      <section className="mt-10 border-t border-line pt-7">
        <h2 className="text-xl font-bold">계산 근거와 한계</h2>
        <p className="mt-3 text-sm text-ink-muted">공식자료 확인 {RETIREMENT_REFERENCE.lastVerifiedAt} · 세액 산출이 아닌 현금흐름 시뮬레이션</p>
        <p className="mt-4 text-sm leading-7">월수익률 = (1 + 연수익률)^(1/12) − 1. 퇴직 전에는 매월 적립하고, 퇴직 후에는 생활비에서 국민연금·기타소득을 뺀 부족액을 인출합니다. 추가 필요자금은 목표 나이까지의 월별 부족액을 퇴직 시점으로 할인한 금액에서 예상 자산을 뺀 값입니다.</p>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-ink-muted">{[...RETIREMENT_REFERENCE.assumptions, ...RETIREMENT_REFERENCE.limitations].map(line => <li key={line}>{line}</li>)}</ul>
        <ul className="mt-5 space-y-3 text-sm">{RETIREMENT_REFERENCE.sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">{s.title}</a></li>)}</ul>
        <p className="mt-6 border-l-2 border-primary pl-4 text-sm leading-7">본 결과는 입력값을 기반으로 한 참고용 시뮬레이션이며 투자권유·세무·법률 자문이 아닙니다. 개인별 수령 조건과 실제 수익률에 따라 달라집니다. 특정 상품이나 종목을 추천하지 않습니다.</p>
      </section>
      <section className="mt-8 border-t border-line pt-6">
        <h2 className="text-lg font-bold">다음으로 확인할 내용</h2>
        <div className="mt-4 flex flex-col gap-4 text-sm font-semibold">
          <Link className="underline underline-offset-4" href="/blog/연금저축계좌-세액공제-입문">연금저축, 세액공제 전에 알아둘 점</Link>
          <Link className="underline underline-offset-4" href="/blog/연금저축-irp-etf-구성-초보">연금저축·IRP의 장기 운용 원칙</Link>
          <Link className="underline underline-offset-4" href="/calculator/퇴직금">퇴직금 규모부터 계산하기</Link>
        </div>
      </section>
    </div>
  </div>;
}
