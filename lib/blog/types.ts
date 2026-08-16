export type BlogSection = {
  h2: string;
  paragraphs: string[];
};

export type BlogArticle = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  h1: string;
  intro: string;
  sections: BlogSection[];
  closing: string;
  datePublished: string;
  dateModified: string;
  sources?: { title: string; url: string; checkedAt: string }[];
};
