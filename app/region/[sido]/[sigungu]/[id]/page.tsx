import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import {
  FaqSection,
  InternalLinksSection,
  SeoBodyText,
} from "@/components/SeoBlocks";
import { StickyPageLeadSection } from "@/components/StickyPageLeadSection";
import { TrackedPhoneLink } from "@/components/TrackedPhoneLink";
import {
  breadcrumbJsonLd,
  buildRegionSigunguFaq,
  faqJsonLd,
  internalLinksForSigungu,
  localBusinessJsonLd,
} from "@/lib/seo/auto-content";
import {
  absoluteUrl,
  regionAccountantPath,
  regionSidoPath,
  regionSigunguPath,
} from "@/lib/seo/urls";
import {
  getTaxAccountantBySlug,
  listAccountantSlugParams,
} from "@/lib/tax-accountants";
import type { Metadata } from "next";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  return listAccountantSlugParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sido: string; sigungu: string; id: string }>;
}): Promise<Metadata> {
  const { sido: rs, sigungu: rg, id } = await params;
  const sido = decodeURIComponent(rs);
  const sigungu = decodeURIComponent(rg);
  const { accountant } = await getTaxAccountantBySlug(decodeURIComponent(id));
  if (!accountant) {
    return { title: "세무사" };
  }
  const path = regionAccountantPath(accountant.sido, accountant.sigungu, accountant.slug);
  const canonical = absoluteUrl(path);
  const desc =
    (accountant.bio && accountant.bio.slice(0, 155)) ||
    `${accountant.office_name} ${accountant.sido} ${accountant.sigungu} 세무 상담.`;
  return {
    title: `${accountant.office_name} | ${accountant.sido} ${accountant.sigungu} 세무사`,
    description: desc,
    alternates: { canonical },
    // 프로필 단건 페이지는 내용이 얇아(주소·연락처 수준) 대량 색인 시 저품질 판정 리스크가 있다.
    // 리뷰·전문분야 등 콘텐츠 보강 전까지 noindex 유지 (지역 목록 페이지는 계속 색인).
    robots: { index: false, follow: true },
    openGraph: {
      url: canonical,
      title: accountant.office_name,
      description: desc,
    },
  };
}

export default async function AccountantDetailPage({
  params,
}: {
  params: Promise<{ sido: string; sigungu: string; id: string }>;
}) {
  const { sido: rs, sigungu: rg, id: rid } = await params;
  const sido = decodeURIComponent(rs);
  const sigungu = decodeURIComponent(rg);
  const slug = decodeURIComponent(rid);

  const { accountant, error } = await getTaxAccountantBySlug(slug);
  if (!accountant || error) notFound();
  if (accountant.sido !== sido || accountant.sigungu !== sigungu) {
    permanentRedirect(
      regionAccountantPath(accountant.sido, accountant.sigungu, accountant.slug),
    );
  }

  const path = regionAccountantPath(sido, sigungu, accountant.slug);
  const pageUrl = absoluteUrl(path);
  const longBody = accountant.bio ??
    `${accountant.office_name}의 공개된 사무소 정보입니다. 상담 전 현재 맡길 세목과 업종 경험, 업무 범위, 예상 보수, 응답 방식을 직접 확인해 주세요.`;

  const faqs = buildRegionSigunguFaq(sido, sigungu);
  const links = internalLinksForSigungu(sido, sigungu);

  const lb = localBusinessJsonLd({
    name: accountant.office_name,
    description: accountant.bio,
    url: pageUrl,
    telephone: accountant.phone,
    streetAddress: accountant.address,
    addressLocality: sigungu,
    addressRegion: sido,
  });

  const tel = accountant.phone?.replace(/\D/g, "");

  return (
    <>
      <JsonLd data={lb} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", url: "/" },
          { name: sido, url: regionSidoPath(sido) },
          { name: sigungu, url: regionSigunguPath(sido, sigungu) },
          { name: accountant.office_name, url: path },
        ])}
      />
      <JsonLd data={faqJsonLd(faqs, pageUrl)} />

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
          <Link href={regionSigunguPath(sido, sigungu)} className="hover:text-brand">
            {sigungu}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-900">{accountant.office_name}</span>
        </nav>

        <div className="mt-6 flex flex-col gap-4 border-y border-line py-6 sm:flex-row sm:items-start">
          <div aria-hidden className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
            {(accountant.representative_name ?? accountant.office_name).trim().charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand sm:text-3xl">
              {accountant.office_name}
            </h1>
            {accountant.is_premium ? (
              <span className="mt-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                프리미엄
              </span>
            ) : null}
            <p className="mt-2 text-neutral-600">
              {sido} {sigungu}
              {accountant.representative_name
                ? ` · 대표 ${accountant.representative_name}`
                : ""}
            </p>
            <span className={`mt-3 inline-flex rounded px-2 py-1 text-xs font-bold ${accountant.verification_status === "findtax_verified" ? "bg-positive-pale text-positive-deep" : "bg-surface-muted text-ink-muted"}`}>
              {accountant.verification_status === "findtax_verified" ? "FindTax 파트너 서류 확인" : "공개 정보 기반 프로필"}
            </span>
            {accountant.specialties?.length ? (
              <p className="mt-2 text-sm text-neutral-800">
                {accountant.specialties.join(" · ")}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {tel ? (
                <TrackedPhoneLink
                  href={`tel:${tel}`}
                  accountantId={accountant.id}
                  officeName={accountant.office_name}
                  sido={sido}
                  sigungu={sigungu}
                  className="rounded-xl border border-brand bg-white px-4 py-2 text-sm font-semibold text-brand shadow-md"
                >
                  전화하기
                </TrackedPhoneLink>
              ) : null}
            </div>
          </div>
        </div>

        <section className="mt-8 border-y border-line py-6">
          <h2 className="text-lg font-bold text-ink">정보 확인 기준</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            {accountant.verification_status === "findtax_verified"
              ? "FindTax 파트너 신청 과정에서 자격 관련 서류와 사업자 서류를 확인한 프로필입니다."
              : "공개된 사무소 정보를 바탕으로 제공하는 탐색용 프로필이며, FindTax가 자격 서류를 별도로 확인한 파트너 프로필은 아닙니다."}
          </p>
          <p className="mt-2 text-xs text-ink-soft">
            정보 갱신일 {new Date(accountant.last_verified_at ?? accountant.updated_at).toLocaleDateString("ko-KR")}
            {accountant.source_name ? ` · 출처 ${accountant.source_name}` : ""}
          </p>
        </section>

        <article className="mt-8">
          <SeoBodyText text={longBody} />
        </article>

        <section className="mt-8 border-y border-line py-6">
          <h2 className="text-lg font-bold text-ink">상담 전에 확인할 4가지</h2>
          <ul className="mt-4 grid gap-3 text-sm text-ink sm:grid-cols-2">
            <li className="border-l-2 border-primary pl-3">내 업종과 세목의 최근 처리 경험</li>
            <li className="border-l-2 border-primary pl-3">신고·기장에 포함되는 정확한 업무 범위</li>
            <li className="border-l-2 border-primary pl-3">월 비용, 조정료, 부가세 등 전체 보수</li>
            <li className="border-l-2 border-primary pl-3">질문 채널과 평균 응답 소요시간</li>
          </ul>
        </section>

        <InternalLinksSection links={links} />
        <FaqSection items={faqs} />
        <StickyPageLeadSection
          defaultSido={sido}
          defaultSigungu={sigungu}
          defaultTargetAccountantId={accountant.id}
        />
      </div>
    </>
  );
}
