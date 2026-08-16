import type { BlogArticle } from "@/lib/blog/types";

/**
 * 블로그 카테고리.
 * 글마다 category를 직접 지정할 수도 있지만, 지정하지 않으면 slug·키워드로 자동 분류한다.
 * (기존 글 수십 편을 일일이 고치지 않아도 되고, 자동 발행 글도 그대로 분류된다)
 */
export type BlogCategoryId =
  | "income_tax"
  | "side_income"
  | "vat_business"
  | "property"
  | "inheritance"
  | "year_end"
  | "find_advisor";

export interface BlogCategory {
  id: BlogCategoryId;
  label: string;
  /** 목록 상단 필터 설명 */
  description: string;
  /** 뱃지 색상 (배경/글자) */
  badgeClass: string;
}

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    id: "income_tax",
    label: "종합소득세",
    description: "프리랜서·사업소득 신고와 환급",
    badgeClass: "bg-[#e0edff] text-[#1e40af]",
  },
  {
    id: "side_income",
    label: "부업·N잡",
    description: "직장인 부업, 온라인 셀러 세금",
    badgeClass: "bg-[#e2f6d5] text-[#2f5711]",
  },
  {
    id: "vat_business",
    label: "부가세·사업자",
    description: "부가세 신고와 사업자 운영",
    badgeClass: "bg-[#fef0d4] text-[#8a5a09]",
  },
  {
    id: "property",
    label: "부동산·양도",
    description: "양도세·임대소득·보유세",
    badgeClass: "bg-[#ede9fe] text-[#5b21b6]",
  },
  {
    id: "inheritance",
    label: "상속·증여",
    description: "증여 시점과 자산 이전 판단",
    badgeClass: "bg-[#fee6e6] text-[#9b2226]",
  },
  {
    id: "year_end",
    label: "연말정산·연금",
    description: "공제 전략과 연금·IRP·ISA",
    badgeClass: "bg-[#d9f2f0] text-[#0f5c58]",
  },
  {
    id: "find_advisor",
    label: "세무사 찾기",
    description: "지역별 세무사와 비용 기준",
    badgeClass: "bg-[#eceff1] text-[#37474f]",
  },
];

const CATEGORY_BY_ID = new Map(BLOG_CATEGORIES.map((c) => [c.id, c]));

export function getBlogCategory(id: BlogCategoryId): BlogCategory {
  return CATEGORY_BY_ID.get(id) ?? BLOG_CATEGORIES[0];
}

export function isBlogCategoryId(value: string): value is BlogCategoryId {
  return CATEGORY_BY_ID.has(value as BlogCategoryId);
}

/**
 * 분류 규칙. 위에서부터 먼저 맞는 것을 쓴다.
 * 순서가 중요하다 — 예를 들어 "스마트스토어-부업-부가세-신고"는 부가세보다 부업으로 잡아야 하고,
 * "종합부동산세"는 "종합소득세"와 헷갈리지 않도록 부동산 규칙이 먼저 와야 한다.
 */
const RULES: { id: BlogCategoryId; pattern: RegExp }[] = [
  { id: "find_advisor", pattern: /세무사-추천|세무사-비용|세무사-찾기/ },
  {
    id: "side_income",
    pattern: /부업|셀러|애드센스|쿠팡파트너스|스마트스토어|역직구|구매대행|n잡/i,
  },
  { id: "year_end", pattern: /연말정산|연금저축|irp|isa/i },
  {
    id: "property",
    pattern: /양도세|양도소득|임대소득|종합부동산세|종부세|장기보유특별공제|취득세/,
  },
  { id: "inheritance", pattern: /상속|증여/ },
  { id: "vat_business", pattern: /부가세|사업자|법인세|기장/ },
  { id: "income_tax", pattern: /종합소득세|프리랜서|원천징수|3점3/ },
];

/** 글의 카테고리를 결정한다. category가 지정돼 있으면 그대로 쓰고, 없으면 자동 분류한다. */
export function resolveBlogCategory(article: BlogArticle): BlogCategory {
  if (article.category && isBlogCategoryId(article.category)) {
    return getBlogCategory(article.category);
  }

  // slug가 글의 핵심 주제를 가장 정확히 담고 있으므로 먼저 판정한다.
  // (키워드에는 부차적인 단어가 섞여 있어 slug보다 신뢰도가 낮다)
  for (const rule of RULES) {
    if (rule.pattern.test(article.slug)) {
      return getBlogCategory(rule.id);
    }
  }

  // slug로 못 정하면 키워드로 보조 판정한다.
  const keywords = article.keywords.join(" ");
  for (const rule of RULES) {
    if (rule.pattern.test(keywords)) {
      return getBlogCategory(rule.id);
    }
  }

  // 어디에도 안 걸리면 가장 범용적인 종합소득세로 둔다.
  return getBlogCategory("income_tax");
}

/** 카테고리별 글 개수 (목록 필터 표시용) */
export function countByCategory(
  articles: BlogArticle[],
): Map<BlogCategoryId, number> {
  const counts = new Map<BlogCategoryId, number>();
  for (const article of articles) {
    const id = resolveBlogCategory(article).id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}
