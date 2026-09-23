import type { BlogArticle } from "./types.ts";
import { hasSourceReferences } from "./source-references.ts";

export function getContentReviewFlags(article: BlogArticle): string[] {
  const flags: string[] = [];
  const body = [article.intro, ...article.sections.flatMap((section) => [
    section.h2, ...section.paragraphs, ...(section.checklist ?? []),
    ...(section.table ? [section.table.caption, ...section.table.rows.flat()] : []),
  ]), article.closing].join(" ");
  const proposal = /개편안|개정안|정부안|국회 통과 전/.test(body);
  const qualification = /개편안|개정안|정부안|종료안|인하안|추진|검토/;

  if (!hasSourceReferences(article)) flags.push("SOURCE_REFERENCES_NEEDED");
  if (article.sources?.some((source) => {
    try { return new URL(source.url).pathname === "/"; } catch { return false; }
  })) flags.push("SPECIFIC_SOURCE_NEEDED");
  if (proposal || /세제개편|2027|2028/.test(`${article.slug} ${article.h1}`)) {
    flags.push("CHECK_PROPOSAL_VS_ENACTED");
  }
  // Heuristics queue manual review; they never certify or unpublish an article.
  if (proposal && (!qualification.test(article.h1) || !qualification.test(article.metaTitle))) {
    flags.push("CHECK_PROPOSAL_HEADLINE");
  }
  if (proposal && !qualification.test(article.metaDescription)) flags.push("CHECK_PROPOSAL_DESCRIPTION");
  if (!article.sections.some((section) => section.table || section.checklist?.length)) {
    flags.push("CHECK_PRACTICAL_VALUE");
  }
  if (/무조건|100% 환급|반드시 환급|무료 상담|무료로 찾아/.test(body)) flags.push("CHECK_SERVICE_PROMISE");
  return flags;
}
