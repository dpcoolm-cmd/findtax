import { BLOG_ARTICLES_PART1 } from "@/lib/blog/all-posts-part1";
import { BLOG_ARTICLES_PART2 } from "@/lib/blog/all-posts-part2";
import { BLOG_ARTICLES_PART3 } from "@/lib/blog/all-posts-part3";
import { BLOG_ARTICLES_PART4 } from "@/lib/blog/all-posts-part4";
import { BLOG_ARTICLES_PART5 } from "@/lib/blog/all-posts-part5";
import { BLOG_ARTICLES_PART6 } from "@/lib/blog/all-posts-part6";
import {
  buildLengthPadSection,
  mergeBlogExtra,
} from "@/lib/blog/extra-body";
import type { BlogArticle } from "@/lib/blog/types";

function finalizeArticle(a: BlogArticle): BlogArticle {
  let m = mergeBlogExtra(a);
  if (countBlogBodyChars(m) < 1500) {
    m = { ...m, sections: [...m.sections, buildLengthPadSection(a.slug)] };
  }
  return m;
}

/**
 * 최신 파트가 앞에 오도록 나열합니다. 같은 slug가 여러 파트에 있으면
 * 앞(=더 최신)에 있는 글이 이기고 뒤의 글은 자동으로 제외됩니다.
 * 새 파트를 추가할 때는 import 후 이 배열 맨 앞에 넣기만 하면 됩니다.
 */
const ALL_PARTS: BlogArticle[][] = [
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

export const BLOG_ARTICLES: BlogArticle[] = dedupeBySlug(
  ALL_PARTS.flat(),
).map(finalizeArticle);

const bySlug = new Map(BLOG_ARTICLES.map((a) => [a.slug, a]));

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
    ...article.sections.flatMap((s) => [s.h2, ...s.paragraphs]),
    article.closing,
  ];
  return parts.join("\n").length;
}
