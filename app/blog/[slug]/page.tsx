import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogPostCta } from "@/components/BlogPostCta";
import { JsonLd } from "@/components/JsonLd";
import { resolveBlogCategory } from "@/lib/blog/categories";
import { getAllBlogSlugs, getBlogArticle, hasSourceReferences } from "@/lib/blog/posts";
import { getBlogCta } from "@/lib/blog/cta";
import { getBaseUrl, siteName } from "@/lib/seo/site";
import { absoluteUrl } from "@/lib/seo/urls";

type Props = { params: Promise<{ slug: string }> };


export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

/**
 * 글마다 metaTitle 끝에 "| FindTax" 또는 "| findtax.kr"을 직접 붙여 둔 경우가 있는데,
 * 레이아웃 title 템플릿(`%s | findtax.kr`)이 한 번 더 붙여 브랜드명이 중복된다.
 * 여기서 접미사를 제거해 템플릿이 한 번만 붙도록 정리한다.
 */
function stripBrandSuffix(title: string): string {
  return title.replace(/\s*\|\s*(findtax\.kr|FindTax)\s*$/i, "").trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const article = getBlogArticle(slug);
  if (!article) {
    return { title: "찾을 수 없음" };
  }
  const url = absoluteUrl(`/blog/${slug}`);
  const cleanTitle = stripBrandSuffix(article.metaTitle);
  return {
    title: cleanTitle,
    description: article.metaDescription,
    keywords: article.keywords,
    alternates: { canonical: url },
    robots: hasSourceReferences(article)
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      url,
      title: cleanTitle,
      description: article.metaDescription,
      type: "article",
      publishedTime: `${article.datePublished}T09:00:00+09:00`,
      modifiedTime: `${article.dateModified}T09:00:00+09:00`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const article = getBlogArticle(slug);
  if (!article) notFound();

  const url = absoluteUrl(`/blog/${slug}`);
  const base = getBaseUrl();
  const cta = getBlogCta(article);
  const category = resolveBlogCategory(article);

  const articleJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.h1,
    description: article.metaDescription,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    author: {
      "@type": "Organization",
      name: siteName,
      url: `${base}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: base,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    keywords: article.keywords.join(", "),
    inLanguage: "ko-KR",
  };

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <div className="bg-white">
      <article className="mx-auto max-w-[820px] px-4 py-12 sm:px-6 sm:py-16">
        <nav className="text-sm text-neutral-600">
          <Link href="/" className="hover:text-brand">
            홈
          </Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-brand">
            블로그
          </Link>
          <span className="mx-2">/</span>
          <span className="line-clamp-1 text-neutral-900">{article.h1}</span>
        </nav>

        <div className="mt-5">
          <Link
            href={`/blog?category=${category.id}`}
            className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold transition-opacity hover:opacity-80 ${category.badgeClass}`}
          >
            {category.label}
          </Link>
        </div>

        <h1 className="mt-3 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
          {article.h1}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          발행 <time dateTime={article.datePublished}>{article.datePublished}</time>
          {" · 수정 "}<time dateTime={article.dateModified}>{article.dateModified}</time>
          {" · 작성: "}
          <Link href="/about" rel="author" className="underline underline-offset-4">
            FindTax 편집팀
          </Link>
        </p>
        <div className="mt-4 border-l-2 border-brand-dark pl-4 text-sm leading-6 text-neutral-600">
          <p>작성·편집: FindTax 편집팀</p>
          <p>
            출처 표시는 참고한 자료를 안내하며, 모든 내용의 최신성이나 세무사의 개별 검수를 보증하지 않습니다.
          </p>
        </div>
        {article.revisionNote ? (
          <p className="mt-3 text-sm leading-6 text-neutral-600">이번 수정: {article.revisionNote}</p>
        ) : null}
        {article.originalSource ? (
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            원문과 작성 배경: {" "}
            <a href={article.originalSource.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
              {article.originalSource.title}
            </a>
          </p>
        ) : null}
        <p className="mt-8 text-lg leading-relaxed text-neutral-800">
          {article.intro}
        </p>
        {!hasSourceReferences(article) ? (
          <aside className="mt-5 border-l-4 border-amber-600 bg-amber-50 p-4 text-sm leading-7 text-ink">
            보관된 이전 글입니다. 출처 보완이 필요하므로 이 글만으로 신고나 거래를 결정하지 마세요.
            <Link href="/blog" className="ml-2 font-semibold underline underline-offset-4">현재 가이드 보기</Link>
          </aside>
        ) : null}

        <nav aria-label="이 글의 목차" className="mt-8 border-y border-line py-5">
          <h2 className="text-base font-bold text-ink">이 글에서 확인할 내용</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
            {article.sections.map((section, index) => (
              <li key={section.h2}>
                <a href={`#section-${index + 1}`} className="text-neutral-700 underline decoration-neutral-300 underline-offset-4 hover:text-ink">
                  {section.h2}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {article.sections.map((s, index) => (
          <section key={s.h2} id={`section-${index + 1}`} className="mt-10 scroll-mt-32">
            <h2 className="text-2xl font-bold leading-snug text-ink">{s.h2}</h2>
            {s.paragraphs.map((p, i) => (
              <p key={i} className="mt-4 leading-8 text-ink-muted">
                {p}
              </p>
            ))}
            {s.table ? (
              <div className="mt-5 overflow-x-auto rounded-lg border border-line" role="region" aria-label={s.table.caption} tabIndex={0}>
                <table className="w-full min-w-[540px] border-collapse text-left text-sm leading-6">
                  <caption className="bg-white px-4 py-3 text-left font-semibold text-ink">{s.table.caption}</caption>
                  <thead className="bg-surface-muted text-ink">
                    <tr>{s.table.headers.map((header) => <th key={header} scope="col" className="px-4 py-3 font-bold">{header}</th>)}</tr>
                  </thead>
                  <tbody>{s.table.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-line">
                      {row.map((cell, columnIndex) => columnIndex === 0
                        ? <th key={columnIndex} scope="row" className="px-4 py-3 font-semibold text-ink">{cell}</th>
                        : <td key={columnIndex} className="px-4 py-3 text-neutral-700">{cell}</td>)}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : null}
            {s.checklist ? (
              <ul className="mt-5 list-disc space-y-3 border-l-2 border-brand-dark pl-7 text-base leading-7 text-neutral-700">
                {s.checklist.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : null}
          </section>
        ))}

        <div className="mt-12 rounded-lg border border-line-strong bg-surface-muted p-6">
          <p className="leading-8 text-ink-muted">{article.closing}</p>
        </div>

        {article.sources?.length ? (
          <section className="mt-10 border-t border-line pt-6">
            <h2 className="text-base font-bold text-ink">출처와 참고 자료</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-muted">
              {article.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-neutral-800 underline underline-offset-4 hover:text-brand-dark"
                  >
                    {source.title}
                  </a>
                  <span className="ml-2 text-neutral-500">확인 {source.checkedAt}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <aside className="mt-8 border-y border-line py-5 text-sm leading-7 text-ink-muted">
          <p>
            이 글은 일반적인 정보 제공을 위한 자료이며 개별 세무 자문이나 신고 대행이 아닙니다.
            출처 확인일은 전문가 검수일을 뜻하지 않습니다. 실제 신고·가입 전에는 해당 연도와 본인 상황에 적용되는 요건을 확인하세요.
          </p>
          <p className="mt-2">
            <Link href="/editorial-policy" className="font-semibold text-neutral-800 underline underline-offset-4">
              편집 원칙과 수정 정책 보기
            </Link>
            {" · "}<Link href="/support" className="font-semibold text-neutral-800 underline underline-offset-4">오류 제보</Link>
          </p>
        </aside>

        <BlogPostCta
          slug={article.slug}
          title={cta.title}
          description={cta.description}
          href={cta.href}
          calculatorType={cta.calculatorType}
          {...(cta.calculatorType === "retirement_income" ? { secondaryHref: "/calculator/연말정산", secondaryLabel: "연금·IRP 절세 확인" } : {})}
        />
      </article>
      </div>
    </>
  );
}
