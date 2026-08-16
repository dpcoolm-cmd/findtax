import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FaqSection, InternalLinksSection } from "@/components/SeoBlocks";
import { StickyPageLeadSection } from "@/components/StickyPageLeadSection";
import { JsonLd } from "@/components/JsonLd";
import {
  breadcrumbJsonLd,
  buildMainFaq,
  faqJsonLd,
  internalLinksForSigungu,
} from "@/lib/seo/auto-content";
import { getSigunguBySido } from "@/lib/regions";
import { absoluteUrl, regionSidoPath, regionSigunguPath, situationPath } from "@/lib/seo/urls";
import { TAX_SITUATIONS } from "@/lib/situations";
import { listActiveRegionPairs } from "@/lib/tax-accountants";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  const rows = await listActiveRegionPairs();
  const sidos = [...new Set(rows.map((row) => row.sido))];
  return sidos.map((sido) => ({ sido }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sido: string }>;
}): Promise<Metadata> {
  const { sido: raw } = await params;
  const sido = decodeURIComponent(raw);
  const activeRows = await listActiveRegionPairs();
  const hasActiveDistrict = activeRows.some((row) => row.sido === sido);
  const path = regionSidoPath(sido);
  const canonical = absoluteUrl(path);
  const desc = `${sido} 지역 세무사 목록과 무료 상담 연결 정보를 확인할 수 있습니다.`;

  return {
    title: `${sido} 세무사 찾기`,
    description: desc,
    alternates: { canonical },
    robots: { index: hasActiveDistrict, follow: true },
    openGraph: {
      url: canonical,
      title: `${sido} 세무사 찾기`,
      description: desc,
    },
  };
}

export default async function RegionSidoPage({
  params,
  searchParams,
}: {
  params: Promise<{ sido: string }>;
  searchParams: Promise<{ situation?: string | string[] | undefined }>;
}) {
  const { sido: raw } = await params;
  const query = await searchParams;
  const sido = decodeURIComponent(raw);
  const fromSituation = typeof query.situation === "string" ? query.situation : null;

  const activeRows = await listActiveRegionPairs();
  const activeDistricts = activeRows
    .filter((row) => row.sido === sido)
    .map((row) => row.sigungu);
  const knownDistricts = getSigunguBySido(sido);
  const orderedKnownDistricts = knownDistricts.filter((district) =>
    activeDistricts.includes(district),
  );
  const extraActiveDistricts = activeDistricts
    .filter((district) => !knownDistricts.includes(district))
    .sort((a, b) => a.localeCompare(b, "ko"));
  const districts = [...orderedKnownDistricts, ...extraActiveDistricts];

  if (!districts.length) notFound();

  const path = regionSidoPath(sido);
  const url = absoluteUrl(path);
  const faqs = buildMainFaq();
  const sampleSigungu = districts[0]!;
  const links = internalLinksForSigungu(sido, sampleSigungu);
  const matchedSituation = fromSituation
    ? TAX_SITUATIONS.find((item) => item.id === fromSituation)
    : null;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", url: "/" },
          { name: sido, url: path },
        ])}
      />
      <JsonLd data={faqJsonLd(faqs, url)} />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <nav className="text-sm text-neutral-600">
          <Link href="/" className="hover:text-brand">
            홈
          </Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-900">{sido}</span>
        </nav>

        <h1 className="mt-4 text-2xl font-bold text-brand sm:text-3xl">{sido} 세무사 찾기</h1>
        <p className="mt-2 text-neutral-600">
          실제 등록된 지역만 우선 보여드립니다. 구·군을 선택하면 해당 지역 세무사와 상담 요청 흐름까지 확인할 수 있어요.
        </p>
        {matchedSituation ? (
          <div className="mt-4 rounded-xl border border-brand/20 bg-brand-light/40 px-4 py-4 text-sm text-neutral-700">
            <p className="font-semibold text-brand">{matchedSituation.label} 흐름에서 이어서 보고 있어요.</p>
            <p className="mt-1">
              지금은 {sido} 안에서 이 이슈를 다루는 세무사를 먼저 찾는 단계예요. 비교가 끝났다면 이 문맥 그대로 상담으로 이어갈 수 있어요.
            </p>
          </div>
        ) : null}

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-brand">구·군 선택</h2>
          <ul className="mt-4 grid grid-cols-2 gap-2">
            {districts.map((district) => (
              <li key={district}>
                <Link
                  href={`${regionSigunguPath(sido, district)}${
                    matchedSituation ? `?situation=${encodeURIComponent(matchedSituation.id)}` : ""
                  }`}
                  className="block rounded-xl border border-brand-light bg-brand-light/40 px-4 py-3 text-sm font-medium text-brand shadow-sm hover:bg-brand-light"
                >
                  {district}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-brand">상황별 바로가기</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {TAX_SITUATIONS.map((situation) => (
              <li key={situation.id}>
                <Link
                  href={situationPath(situation.id)}
                  className="inline-block rounded-full bg-white px-3 py-1.5 text-xs font-medium text-brand shadow-md ring-1 ring-brand/20 hover:bg-brand-light"
                >
                  {situation.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <InternalLinksSection links={links} />
        <FaqSection items={faqs} />
        <StickyPageLeadSection
          defaultSido={sido}
          defaultSigungu={sampleSigungu}
          defaultSituation={matchedSituation?.id}
          defaultMessage={
            matchedSituation
              ? `[${matchedSituation.label}] 흐름에서 ${sido} 지역 세무사 연결을 이어서 요청합니다.\n\n- 현재 이슈: ${matchedSituation.label}\n- 확인하고 싶은 지역: ${sido}`
              : undefined
          }
        />
      </div>
    </>
  );
}
