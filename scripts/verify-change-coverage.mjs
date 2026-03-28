import { spawnSync } from "node:child_process";

const DOC_FILES = new Set(["README.md", "docs/architecture.md"]);
const DEFAULT_DIFF_BASE = process.env.COVERAGE_DIFF_BASE ?? "origin/main";

const isTestFile = (path) => /\.test\.(ts|tsx)$/.test(path);

const isGameplaySourceFile = (path) =>
  (path.startsWith("src/game-v2/") ||
    path.startsWith("src/app/") ||
    path.startsWith("src/phaser/") ||
    path.startsWith("src/audio/")) &&
  /\.(ts|tsx)$/.test(path) &&
  !isTestFile(path);

const isSessionSourceFile = (path) =>
  path.startsWith("src/game-v2/session/") && /\.(ts|tsx)$/.test(path) && !isTestFile(path);

const isContentSourceFile = (path) =>
  path.startsWith("src/game-v2/content/") && /\.(ts|tsx)$/.test(path) && !isTestFile(path);

const isConfigSourceFile = (path) =>
  path.startsWith("src/game-v2/public/") || path.startsWith("src/game-v2/engine/");

function run(command, label) {
  const result = spawnSync(command[0], command.slice(1), {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (result.status !== 0) {
    return {
      success: false,
      output: output || `${label} failed without output`,
    };
  }
  return {
    success: true,
    output,
  };
}

function resolveChangedFiles() {
  const diffRanges = [`${DEFAULT_DIFF_BASE}...HEAD`, "HEAD~1...HEAD", "HEAD"];
  for (const range of diffRanges) {
    const args =
      range === "HEAD"
        ? ["git", "diff", "--name-only", "--diff-filter=ACMR", "HEAD"]
        : ["git", "diff", "--name-only", "--diff-filter=ACMR", range];
    const result = run(args, `git diff ${range}`);
    if (!result.success) {
      continue;
    }
    const files = result.output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    return [...new Set(files)];
  }
  return [];
}

function main() {
  const changedFiles = resolveChangedFiles();
  if (changedFiles.length === 0) {
    console.log("[verify-change-coverage] No changed files detected. Skipping.");
    return 0;
  }

  const violations = [];
  const hasGameplaySourceChange = changedFiles.some(isGameplaySourceFile);
  const hasTestChange = changedFiles.some(isTestFile);
  const hasConfigChange = changedFiles.some(isConfigSourceFile);
  const hasDocChange = changedFiles.some((file) => DOC_FILES.has(file));
  const hasSessionChange = changedFiles.some(isSessionSourceFile);
  const hasContentChange = changedFiles.some(isContentSourceFile);

  if (hasGameplaySourceChange && !hasTestChange) {
    violations.push("game-v2/app/phaser/audio source changed, but no *.test.ts(x) file changed.");
  }

  if (hasConfigChange && !hasDocChange) {
    violations.push(
      "src/game-v2/public/* or src/game-v2/engine/* changed, but docs were not updated.",
    );
  }

  if ((hasSessionChange || hasContentChange) && !hasDocChange) {
    violations.push(
      "src/game-v2/session/* or src/game-v2/content/* changed, but docs/architecture.md was not updated.",
    );
  }

  if (violations.length > 0) {
    console.error("[verify-change-coverage] Failed:");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    console.error("[verify-change-coverage] Changed files:");
    for (const file of changedFiles) {
      console.error(`  - ${file}`);
    }
    return 1;
  }

  console.log("[verify-change-coverage] Passed.");
  return 0;
}

process.exit(main());
