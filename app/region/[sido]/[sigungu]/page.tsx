import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AccountantCard } from "@/components/AccountantCard";
import { PartnerCard } from "@/components/PartnerCard";
import { JsonLd } from "@/components/JsonLd";
import { FaqSection, InternalLinksSection } from "@/components/SeoBlocks";
import { StickyPageLeadSection } from "@/components/StickyPageLeadSection";
import {
  breadcrumbJsonLd,
  buildRegionSigunguFaq,
  faqJsonLd,
  internalLinksForSigungu,
} from "@/lib/seo/auto-content";
import { isValidSidoSigungu } from "@/lib/regions";
import { absoluteUrl, calculatorPath, regionSidoPath, regionSigunguPath } from "@/lib/seo/urls";
import { TAX_SITUATIONS } from "@/lib/situations";
import {
  listActiveRegionPairs,
  listTaxAccountants,
  NO_ACCOUNTANTS_FALLBACK_MESSAGE,
} from "@/lib/tax-accountants";
import { listVerifiedPartners } from "@/lib/partners-directory";

export const revalidate = 86400;

export async function generateStaticParams() {
  const rows = await listActiveRegionPairs();
  return rows.map((row) => ({ sido: row.sido, sigungu: row.sigungu }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sido: string; sigungu: string }>;
}): Promise<Metadata> {
  const { sido: rs, sigungu: rg } = await params;
  const sido = decodeURIComponent(rs);
  const sigungu = decodeURIComponent(rg);
  const result = await listTaxAccountants({ sido, sigungu, limit: 1 });
  const path = regionSigunguPath(sido, sigungu);
  const canonical = absoluteUrl(path);
  const desc = `${sido} ${sigungu} 지역 세무사 목록과 상담 요청 정보를 확인할 수 있습니다.`;

  return {
    title: `${sido} ${sigungu} 세무사 찾기`,
    description: desc,
    alternates: { canonical },
    robots: { index: !result.isEmpty, follow: true },
    openGraph: {
      url: canonical,
      title: `${sido} ${sigungu} 세무사 찾기`,
      description: desc,
    },
  };
}

export default async function RegionSigunguPage({
  params,
  searchParams,
}: {
  params: Promise<{ sido: string; sigungu: string }>;
  searchParams: Promise<{ situation?: string | string[] | undefined }>;
}) {
  const { sido: rs, sigungu: rg } = await params;
  const query = await searchParams;
  const sido = decodeURIComponent(rs);
  const sigungu = decodeURIComponent(rg);
  const activeRows = await listActiveRegionPairs();
  const isActiveRegion = activeRows.some(
    (row) => row.sido === sido && row.sigungu === sigungu,
  );
  if (!isValidSidoSigungu(sido, sigungu) && !isActiveRegion) notFound();

  const fromSituation = typeof query.situation === "string" ? query.situation : null;
  const matchedSituation = fromSituation
    ? TAX_SITUATIONS.find((item) => item.id === fromSituation)
    : null;

  const path = regionSigunguPath(sido, sigungu);
  const url = absoluteUrl(path);
  const [res, verifiedPartners] = await Promise.all([
    listTaxAccountants({ sido, sigungu }),
    listVerifiedPartners({ sido, sigungu }),
  ]);
  const faqs = buildRegionSigunguFaq(sido, sigungu);
  const links = internalLinksForSigungu(sido, sigungu);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", url: "/" },
          { name: sido, url: regionSidoPath(sido) },
          { name: sigungu, url: path },
        ])}
      />
      <JsonLd data={faqJsonLd(faqs, url)} />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <nav className="text-sm text-neutral-600">
          <Link href="/" className="hover:text-brand">
            홈
          </Link>
          <span className="mx-2">/</span>
          <Link href={regionSidoPath(sido)} className="hover:text-brand">
            {sido}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-900">{sigungu}</span>
        </nav>

        <h1 className="mt-4 text-2xl font-bold text-brand sm:text-3xl">
          {sido} {sigungu} 세무사
        </h1>
        {matchedSituation ? (
          <div className="mt-4 rounded-xl border border-brand/20 bg-brand-light/40 px-4 py-4 text-sm text-neutral-700">
            <p className="font-semibold text-brand">{matchedSituation.label} 흐름에서 이어진 페이지예요.</p>
            <p className="mt-1">
              지금은 {sido} {sigungu} 안에서 이 이슈를 다뤄본 세무사를 찾는 단계예요. 상담 요청을 남기면 같은 문맥으로 바로 이어집니다.
            </p>
          </div>
        ) : null}

        {verifiedPartners.length > 0 ? (
          <section className="mt-6" aria-labelledby="partner-heading">
            <h2 id="partner-heading" className="flex items-center gap-2 text-lg font-semibold text-brand-dark">
              FindTax 인증 파트너
              <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-ink">
                {verifiedPartners.length}
              </span>
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              FindTax가 자격을 확인한 {sido} {sigungu} 파트너 세무사입니다. 무료 상담 신청 시 우선 연결해 드립니다.
            </p>
            <ul className="mt-4 flex flex-col gap-4">
              {verifiedPartners.map((partner) => (
                <li key={partner.id}>
                  <PartnerCard partner={partner} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-10" aria-labelledby="list-heading">
          <h2 id="list-heading" className="text-lg font-semibold text-brand">
            {sido} {sigungu} 세무사 정보
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            {verifiedPartners.length > 0
              ? "아래는 공개 등록된 지역 세무사 사무소 정보입니다. 사무소로 직접 문의하거나, 위 FindTax 인증 파트너에게 무료 상담을 신청할 수 있어요."
              : "아래는 공개 등록된 지역 세무사 사무소 정보입니다. FindTax 인증 파트너 무료 상담은 아래 ‘전문가 무료 상담 받기’에서 신청하실 수 있어요."}
          </p>
          {res.isEmpty ? (
            <p className="mt-4 rounded-xl bg-brand-light p-4 text-sm shadow-md">
              {res.emptyMessage ?? NO_ACCOUNTANTS_FALLBACK_MESSAGE}
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-4">
              {res.accountants.map((accountant) => (
                <li key={accountant.id}>
                  <AccountantCard accountant={accountant} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10 rounded-xl border border-brand/30 bg-brand-light/40 p-5 shadow-md">
          <p className="text-base font-bold text-brand-dark">
            FindTax 인증 파트너에게 무료 상담받기
          </p>
          <p className="mt-2 text-sm font-medium text-neutral-700">
            {sido} {sigungu} 상황에 맞는 FindTax 인증 세무사를 무료로 매칭해 드립니다. 해당 지역 파트너가 아직 없으면 인접 지역에서 연결해 드려요.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/consult"
              className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-ink shadow-md hover:bg-brand-light"
            >
              전문가 무료 상담 받기
            </Link>
            <Link
              href={calculatorPath("종합소득세")}
              className="inline-flex items-center justify-center rounded-xl border border-brand bg-white px-4 py-3 text-sm font-semibold text-brand-dark shadow-sm hover:bg-brand-light"
            >
              세금 계산기 먼저 보기
            </Link>
          </div>
        </section>

        <InternalLinksSection links={links} />
        <FaqSection items={faqs} />
        <StickyPageLeadSection
          defaultSido={sido}
          defaultSigungu={sigungu}
          defaultSituation={matchedSituation?.id}
          defaultMessage={
            matchedSituation
              ? `[${matchedSituation.label}] 흐름에서 ${sido} ${sigungu} 지역 세무사 연결을 요청합니다.\n\n- 현재 이슈: ${matchedSituation.label}\n- 확인하고 싶은 지역: ${sido} ${sigungu}`
              : undefined
          }
        />
      </div>
    </>
  );
}
