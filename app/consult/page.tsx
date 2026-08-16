import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { LeadForm } from "@/components/LeadForm";
import { FaqSection } from "@/components/SeoBlocks";
import { breadcrumbJsonLd, faqJsonLd, buildMainFaq } from "@/lib/seo/auto-content";
import { absoluteUrl } from "@/lib/seo/urls";
import { buildTaxCaseHandoffText } from "@/lib/tax-cases/handoff";
import { getTaxCaseByToken } from "@/lib/tax-cases/server";

const path = "/consult";

export const metadata: Metadata = {
  title: "세무사 매칭 신청",
  description:
    "이름·연락처·지역·상담 내용을 남기면 세무사 매칭 담당자가 연락드립니다.",
  alternates: { canonical: absoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    url: absoluteUrl(path),
    title: "세무사 무료 매칭 신청",
    description:
      "세무사 매칭 무료 상담 신청. 지역·상황을 남기면 담당자가 연락드립니다.",
  },
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function ConsultPage({
  searchParams,
}: {
  searchParams: Promise<{ case?: string }>;
}) {
  const url = absoluteUrl(path);
  const faqs = buildMainFaq();
  const { case: caseToken = "" } = await searchParams;
  const taxCase = UUID_RE.test(caseToken)
    ? await getTaxCaseByToken(caseToken)
    : null;
  const defaultSituation =
    taxCase?.caseType === "gift"
      ? "inheritance"
      : taxCase?.caseType === "seller"
        ? "international"
        : taxCase?.caseType === "pension"
          ? "income_tax"
          : taxCase
            ? "bookkeeping"
            : undefined;
  const caseSummary = taxCase ? buildTaxCaseHandoffText(taxCase) : undefined;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", url: "/" },
          { name: "상담 신청", url: path },
        ])}
      />
      <JsonLd data={faqJsonLd(faqs, url)} />

      <div className="app-shell-frame pb-24 pt-10 md:pb-28">
        <div className="space-y-10">
          {/* 상단 헤더 */}
          <section className="space-y-5 border-b border-line pb-8">
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              <Link href="/" className="hover:text-ink">홈</Link>
              <span>/</span>
              <span className="text-ink">상담 신청</span>
            </div>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(260px,0.55fr)] lg:items-start">
              <div className="space-y-4">
                <SectionLabel>consultation</SectionLabel>
                <h1 className="max-w-3xl text-[3.75rem] leading-[0.95] md:text-[5rem]">
                  세무사 매칭 신청
                </h1>
              </div>
              <p className="pt-2 text-right text-ink-muted">
                지역과 상황을 남겨주시면 담당자가 확인 후 적합한 세무사를 연결해드립니다.
                매칭 신청은 무료이며, 실제 상담·신고 비용은 연결된 세무사와 별도로 협의합니다.
              </p>
            </div>
          </section>

          {/* 폼 */}
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft sm:p-8">
              <LeadForm
                mode="embedded"
                defaultSituation={defaultSituation}
                prefillMessage={
                  taxCase
                    ? "FindTax 진단 결과와 준비자료를 검토해 주세요."
                    : undefined
                }
                taxCaseToken={taxCase?.token}
                taxCaseSummary={caseSummary}
              />
            </div>
          </div>

          <FaqSection items={faqs} />
        </div>
      </div>
    </>
  );
}
