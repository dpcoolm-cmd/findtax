import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { hasSourceReferences } from "../lib/blog/source-references.ts";
import { getBlogCta } from "../lib/blog/cta.ts";
import { mergeBlogExtra } from "../lib/blog/extra-body.ts";
import { getContentReviewFlags } from "../lib/blog/content-audit.ts";

const root = path.resolve(import.meta.dirname, "..");
const catalogPath = path.join(root, "lib/blog/posts.ts");
const source = ts.createSourceFile(catalogPath, fs.readFileSync(catalogPath, "utf8"), ts.ScriptTarget.Latest, true);
const imports = new Map();
let partNames;
for (const statement of source.statements) {
  if (ts.isImportDeclaration(statement) && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings)) {
    for (const binding of statement.importClause.namedBindings.elements) {
      imports.set(binding.name.text, { module: statement.moduleSpecifier.text, name: binding.propertyName?.text ?? binding.name.text });
    }
  }
  if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(source) === "ALL_PARTS" && declaration.initializer && ts.isArrayLiteralExpression(declaration.initializer)) {
        partNames = declaration.initializer.elements.map((element) => element.getText(source));
      }
    }
  }
}
if (!partNames?.length) throw new Error("Cannot read catalog precedence. Update audit for the new catalog structure.");
const seen = new Set();
const articles = [];
for (const partName of partNames) {
  const binding = imports.get(partName);
  if (!binding?.module.startsWith("@/lib/blog/")) throw new Error(`Unexpected part: ${partName}`);
  const file = path.join(root, `${binding.module.slice(2)}.ts`);
  const module = await import(pathToFileURL(file).href);
  for (const article of module[binding.name]) {
    if (seen.has(article.slug)) continue;
    seen.add(article.slug);
    articles.push({ ...mergeBlogExtra(article), sourceFile: path.relative(root, file) });
  }
}
const rows = articles.map((article) => ({
  slug: article.slug,
  sourceFile: article.sourceFile,
  sourceLinked: hasSourceReferences(article),
  sourceCount: article.sources?.length ?? 0,
  modified: article.dateModified,
  primaryDestination: getBlogCta(article).href,
  reviewFlags: getContentReviewFlags(article),
}));
if (process.argv.includes("--markdown")) {
  console.log("# FindTax 콘텐츠 검수 대상 목록\n");
  console.log("자동 구조 점검 목록입니다. 오류 확정·사실 검증 완료·AdSense 승인 판정이 아닙니다. 보충 본문을 포함해 점검하며 개별 검수 기록은 작업 보고서에 남깁니다.\n");
  console.log(`전체 ${rows.length}개 / 출처 연결 공개 글 ${rows.filter((row) => row.sourceLinked).length}개 / 보관 글 ${rows.filter((row) => !row.sourceLinked).length}개\n`);
  console.log("| 기존 URL의 slug | 공개 상태 | 다음 확인 항목 |\n| --- | --- | --- |");
  for (const row of rows) {
    console.log(`| ${row.slug} | ${row.sourceLinked ? "공개" : "보관"} | ${row.reviewFlags.join(", ") || "자동 경고 없음: 개별 사실 검증 필요"} |`);
  }
  console.log("\n우선순위: 공개 글의 제목·설명과 본문 불일치 → 구체적 근거가 없는 세무 주장 → 보관 글의 출처·중복 → 실용적 사례 및 다음 행동. 보관/noindex는 AdSense 심사 제외를 의미하지 않습니다.");
  process.exit(0);
}
console.log(JSON.stringify({
  note: "Structural inventory including extra-body.ts. Not a factual review or AdSense approval verdict. Verify primary evidence and rendered pages too.",
  total: rows.length,
  sourceLinked: rows.filter((row) => row.sourceLinked).length,
  archived: rows.filter((row) => !row.sourceLinked).length,
  articles: rows,
}, null, 2));
