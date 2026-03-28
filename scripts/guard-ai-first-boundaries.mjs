import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const failures = [];

await scanSourceTree(path.join(root, "src"));
await scanTextRoots([path.join(root, "docs"), path.join(root, "e2e"), path.join(root, "scripts")]);
await checkVisualAssetsBoundary(path.join(root, "src/art/visualAssets.ts"));

if (failures.length > 0) {
  console.error("AI-first boundary violations found:");
  for (const failure of failures) {
    console.error(`- ${failure.file}:${failure.line} ${failure.label}`);
  }
  process.exit(1);
}

async function scanSourceTree(dir) {
  for (const file of await collectFiles(dir, [".ts", ".tsx"])) {
    const content = await readFile(file, "utf8");
    const relativePath = path.relative(root, file);

    pushImportFailures(relativePath, content, /\bfrom\s+["'][^"']*src\/(game|core)\//g, [
      "absolute import from removed legacy runtime paths",
    ]);
    pushImportFailures(relativePath, content, /\bfrom\s+["'][^"']*(?:\.\.\/)+(game|core)\//g, [
      "relative import from removed legacy runtime paths",
    ]);

    if (
      relativePath.startsWith("src/app/") ||
      relativePath.startsWith("src/phaser/") ||
      relativePath.startsWith("src/game-v2/presenter/") ||
      relativePath.startsWith("src/game-v2/content/")
    ) {
      pushImportFailures(relativePath, content, /\bfrom\s+["'][^"']*itemRegistryData["']/g, [
        "direct import from itemRegistryData outside low-level runtime",
      ]);
    }

    if (relativePath !== "src/art/visualAssets.ts" && relativePath !== "src/art/themePalettes.ts") {
      pushImportFailures(relativePath, content, /\bTHEME_ART_PALETTES\b/g, [
        "theme palettes referenced outside art facade",
      ]);
    }
  }
}

async function scanTextRoots(dirs) {
  for (const dir of dirs) {
    for (const file of await collectFiles(dir, [".md", ".ts", ".tsx", ".js", ".mjs"])) {
      const content = await readFile(file, "utf8");
      const relativePath = path.relative(root, file);
      if (relativePath === "scripts/guard-ai-first-boundaries.mjs") {
        continue;
      }
      pushImportFailures(relativePath, content, /src\/(game|core)\//g, [
        "stale docs or scripts reference removed legacy runtime paths",
      ]);
    }
  }
}

async function checkVisualAssetsBoundary(file) {
  const content = await readFile(file, "utf8");
  const relativePath = path.relative(root, file);
  pushImportFailures(relativePath, content, /\bconst\s+PALETTES\b/g, [
    "palette definitions must live in themePalettes.ts",
  ]);
}

function pushImportFailures(relativePath, content, regex, [label]) {
  for (const match of content.matchAll(regex)) {
    if (match.index === undefined) {
      continue;
    }
    failures.push({
      file: relativePath,
      label,
      line: 1 + content.slice(0, match.index).split("\n").length - 1,
    });
  }
}

async function collectFiles(dir, suffixes) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath, suffixes)));
      continue;
    }
    if (suffixes.some((suffix) => entry.name.endsWith(suffix))) {
      files.push(fullPath);
    }
  }
  return files;
}
