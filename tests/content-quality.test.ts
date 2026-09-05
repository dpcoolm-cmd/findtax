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
