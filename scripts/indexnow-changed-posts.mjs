import { execFileSync } from "node:child_process";
import ts from "typescript";

const [base, head] = process.argv.slice(2);
if (!base || !head) throw new Error("Usage: node scripts/indexnow-changed-posts.mjs <base-sha> <head-sha>");

function gitFile(revision, file) {
  try {
    return execFileSync("git", ["show", `${revision}:${file}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
}

function sourceFile(file, text) {
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function prop(object, name) {
  return object.properties.find((item) => ts.isPropertyAssignment(item) &&
    ((ts.isIdentifier(item.name) && item.name.text === name) ||
     (ts.isStringLiteral(item.name) && item.name.text === name)) ||
    (ts.isShorthandPropertyAssignment(item) && item.name.text === name));
}

function propValue(item) {
  if (ts.isPropertyAssignment(item)) return item.initializer;
  if (ts.isShorthandPropertyAssignment(item)) return item.name;
  return undefined;
}

function literal(node, constants) {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isIdentifier(node)) return constants.get(node.text);
  return undefined;
}

function collectObjects(node, into = []) {
  if (ts.isObjectLiteralExpression(node)) into.push(node);
  ts.forEachChild(node, (child) => collectObjects(child, into));
  return into;
}

function articleMap(revision) {
  const catalogText = gitFile(revision, "lib/blog/posts.ts");
  if (!catalogText) return new Map();
  const catalog = sourceFile("posts.ts", catalogText);
  const imports = new Map();
  let precedence;
  for (const statement of catalog.statements) {
    if (ts.isImportDeclaration(statement) && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings)) {
      for (const binding of statement.importClause.namedBindings.elements) {
        imports.set(binding.name.text, { module: statement.moduleSpecifier.text, name: binding.propertyName?.text ?? binding.name.text });
      }
    }
    if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === "ALL_PARTS" && declaration.initializer && ts.isArrayLiteralExpression(declaration.initializer)) {
        precedence = declaration.initializer.elements.map((item) => item.getText(catalog));
      }
    }
  }
  if (!precedence) throw new Error(`Cannot resolve blog precedence from ${revision}`);

  const seen = new Set();
  const result = new Map();
  for (const partName of precedence) {
    const binding = imports.get(partName);
    if (!binding || !binding.module.startsWith("@/lib/blog/")) continue;
    const file = `${binding.module.slice(2)}.ts`;
    const text = gitFile(revision, file);
    if (!text) continue;
    const source = sourceFile(file, text);
    const constants = new Map();
    for (const statement of source.statements) if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          const value = literal(declaration.initializer, constants);
          if (value !== undefined) constants.set(declaration.name.text, value);
        }
      }
    }
    let array;
    for (const statement of source.statements) if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.name.text === binding.name && declaration.initializer && ts.isArrayLiteralExpression(declaration.initializer)) array = declaration.initializer;
      }
    }
    if (!array) continue;
    for (const node of array.elements) {
      if (!ts.isObjectLiteralExpression(node)) continue;
      const slugNode = prop(node, "slug");
      const slug = literal(propValue(slugNode), constants);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      const sourcesNode = prop(node, "sources")?.initializer;
      const sources = sourcesNode && ts.isArrayLiteralExpression(sourcesNode) ? sourcesNode.elements : [];
      const valid = sources.length > 0 && sources.every((sourceNode) => {
        if (!ts.isObjectLiteralExpression(sourceNode)) return false;
        const title = literal(propValue(prop(sourceNode, "title")), constants);
        const urlValue = literal(propValue(prop(sourceNode, "url")), constants);
        const checkedAt = literal(propValue(prop(sourceNode, "checkedAt")), constants);
        if (!title?.trim() || !checkedAt || !/^\d{4}-\d{2}-\d{2}$/.test(checkedAt)) return false;
        const date = new Date(`${checkedAt}T00:00:00Z`);
        if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== checkedAt) return false;
        try { return new URL(urlValue).protocol === "https:"; } catch { return false; }
      });
      result.set(slug, { file, text: node.getText(source), isPublic: valid });
    }
  }
  return result;
}

function extrasMap(revision) {
  const file = "lib/blog/extra-body.ts";
  const text = gitFile(revision, file);
  const map = new Map();
  if (!text) return map;
  const source = sourceFile(file, text);
  for (const statement of source.statements) if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== "BLOG_EXTRA_SECTIONS" || !declaration.initializer || !ts.isObjectLiteralExpression(declaration.initializer)) continue;
      for (const entry of declaration.initializer.properties) {
        if (ts.isPropertyAssignment(entry) && (ts.isStringLiteral(entry.name) || ts.isNoSubstitutionTemplateLiteral(entry.name))) map.set(entry.name.text, entry.initializer.getText(source));
      }
    }
  }
  return map;
}

const current = articleMap(head);
const previous = articleMap(base);
const oldExtras = extrasMap(base);
const newExtras = extrasMap(head);
if (process.env.INDEXNOW_DEBUG === "1") {
  console.log(`IndexNow debug: base articles=${previous.size}, current articles=${current.size}, current public=${[...current.values()].filter((article) => article.isPublic).length}, base SHA=${base}, deployed SHA=${head}`);
}
const changed = [];
for (const [slug, article] of current) {
  if (!article.isPublic) continue;
  const oldArticle = previous.get(slug);
  if (!oldArticle?.isPublic || oldArticle.file !== article.file || oldArticle.text !== article.text || oldExtras.get(slug) !== newExtras.get(slug)) {
    changed.push(`https://findtax.kr/blog/${encodeURIComponent(slug)}`);
  }
}

if (changed.length === 0) {
  console.log("IndexNow: no new or changed public blog URLs in this production deployment.");
} else if (process.env.INDEXNOW_DRY_RUN === "1") {
  console.log(`IndexNow dry run: would notify ${changed.length} changed public blog URL(s).`);
  for (const url of changed) console.log(url);
} else {
  const args = ["scripts/submit-indexnow.mjs", ...changed];
  execFileSync(process.execPath, args, { stdio: "inherit" });
}
