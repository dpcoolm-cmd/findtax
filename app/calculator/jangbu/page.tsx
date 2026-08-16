import Link from "next/link";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { BookkeepingFeeCalculator } from "@/components/calculators/BookkeepingFeeCalculator";
import { JsonLd } from "@/components/JsonLd";
import { FaqSection } from "@/components/SeoBlocks";
import { StickyPageLeadSection } from "@/components/StickyPageLeadSection";
import { breadcrumbJsonLd, buildMainFaq, faqJsonLd } from "@/lib/seo/auto-content";
import { absoluteUrl } from "@/lib/seo/urls";
import type { Metadata } from "next";

export const revalidate = 86400;

const title = "기장료 계산기";
const path = "/calculator/jangbu";
const desc = "업종·매출 규모·직원 수에 따른 적정 기장료 범위를 확인하고, 현재 내고 있는 기장료가 적정한지 세무사에게 확인받아 보세요.";

export const metadata: Metadata = {
  title,
  description: desc,
  alternates: { canonical: absoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: { url: absoluteUrl(path), title, description: desc },
};

export default function JangbuCalculatorPage() {
  const url = absoluteUrl(path);
  const faqs = buildMainFaq();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", url: "/" },
          { name: "계산기", url: "/calculator" },
          { name: title, url: path },
        ])}
      />
      <JsonLd data={faqJsonLd(faqs, url)} />

      <div className="app-shell-frame pb-24 pt-10 md:pb-28">
        <div className="space-y-10">
          {/* Breadcrumb + Header */}
          <section className="space-y-6 border-b border-line pb-10">
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              <Link href="/" className="hover:text-ink">홈</Link>
              <span>/</span>
              <Link href="/calculator" className="hover:text-ink">계산기</Link>
              <span>/</span>
              <span className="text-ink">기장료</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(260px,0.55fr)] lg:items-start">
              <div className="space-y-4">
                <SectionLabel>calculator_module</SectionLabel>
                <h1 className="max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">{title}</h1>
              </div>
              <p className="pt-2 text-right text-ink-muted">
                업종과 매출 규모로 적정 기장료 범위를 먼저 확인하고,
                현재 납부 중인 기장료가 적정한지 세무사에게 검토받을 수 있습니다.
              </p>
            </div>
          </section>

          {/* Calculator */}
          <div>
            <BookkeepingFeeCalculator />
          </div>

          <section className="rounded-3xl bg-bg-muted p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div>
              <SectionLabel>calculator_directory</SectionLabel>
              <h2 className="mt-3 text-2xl font-black text-ink">다른 계산기도 한 곳에서 볼 수 있어요.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
                필요한 계산기가 바뀌어도 전체 계산기 목록에서 바로 선택할 수 있습니다.
              </p>
            </div>
            <Link href="/calculator" className="btn-secondary mt-5 w-full text-sm font-bold sm:mt-0 sm:w-auto">
              전체 계산기 보기
            </Link>
          </section>

          <FaqSection items={faqs} />
          <StickyPageLeadSection />
        </div>
      </div>
    </>
  );
}
