import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const key = (await fs.readFile(path.join(root, "public/92092072ef85d3c178bf30e6d363a709.txt"), "utf8")).trim();
const urls = [...new Set(process.argv.slice(2))];

if (urls.length === 0) {
  console.error("Pass one or more FindTax URLs that were added, updated, or deleted.");
  process.exit(2);
}

for (const value of urls) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !["findtax.kr", "www.findtax.kr"].includes(url.hostname)) {
    throw new Error(`Only canonical FindTax HTTPS URLs can be submitted: ${value}`);
  }
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: "findtax.kr",
    key,
    keyLocation: `https://findtax.kr/${key}.txt`,
    urlList: urls,
  }),
});

if (!response.ok) {
  throw new Error(`IndexNow rejected the submission (HTTP ${response.status}).`);
}

console.log(`IndexNow accepted ${urls.length} URL(s) for processing.`);
