import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/auto-content";
import {
  absoluteUrl,
  regionAccountantPath,
  regionSidoPath,
  regionSigunguPath,
  taxAccountantProfilePath,
} from "@/lib/seo/urls";
import { getTaxAccountantById, listTaxAccountantProfileIds } from "@/lib/tax-accountants";
import type { Metadata } from "next";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  return listTaxAccountantProfileIds();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { accountant } = await getTaxAccountantById(id);
  if (!accountant) return { title: "세무사 프로필" };

  const canonical = absoluteUrl(
    regionAccountantPath(accountant.sido, accountant.sigungu, accountant.slug),
  );

  return {
    title: `${accountant.office_name} | 세무사 프로필`,
    description: `${accountant.sido} ${accountant.sigungu} ${accountant.office_name} 상세 정보`,
    alternates: { canonical },
    robots: { index: false, follow: true },
  };
}

export default async function TaxAccountantProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { accountant, error } = await getTaxAccountantById(id);
  if (!accountant || error) notFound();

  const path = taxAccountantProfilePath(accountant.id);
  const canonicalPath = regionAccountantPath(accountant.sido, accountant.sigungu, accountant.slug);
  const regionPath = regionSigunguPath(accountant.sido, accountant.sigungu);
  const reviews = accountant.review_count ?? 0;
  const avg = accountant.review_avg != null ? Number(accountant.review_avg) : null;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", url: "/" },
          { name: accountant.sido, url: regionSidoPath(accountant.sido) },
          { name: accountant.sigungu, url: regionPath },
          { name: accountant.office_name, url: path },
        ])}
      />

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <nav className="text-sm text-neutral-600">
          <Link href="/" className="hover:text-brand">
            홈
          </Link>
          <span className="mx-2">/</span>
          <Link href={regionPath} className="hover:text-brand">
            {accountant.sido} {accountant.sigungu}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-900">프로필</span>
        </nav>

        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-brand sm:text-3xl">{accountant.office_name}</h1>
          {accountant.representative_name ? (
            <p className="mt-2 text-sm font-medium text-neutral-700">
              대표 {accountant.representative_name}
            </p>
          ) : null}
          {accountant.address ? (
            <p className="mt-2 text-sm text-neutral-600">{accountant.address}</p>
          ) : null}
          <p className="mt-3 text-sm text-neutral-600">
            이 페이지는 보조 프로필 주소입니다. 검색에는 대표 상세 페이지를 사용합니다.
          </p>
          {reviews > 0 && avg != null && !Number.isNaN(avg) ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-neutral-700">
              <span>리뷰 {reviews.toLocaleString("ko-KR")}건</span><span>·</span><span>평점 {avg.toFixed(1)}</span>
            </div>
          ) : null}
          <Link
            href={canonicalPath}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-ink shadow-md hover:bg-brand-light"
          >
            대표 상세 페이지 보기
          </Link>
        </div>
      </div>
    </>
  );
}
