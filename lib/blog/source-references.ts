import type { BlogArticle } from "./types.ts";

// A structural check, not a factual or professional review of the article.
export function hasSourceReferences(article: Pick<BlogArticle, "sources">): boolean {
  return Boolean(article.sources?.length && article.sources.every((source) => {
    try {
      const url = new URL(source.url);
      const date = new Date(`${source.checkedAt}T00:00:00Z`);
      return url.protocol === "https:" && Boolean(source.title.trim()) &&
        /^\d{4}-\d{2}-\d{2}$/.test(source.checkedAt) &&
        Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === source.checkedAt;
    } catch {
      return false;
    }
  }));
}
