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
import { isRegionIndexable, summarizeRegion } from "@/lib/seo/region-insights";

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
  const path = regionSigunguPath(sido, sigungu);
  const canonical = absoluteUrl(path);
  const { accountants } = await listTaxAccountants({ sido, sigungu });
  const summary = summarizeRegion(accountants);
  const dongs = summary.topDongs.slice(0, 3).map((d) => d.dong).join("·");
  const title =
    summary.officeCount > 0
      ? `${sigungu} 세무사 사무소 ${summary.officeCount}곳 위치·연락처 (${sido})`
      : `${sido} ${sigungu} 세무사 찾기`;
  const desc =
    summary.officeCount > 0
      ? `${sido} ${sigungu}에 공개 등록된 세무사 사무소 ${summary.officeCount}곳의 위치와 연락처를 정리했습니다.${dongs ? ` ${dongs} 등에 많이 모여 있으며,` : ""} 기장·신고 상담 전 확인할 점도 함께 안내합니다.`
      : `${sido} ${sigungu} 지역 세무사 목록과 상담 요청 정보를 확인할 수 있습니다.`;

  return {
    title,
    description: desc,
    alternates: { canonical },
    // 공개 등록 사무소가 충분한 지역만 색인한다. 개별 세무사 프로필은 계속 noindex.
    robots: { index: isRegionIndexable(summary), follow: true },
    openGraph: {
      url: canonical,
      title,
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
  const summary = summarizeRegion(res.accountants);
  const faqs = [
    ...(summary.officeCount > 0
      ? [
          {
            question: `${sido} ${sigungu}에는 세무사 사무소가 몇 곳 있나요?`,
            answer: `한국세무사회 공개 등록 정보를 기준으로 ${summary.officeCount}곳(세무사 ${summary.accountantCount}명)이 확인됩니다.${
              summary.topDongs.length
                ? ` ${summary.topDongs
                    .slice(0, 3)
                    .map((d) => `${d.dong} ${d.offices}곳`)
                    .join(", ")} 순으로 많습니다.`
                : ""
            } 이전·폐업 등으로 실제와 다를 수 있으니 방문 전 사무소에 확인하세요.`,
          },
        ]
      : []),
    ...buildRegionSigunguFaq(sido, sigungu),
  ];
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
        {summary.officeCount > 0 ? (
          <section aria-labelledby="region-summary" className="mt-4 rounded-xl border border-line bg-white p-5">
            <h2 id="region-summary" className="text-base font-bold text-ink">
              {sigungu} 세무사 한눈에 보기
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-700">
              {sido} {sigungu}에는 공개 등록된 세무사 사무소가 <strong>{summary.officeCount}곳</strong>(세무사{" "}
              {summary.accountantCount}명) 있습니다.
              {summary.topDongs.length > 0 ? ` 사무소는 ${summary.topDongs[0]!.dong}에 가장 많이 모여 있습니다.` : null}
            </p>
            {summary.topDongs.length > 1 ? (
              <table className="mt-3 w-full text-left text-sm">
                <caption className="sr-only">{sigungu} 법정동별 세무사 사무소 수</caption>
                <thead>
                  <tr className="border-b border-line text-neutral-500">
                    <th className="py-1.5 font-medium">법정동</th>
                    <th className="py-1.5 font-medium">사무소 수</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topDongs.map((d) => (
                    <tr key={d.dong} className="border-b border-line/60">
                      <td className="py-1.5">{d.dong}</td>
                      <td className="py-1.5">{d.offices}곳</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
            <p className="mt-3 text-xs leading-5 text-neutral-500">
              한국세무사회 공개 등록 정보를 바탕으로 정리했습니다. 이전·폐업 등으로 실제와 다를 수 있으니 방문 전 사무소에 확인하세요.
              기장료·상담 비용은 사무소마다 다르므로 업종·매출 규모를 알려 주고 견적을 비교하는 것이 좋습니다.
            </p>
          </section>
        ) : null}
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
