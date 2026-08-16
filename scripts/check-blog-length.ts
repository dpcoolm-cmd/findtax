import { BLOG_ARTICLES, countBlogBodyChars } from "../lib/blog/posts";

const min = 1500;
let ok = true;
for (const a of BLOG_ARTICLES) {
  const n = countBlogBodyChars(a);
  if (n < min) {
    console.error(`SHORT: ${a.slug} => ${n} chars (need ${min})`);
    ok = false;
  } else {
    console.log(`${a.slug}: ${n}`);
  }
}
if (!ok) process.exit(1);
