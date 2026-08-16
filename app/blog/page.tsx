import type { Metadata } from "next";
import Link from "next/link";
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
  }>;
};

function getPageNumber(rawPage?: string | string[]) {
  const value = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  const page = Number(value ?? "1");
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

function pageHref(page: number) {
  return page <= 1 ? "/blog" : `/blog?page=${page}`;
}

export default async function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const totalPages = Math.max(1, Math.ceil(BLOG_ARTICLES.length / PAGE_SIZE));
  const currentPage = Math.min(getPageNumber(resolvedSearchParams.page), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleArticles = BLOG_ARTICLES.slice(start, start + PAGE_SIZE);

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

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink-muted">
          전체 {BLOG_ARTICLES.length.toLocaleString("ko-KR")}개 글 · {currentPage}/{totalPages}페이지
        </p>
        <Link href="/calculator/부업" className="btn-secondary min-h-11 px-5 text-sm font-bold">
          부업 세금 계산기 보기
        </Link>
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {visibleArticles.map((a, index) => (
          <li key={a.slug} className="min-h-full">
            <Link
              href={`/blog/${a.slug}`}
              className="group flex min-h-[280px] flex-col rounded-lg border border-line bg-white p-5 transition-colors duration-200 hover:border-line-strong hover:bg-surface-muted"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-md bg-surface-muted px-3 py-1 text-xs font-bold text-ink-muted">
                  {start + index + 1}
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
        ))}
      </ul>

      {totalPages > 1 ? (
        <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="블로그 페이지">
          <Link
            href={pageHref(Math.max(1, currentPage - 1))}
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
              href={pageHref(page)}
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
            href={pageHref(Math.min(totalPages, currentPage + 1))}
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
