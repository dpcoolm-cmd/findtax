import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { BLOG_ARTICLES_PART4 } from "../lib/blog/all-posts-part4.ts";
import { BLOG_ARTICLES_PART1 } from "../lib/blog/all-posts-part1.ts";
import { mergeBlogExtra } from "../lib/blog/extra-body.ts";
import { hasSourceReferences } from "../lib/blog/source-references.ts";
import { getBlogCta } from "../lib/blog/cta.ts";

const reviewedSlugs = [
  "부가세-신고-세무사-직접-판단",
  "프리랜서-3점3-종합소득세-환급-추가납부",
];

test("revised gift guide keeps its URL and replaces stale appended content", () => {
  const original = BLOG_ARTICLES_PART1.find((article) => article.slug === "증여세-계산-방법-쉽게");
  assert.ok(original);
  const article = mergeBlogExtra(original);
  assert.ok(hasSourceReferences(article));
  assert.equal(article.datePublished, "2026-04-18");
  assert.ok(article.sections.some((section) => section.table?.rows.length === 5));
  assert.ok(article.sections.some((section) => section.checklist?.length));
  assert.doesNotMatch(JSON.stringify(article), /신고 기한을 놓치면 공제를 못 받거나|무료 상담으로 먼저/);
  assert.equal(getBlogCta(article).href, "/calculator/증여세");
});

test("starter guides have usable tables, checklists and specific sources", () => {
  for (const slug of reviewedSlugs) {
    const article = BLOG_ARTICLES_PART4.find((item) => item.slug === slug);
    assert.ok(article, slug);
    assert.ok(article.revisionNote);
    assert.ok(article.dateModified >= article.datePublished);
    assert.ok(article.sections.some((section) => section.table));
    assert.ok(article.sections.some((section) => section.checklist?.length));
    assert.ok(article.sources?.length);
    for (const source of article.sources) {
      const url = new URL(source.url);
      assert.equal(url.protocol, "https:");
      assert.notEqual(url.pathname, "/", "Source must link to a specific document");
      assert.match(source.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    }
    for (const section of article.sections) {
      if (!section.table) continue;
      assert.ok(section.table.caption);
      for (const row of section.table.rows) {
        assert.equal(row.length, section.table.headers.length);
        assert.ok(row.every((cell) => cell.trim()));
      }
    }
    assert.deepEqual(mergeBlogExtra(article).sections, article.sections);
  }
});

test("short articles do not acquire automatic length padding", () => {
  const example = { ...BLOG_ARTICLES_PART4[0], slug: "short-test", sections: [] };
  assert.deepEqual(mergeBlogExtra(example).sections, []);
  const posts = readFileSync(new URL("../lib/blog/posts.ts", import.meta.url), "utf8");
  assert.doesNotMatch(posts, /buildLengthPadSection|countBlogBodyChars\(m\)/);
});

test("global layout preserves analytics and ownership without display ads", () => {
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const footer = readFileSync(new URL("../components/Footer.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(layout, /CoupangRecommendBanner|<SiteAd|adsbygoogle\.js|130px/);
  assert.doesNotMatch(footer, /<SiteAd/);
  assert.match(layout, /google-adsense-account/);
  assert.match(layout, /google-tag-manager/);
  assert.match(footer, /\/editorial-policy/);
  assert.match(footer, /\/about/);
});

test("remote article batches stay registered and sitemap excludes regional details", () => {
  const posts = readFileSync(new URL("../lib/blog/posts.ts", import.meta.url), "utf8");
  for (let part = 6; part <= 11; part++) {
    assert.match(posts, new RegExp(`import \\{ BLOG_ARTICLES_PART${part} \\}`));
    assert.match(posts, new RegExp(`^  BLOG_ARTICLES_PART${part},`, "m"));
  }
  const sitemap = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");
  assert.doesNotMatch(sitemap, /regionSidoPath|regionSigunguPath|listActiveRegionPairs/);
  assert.doesNotMatch(sitemap, /new Date\(\)/);
  assert.match(sitemap, /new Date\(article.dateModified\)/);
});

test("public listings require references without claiming factual verification", () => {
  const posts = readFileSync(new URL("../lib/blog/posts.ts", import.meta.url), "utf8");
  const page = readFileSync(new URL("../app/blog/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(posts, /ALL_BLOG_ARTICLES\.filter\(hasSourceReferences\)/);
  assert.match(posts, /const bySlug = new Map\(ALL_BLOG_ARTICLES/);
  assert.match(page, /hasSourceReferences/);
  assert.doesNotMatch(page, /요건·기한·수치를 대조했습니다|확인한 공식 자료/);
  assert.match(page, /index: false, follow: true/);
});

test("public trust pages do not present themselves as unfinished templates", () => {
  const privacy = readFileSync(new URL("../app/privacy/page.tsx", import.meta.url), "utf8");
  const terms = readFileSync(new URL("../app/terms/page.tsx", import.meta.url), "utf8");
  const about = readFileSync(new URL("../app/about/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(`${privacy}\n${terms}`, /기본 개인정보처리방침|작성된 기본 약관|최종 점검이 필요/);
  assert.match(about, /누가 운영하나요/);
  assert.match(about, /세무법인이나 세무대리인이 아니며/);
});

test("source references reject missing sources, unsafe URLs and impossible dates", () => {
  const source = { title: "Example", url: "https://example.org/document", checkedAt: "2026-09-12" };
  assert.equal(hasSourceReferences({ sources: [source] }), true);
  assert.equal(hasSourceReferences({}), false);
  for (const patch of [{ url: "javascript:alert(1)" }, { checkedAt: "2026-02-30" }, { title: " " }, { checkedAt: "no-date" }]) {
    assert.equal(hasSourceReferences({ sources: [{ ...source, ...patch }] }), false);
  }
});

test("article CTA follows the main subject, with a generic fallback", () => {
  for (const [slug, href] of [
    ["증여세-계산-방법-쉽게", "/calculator/증여세"],
    ["가족간-차용증-증여세-적정이자율", "/calculator/증여세"],
    ["상속세-신고기한-배우자공제", "/calculator/상속증여"],
    ["프리랜서-3점3-종합소득세-환급-추가납부", "/calculator/종합소득세"],
    ["연금저축-irp-etf-구성-초보", "/calculator/retirement-income"],
    ["재산세-9월-정기분-납부", "/calculator"],
  ]) assert.equal(getBlogCta({ slug, h1: slug }).href, href);
});
