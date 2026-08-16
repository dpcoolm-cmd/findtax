import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { AcquisitionTaxCalculator } from "@/components/calculators/AcquisitionTaxCalculator";
import { ComprehensiveIncomeTaxCalculator } from "@/components/calculators/ComprehensiveIncomeTaxCalculator";
import { GiftTaxCalculator } from "@/components/calculators/GiftTaxCalculator";
import { InheritanceGiftStrategyCalculator } from "@/components/calculators/InheritanceGiftStrategyCalculator";
import { SeverancePayCalculator } from "@/components/calculators/SeverancePayCalculator";
import { SideHustleTaxCalculator } from "@/components/calculators/SideHustleTaxCalculator";
import { SoloBusinessTaxPlanner } from "@/components/calculators/SoloBusinessTaxPlanner";
import { SocialInsuranceCalculator } from "@/components/calculators/SocialInsuranceCalculator";
import { TransferTaxCalculator } from "@/components/calculators/TransferTaxCalculator";
import { VatCalculator } from "@/components/calculators/VatCalculator";
import { WeeklyHolidayPayCalculator } from "@/components/calculators/WeeklyHolidayPayCalculator";
import { YearEndTaxOptimizationCalculator } from "@/components/calculators/YearEndTaxOptimizationCalculator";
import { JsonLd } from "@/components/JsonLd";
import { FaqSection } from "@/components/SeoBlocks";
import { StickyPageLeadSection } from "@/components/StickyPageLeadSection";
import { TaxRulesBadge } from "@/components/TaxRulesBadge";
import { breadcrumbJsonLd, buildMainFaq, faqJsonLd } from "@/lib/seo/auto-content";
import { CALCULATOR_SLUGS, isCalculatorSlug, type CalculatorSlug } from "@/lib/seo/calculators";
import { absoluteUrl, calculatorPath } from "@/lib/seo/urls";
import type { Metadata } from "next";

export const revalidate = 86400;

export function generateStaticParams() {
  return CALCULATOR_SLUGS.map((slug) => ({ slug }));
}

const titles: Record<CalculatorSlug, string> = {
  "1인사업자": "1인사업자 세무 운영표",
  부업: "N잡·부업 세금 계산기",
  종합소득세: "종합소득세 계산기",
  양도세: "양도세 계산기",
  부가세: "부가세 계산기",
  증여세: "증여세 계산기",
  취득세: "취득세 계산기",
  퇴직금: "퇴직금 계산기",
  "4대보험": "4대보험 계산기",
  주휴수당: "주휴수당 계산기",
  연말정산: "연금·IRP 절세 시뮬레이터",
  상속증여: "상속·증여 사전 시뮬레이터",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);
  if (!isCalculatorSlug(slug)) {
    return { title: "계산기" };
  }
  const path = calculatorPath(slug);
  const canonical = absoluteUrl(path);
  const desc = `${titles[slug]}로 세금이 달라지는 선택지를 먼저 비교하고, 필요할 때만 세무사와 마지막 판단을 맞춰보세요.`;
  return {
    title: titles[slug],
    description: desc,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: { url: canonical, title: titles[slug], description: desc },
  };
}

function CalculatorBySlug({ slug }: { slug: CalculatorSlug }) {
  switch (slug) {
    case "1인사업자":
      return <SoloBusinessTaxPlanner />;
    case "부업":
      return <SideHustleTaxCalculator />;
    case "종합소득세":
      return <ComprehensiveIncomeTaxCalculator />;
    case "양도세":
      return <TransferTaxCalculator />;
    case "부가세":
      return <VatCalculator />;
    case "증여세":
      return <GiftTaxCalculator />;
    case "취득세":
      return <AcquisitionTaxCalculator />;
    case "퇴직금":
      return <SeverancePayCalculator />;
    case "4대보험":
      return <SocialInsuranceCalculator />;
    case "주휴수당":
      return <WeeklyHolidayPayCalculator />;
    case "연말정산":
      return <YearEndTaxOptimizationCalculator />;
    case "상속증여":
      return <InheritanceGiftStrategyCalculator />;
    default: {
      const _u: never = slug;
      return _u;
    }
  }
}

function officialReferenceLinks(slug: CalculatorSlug) {
  if (slug === "4대보험") {
    return [
      { label: "국민연금공단", href: "https://www.nps.or.kr" },
      { label: "국민건강보험공단", href: "https://www.nhis.or.kr" },
    ];
  }

  if (slug === "퇴직금" || slug === "주휴수당") {
    return [{ label: "고용노동부", href: "https://www.moel.go.kr" }];
  }

  return [
    { label: "국세청", href: "https://www.nts.go.kr" },
    { label: "국가법령정보센터", href: "https://www.law.go.kr" },
  ];
}

export default async function CalculatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);
  if (!isCalculatorSlug(slug)) notFound();

  const path = calculatorPath(slug);
  const url = absoluteUrl(path);
  const faqs = buildMainFaq();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", url: "/" },
          { name: "계산기", url: "/calculator" },
          { name: titles[slug], url: path },
        ])}
      />
      <JsonLd data={faqJsonLd(faqs, url)} />

      <div className="app-shell-frame pb-24 pt-10 md:pb-28">
        <div className="space-y-10">
          <section className="space-y-6 border-b border-line pb-10">
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              <Link href="/" className="hover:text-ink">
                홈
              </Link>
              <span>/</span>
              <Link href="/calculator" className="hover:text-ink">
                계산기
              </Link>
              <span>/</span>
              <span className="text-ink">{slug}</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(260px,0.55fr)] lg:items-start">
              <div className="space-y-4">
                <SectionLabel>calculator_module</SectionLabel>
                <h1 className="max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">{titles[slug]}</h1>
              </div>
              <p className="max-w-xl pt-2 text-left text-ink-muted lg:text-right">
                숫자를 계산하는 데서 멈추지 않고, 세금이 달라지는 선택지를 먼저 비교한 뒤 실제 신고 전 마지막 판단까지 이어지도록 구성했습니다.
              </p>
            </div>

            <div className="rounded-lg border border-line bg-surface-muted p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <TaxRulesBadge />
                <div className="flex flex-wrap gap-2 md:justify-end">
                  {officialReferenceLinks(slug).map((source) => (
                    <a
                      key={source.href}
                      href={source.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-10 items-center rounded-lg border border-line bg-white px-3 text-xs font-semibold text-ink hover:bg-bg-muted"
                    >
                      {source.label} 기준 확인
                    </a>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid gap-px overflow-hidden border-y border-line bg-line sm:grid-cols-3">
                <div className="bg-white px-4 py-4">
                  <p className="text-xs font-bold text-[#6A442D]">공식자료 대조</p>
                  <p className="mt-1 text-sm font-black text-ink">
                    세율·공제·기본기한
                  </p>
                </div>
                <div className="bg-white px-4 py-4">
                  <p className="text-xs font-bold text-[#6A442D]">기준 점검월</p>
                  <p className="mt-1 text-sm font-black text-ink">2026-07</p>
                </div>
                <div className="bg-white px-4 py-4">
                  <p className="text-xs font-bold text-[#6A442D]">결과 사용범위</p>
                  <p className="mt-1 text-sm font-black text-ink">
                    선택지 비교·준비자료 확인
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-ink-muted">
                공식기관 공개 기준을 대조한 자동 계산 참고값입니다. 결과 화면에서 적용한
                조건과 한계를 다시 보여드리며, 감면·특례·개인별 증빙에 따라 실제 결과는
                달라질 수 있습니다.
              </p>
            </div>
          </section>

          <div>
            <CalculatorBySlug slug={slug} />
          </div>

          <section className="rounded-lg border border-line bg-surface-muted p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
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
