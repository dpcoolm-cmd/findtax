import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogPostCta } from "@/components/BlogPostCta";
import { JsonLd } from "@/components/JsonLd";
import { resolveBlogCategory } from "@/lib/blog/categories";
import { getAllBlogSlugs, getBlogArticle } from "@/lib/blog/posts";
import { getBaseUrl, siteName } from "@/lib/seo/site";
import { absoluteUrl } from "@/lib/seo/urls";

type Props = { params: Promise<{ slug: string }> };

function getBlogCta(article: { slug: string; h1: string; keywords: string[] }) {
  const text = `${article.slug} ${article.h1} ${article.keywords.join(" ")}`;

  if (text.includes("기장")) {
    return {
      title: "기장료가 적정한지 먼저 비교해 보세요",
      description:
        "매출, 거래자료 수, 직원 수를 넣으면 직접 관리가 나은지 기장 의뢰가 나은지 판단할 수 있습니다.",
      href: "/calculator/jangbu",
      calculatorType: "bookkeeping_decision",
    };
  }

  if (
    text.includes("부가세") ||
    text.includes("구매대행") ||
    text.includes("역직구") ||
    text.includes("스마트스토어")
  ) {
    return {
      title: "부가세 신고를 직접 할지 세무사에게 맡길지 확인하세요",
      description:
        "과세유형, 매출·매입자료, 플랫폼 정산, 해외판매 여부를 기준으로 신고 난이도를 진단합니다.",
      href: "/calculator/부가세",
      calculatorType: "vat_decision",
    };
  }

  if (text.includes("부업")) {
    return {
      title: "부업 세금 위험도를 먼저 확인하세요",
      description:
        "월평균 수입, 비용, 원천징수, 사업자등록 상태를 넣으면 종합소득세·부가세 검토 필요성을 볼 수 있습니다.",
      href: "/calculator/부업",
      calculatorType: "side_hustle",
    };
  }

  if (text.includes("양도")) {
    return {
      title: "양도세 부담과 상담 필요성을 먼저 계산해 보세요",
      description:
        "양도가액, 취득가액, 필요경비를 바탕으로 예상 세액과 상담 필요 구간을 확인합니다.",
      href: "/calculator/양도세",
      calculatorType: "transfer_tax",
    };
  }

  if (text.includes("연금") || text.includes("IRP") || text.includes("ISA")) {
    return {
      title: "연금·IRP 절세 효과를 숫자로 확인하세요",
      description:
        "소득 구간과 납입액을 넣으면 예상 세액공제와 계좌별 납입 구성을 비교할 수 있습니다.",
      href: "/calculator/연말정산",
      calculatorType: "year_end_tax",
    };
  }

  return {
    title: "종합소득세를 직접 신고할지 판단해 보세요",
    description:
      "소득 유형, 수입·비용, 원천징수, 증빙 상태를 넣으면 직접 신고 가능성과 세무사 검토 필요성을 나눠 보여줍니다.",
    href: "/calculator/종합소득세",
    calculatorType: "income_decision",
  };
}

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
    robots: { index: true, follow: true },
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
          {article.datePublished} · 작성: {" "}
          <Link href="/about" rel="author" className="underline underline-offset-4">
            FindTax 편집팀
          </Link>
        </p>
        <p className="mt-8 text-lg leading-relaxed text-neutral-800">
          {article.intro}
        </p>

        {article.sections.map((s) => (
          <section key={s.h2} className="mt-10">
            <h2 className="text-2xl font-bold leading-snug text-ink">{s.h2}</h2>
            {s.paragraphs.map((p, i) => (
              <p key={i} className="mt-4 leading-8 text-ink-muted">
                {p}
              </p>
            ))}
          </section>
        ))}

        <div className="mt-12 rounded-lg border border-line-strong bg-surface-muted p-6">
          <p className="leading-8 text-ink-muted">{article.closing}</p>
        </div>

        {article.sources?.length ? (
          <section className="mt-10 border-t border-line pt-6">
            <h2 className="text-base font-bold text-ink">확인한 공식 자료</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-muted">
              {article.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand underline underline-offset-4"
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
            FindTax 편집팀은 국세청·금융위원회·법령 등 공개된 공식 자료를 우선 확인합니다.
            세법과 금융상품 조건은 개인 상황과 기준일에 따라 달라질 수 있으므로 실제 신고·가입 전 최신 안내를 다시 확인하세요.
          </p>
          <p className="mt-2">
            <Link href="/editorial-policy" className="font-semibold text-brand underline underline-offset-4">
              편집 원칙과 수정 정책 보기
            </Link>
          </p>
        </aside>

        <BlogPostCta
          slug={article.slug}
          title={cta.title}
          description={cta.description}
          href={cta.href}
          calculatorType={cta.calculatorType}
        />
      </article>
      </div>
    </>
  );
}
