export type BlogSection = {
  h2: string;
  paragraphs: string[];
};

export type BlogArticle = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  /**
   * 카테고리 ID (lib/blog/categories.ts).
   * 비워두면 slug·키워드로 자동 분류된다. 자동 분류가 어색할 때만 직접 지정한다.
   */
  category?: string;
  h1: string;
  intro: string;
  sections: BlogSection[];
  closing: string;
  datePublished: string;
  dateModified: string;
  sources?: { title: string; url: string; checkedAt: string }[];
};
