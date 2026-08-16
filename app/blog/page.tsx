import type { Metadata } from "next";
import Link from "next/link";
import {
  BLOG_CATEGORIES,
  countByCategory,
  getBlogCategory,
  isBlogCategoryId,
  resolveBlogCategory,
  type BlogCategoryId,
} from "@/lib/blog/categories";
import { BLOG_ARTICLES } from "@/lib/blog/posts";
import { absoluteUrl } from "@/lib/seo/urls";

const path = "/blog";
const PAGE_SIZE = 25;

export const metadata: Metadata = {
  title: "세무·신고 블로그",
  description:
    "종합소득세, 양도세, 부가세, 증여세, 지역별 세무사 찾기 등 실무에 도움이 되는 글을 모았습니다.",
  alternates: { canonical: absoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    url: absoluteUrl(path),
    title: "세무·신고 블로그 | findtax.kr",
    description:
      "종합소득세, 양도세, 부가세, 증여세, 지역별 세무사 찾기 등 실무에 도움이 되는 글을 모았습니다.",
  },
};

type BlogIndexPageProps = {
  searchParams?: Promise<{
    page?: string | string[];
    category?: string | string[];
  }>;
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getPageNumber(rawPage?: string | string[]) {
  const page = Number(firstParam(rawPage) ?? "1");
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

function buildHref(page: number, category: BlogCategoryId | null) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/blog?${qs}` : "/blog";
}

export default async function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const rawCategory = firstParam(resolvedSearchParams.category);
  const activeCategory: BlogCategoryId | null =
    rawCategory && isBlogCategoryId(rawCategory) ? rawCategory : null;

  const counts = countByCategory(BLOG_ARTICLES);
  const filteredArticles = activeCategory
    ? BLOG_ARTICLES.filter((a) => resolveBlogCategory(a).id === activeCategory)
    : BLOG_ARTICLES;

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / PAGE_SIZE));
  const currentPage = Math.min(getPageNumber(resolvedSearchParams.page), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleArticles = filteredArticles.slice(start, start + PAGE_SIZE);
  const activeCategoryInfo = activeCategory ? getBlogCategory(activeCategory) : null;

  return (
    <div className="app-shell-frame py-10 sm:py-14">
      <nav className="text-sm font-semibold text-ink-soft">
        <Link href="/" className="hover:text-ink">
          홈
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">블로그</span>
      </nav>

      <section className="mt-5 flex flex-col gap-5 border-b border-line pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold text-brand-dark">세무·신고 블로그</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight text-ink">
            필요한 세금 주제를
            <br />
            빠르게 찾아보세요.
          </h1>
        </div>
        <p className="max-w-md text-base leading-7 text-ink-muted">
          부업, 구매대행, 역직구, 종합소득세, 부가세처럼 실무에서 바로 막히는 주제를
          카드 형태로 정리했습니다.
        </p>
      </section>

      <nav className="mt-8" aria-label="카테고리">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              href={buildHref(1, null)}
              aria-current={activeCategory === null ? "page" : undefined}
              className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-bold transition-colors ${
                activeCategory === null
                  ? "bg-ink text-white"
                  : "border border-line bg-white text-ink-muted hover:border-line-strong hover:text-ink"
              }`}
            >
              전체 {BLOG_ARTICLES.length}
            </Link>
          </li>
          {BLOG_CATEGORIES.map((category) => {
            const count = counts.get(category.id) ?? 0;
            if (count === 0) return null;
            const isActive = activeCategory === category.id;
            return (
              <li key={category.id}>
                <Link
                  href={buildHref(1, category.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-bold transition-colors ${
                    isActive
                      ? "bg-ink text-white"
                      : "border border-line bg-white text-ink-muted hover:border-line-strong hover:text-ink"
                  }`}
                >
                  {category.label} {count}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink-muted">
          {activeCategoryInfo
            ? `${activeCategoryInfo.label} · ${activeCategoryInfo.description}`
            : "전체 글"}{" "}
          · {filteredArticles.length.toLocaleString("ko-KR")}개 · {currentPage}/{totalPages}페이지
        </p>
        <Link href="/calculator/부업" className="btn-secondary min-h-11 px-5 text-sm font-bold">
          부업 세금 계산기 보기
        </Link>
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {visibleArticles.map((a) => {
          const category = resolveBlogCategory(a);
          return (
          <li key={a.slug} className="min-h-full">
            <Link
              href={`/blog/${a.slug}`}
              className="group flex min-h-[280px] flex-col rounded-lg border border-line bg-white p-5 transition-colors duration-200 hover:border-line-strong hover:bg-surface-muted"
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${category.badgeClass}`}>
                  {category.label}
                </span>
                <span className="text-xs font-semibold text-ink-soft">{a.datePublished}</span>
              </div>
              <h2 className="mt-6 line-clamp-4 text-[1.08rem] font-black leading-snug text-ink group-hover:text-ink">
                {a.h1}
              </h2>
              <p className="mt-4 line-clamp-5 text-sm leading-6 text-ink-muted">
                {a.metaDescription}
              </p>
              <span className="mt-auto pt-5 text-sm font-bold text-brand-dark">
                읽어보기
              </span>
            </Link>
          </li>
          );
        })}
      </ul>

      {visibleArticles.length === 0 ? (
        <p className="mt-10 rounded-lg border border-line bg-surface-muted px-5 py-6 text-center text-sm text-ink-muted">
          이 카테고리에는 아직 글이 없습니다.{" "}
          <Link href="/blog" className="font-bold text-brand-dark underline underline-offset-4">
            전체 글 보기
          </Link>
        </p>
      ) : null}

      {totalPages > 1 ? (
        <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="블로그 페이지">
          <Link
            href={buildHref(Math.max(1, currentPage - 1), activeCategory)}
            className={`btn-secondary min-h-11 px-5 text-sm font-bold ${
              currentPage === 1 ? "pointer-events-none opacity-45" : ""
            }`}
            aria-disabled={currentPage === 1}
          >
            이전
          </Link>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Link
              key={page}
              href={buildHref(page, activeCategory)}
              className={`flex h-11 w-11 items-center justify-center rounded-lg text-sm font-black ${
                page === currentPage
                  ? "bg-primary text-white"
                  : "border border-line bg-white text-ink hover:border-line-strong hover:bg-surface-muted"
              }`}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </Link>
          ))}
          <Link
            href={buildHref(Math.min(totalPages, currentPage + 1), activeCategory)}
            className={`btn-secondary min-h-11 px-5 text-sm font-bold ${
              currentPage === totalPages ? "pointer-events-none opacity-45" : ""
            }`}
            aria-disabled={currentPage === totalPages}
          >
            다음
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
