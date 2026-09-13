import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { hasSourceReferences } from "../lib/blog/source-references.ts";
import { getBlogCta } from "../lib/blog/cta.ts";

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
    articles.push({ ...article, sourceFile: path.relative(root, file) });
  }
}
const rows = articles.map((article) => ({
  slug: article.slug,
  sourceFile: article.sourceFile,
  sourceLinked: hasSourceReferences(article),
  sourceCount: article.sources?.length ?? 0,
  modified: article.dateModified,
  primaryDestination: getBlogCta(article).href,
  reviewFlags: [
    ...(!hasSourceReferences(article) ? ["SOURCE_REFERENCES_NEEDED"] : []),
    ...(/세제개편|2027|2028/.test(`${article.slug} ${article.h1}`) ? ["CHECK_PROPOSAL_VS_ENACTED"] : []),
  ],
}));
console.log(JSON.stringify({
  note: "Structural inventory only. Not a factual review or AdSense approval verdict. Inspect extra-body.ts and rendered pages too.",
  total: rows.length,
  sourceLinked: rows.filter((row) => row.sourceLinked).length,
  archived: rows.filter((row) => !row.sourceLinked).length,
  articles: rows,
}, null, 2));
