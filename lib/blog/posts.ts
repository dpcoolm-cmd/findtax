import { BLOG_ARTICLES_PART1 } from "@/lib/blog/all-posts-part1";
import { BLOG_ARTICLES_PART2 } from "@/lib/blog/all-posts-part2";
import { BLOG_ARTICLES_PART3 } from "@/lib/blog/all-posts-part3";
import { BLOG_ARTICLES_PART4 } from "@/lib/blog/all-posts-part4";
import { BLOG_ARTICLES_PART5 } from "@/lib/blog/all-posts-part5";
import { BLOG_ARTICLES_PART6 } from "@/lib/blog/all-posts-part6";
import { BLOG_ARTICLES_PART7 } from "@/lib/blog/all-posts-part7";
import { BLOG_ARTICLES_PART8 } from "@/lib/blog/all-posts-part8";
import { BLOG_ARTICLES_PART9 } from "@/lib/blog/all-posts-part9";
import { BLOG_ARTICLES_PART10 } from "@/lib/blog/all-posts-part10";
import { BLOG_ARTICLES_PART11 } from "@/lib/blog/all-posts-part11";
import { BLOG_ARTICLES_PART12 } from "@/lib/blog/all-posts-part12";
import { BLOG_ARTICLES_PART13 } from "@/lib/blog/all-posts-part13";
import { BLOG_ARTICLES_PART14 } from "@/lib/blog/all-posts-part14";
import { BLOG_ARTICLES_PART15 } from "@/lib/blog/all-posts-part15";
import { BLOG_ARTICLES_PART16 } from "@/lib/blog/all-posts-part16";
import { BLOG_ARTICLES_PART17 } from "@/lib/blog/all-posts-part17";
import { mergeBlogExtra } from "@/lib/blog/extra-body";
import type { BlogArticle } from "@/lib/blog/types";
import { hasSourceReferences } from "./source-references";
export { hasSourceReferences } from "./source-references";

function finalizeArticle(a: BlogArticle): BlogArticle {
  return mergeBlogExtra(a);
}

/**
 * 최신 파트가 앞에 오도록 나열합니다. 같은 slug가 여러 파트에 있으면
 * 앞(=더 최신)에 있는 글이 이기고 뒤의 글은 자동으로 제외됩니다.
 * 새 파트를 추가할 때는 import 후 이 배열 맨 앞에 넣기만 하면 됩니다.
 */
const ALL_PARTS: BlogArticle[][] = [
  BLOG_ARTICLES_PART17,
  BLOG_ARTICLES_PART16,
  BLOG_ARTICLES_PART15,
  BLOG_ARTICLES_PART14,
  BLOG_ARTICLES_PART13,
  BLOG_ARTICLES_PART12,
  BLOG_ARTICLES_PART11,
  BLOG_ARTICLES_PART10,
  BLOG_ARTICLES_PART9,
  BLOG_ARTICLES_PART8,
  BLOG_ARTICLES_PART7,
  BLOG_ARTICLES_PART6,
  BLOG_ARTICLES_PART5,
  BLOG_ARTICLES_PART4,
  BLOG_ARTICLES_PART3,
  BLOG_ARTICLES_PART1,
  BLOG_ARTICLES_PART2,
];

function dedupeBySlug(articles: BlogArticle[]): BlogArticle[] {
  const seen = new Set<string>();
  const out: BlogArticle[] = [];
  for (const article of articles) {
    if (seen.has(article.slug)) continue;
    seen.add(article.slug);
    out.push(article);
  }
  return out;
}

const ALL_BLOG_ARTICLES: BlogArticle[] = dedupeBySlug(
  ALL_PARTS.flat(),
).map(finalizeArticle);


/**
 * Public blog surfaces only include articles with directly checkable sources.
 * Older drafts remain addressable for link continuity, but are noindex and are
 * excluded from listings and the sitemap until source references are supplied.
 * This structural filter does not certify factual accuracy or expert review.
 */
export const BLOG_ARTICLES: BlogArticle[] = ALL_BLOG_ARTICLES.filter(hasSourceReferences);

const bySlug = new Map(ALL_BLOG_ARTICLES.map((a) => [a.slug, a]));

export function getBlogArticle(slug: string): BlogArticle | undefined {
  return bySlug.get(slug);
}

export function getAllBlogSlugs(): string[] {
  return BLOG_ARTICLES.map((a) => a.slug);
}

/** 본문 글자수(공백·줄바꿈 포함) — 일반적인 ‘글자 수’ 기준 */
export function countBlogBodyChars(article: BlogArticle): number {
  const parts = [
    article.intro,
    ...article.sections.flatMap((s) => [
      s.h2, ...s.paragraphs, ...(s.checklist ?? []),
      ...(s.table ? [s.table.caption, ...s.table.headers, ...s.table.rows.flat()] : []),
    ]),
    article.closing,
  ];
  return parts.join("\n").length;
}
