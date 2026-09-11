import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { BLOG_ARTICLES_PART4 } from "../lib/blog/all-posts-part4.ts";
import { mergeBlogExtra } from "../lib/blog/extra-body.ts";

const reviewedSlugs = [
  "부가세-신고-세무사-직접-판단",
  "프리랜서-3점3-종합소득세-환급-추가납부",
];

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

test("public blog surfaces only publish source-reviewed articles", () => {
  const posts = readFileSync(new URL("../lib/blog/posts.ts", import.meta.url), "utf8");
  const page = readFileSync(new URL("../app/blog/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(posts, /BLOG_ARTICLES: BlogArticle\[\] = ALL_BLOG_ARTICLES\.filter\(isEditoriallyVerifiedArticle\)/);
  assert.match(posts, /const bySlug = new Map\(ALL_BLOG_ARTICLES/);
  assert.match(posts, /article\.sources\?\.length/);
  assert.match(posts, /new URL\(source\.url\)\.protocol === "https:"/);
  assert.match(page, /isEditoriallyVerifiedArticle/);
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
