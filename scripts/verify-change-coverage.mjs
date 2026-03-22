import { spawnSync } from "node:child_process";

const DOC_FILES = new Set(["README.md", "docs/architecture.md"]);
const DEFAULT_DIFF_BASE = process.env.COVERAGE_DIFF_BASE ?? "origin/main";

const isTestFile = (path) => /\.test\.(ts|tsx)$/.test(path);

const isGameplaySourceFile = (path) =>
  (path.startsWith("src/game/") || path.startsWith("src/app/")) &&
  /\.(ts|tsx)$/.test(path) &&
  !isTestFile(path);

const isSessionSourceFile = (path) =>
  path.startsWith("src/game/session/") && /\.(ts|tsx)$/.test(path) && !isTestFile(path);

const isContentSourceFile = (path) =>
  path.startsWith("src/game/content/") && /\.(ts|tsx)$/.test(path) && !isTestFile(path);

const isStageTemplateRuntimeFile = (path) => path === "src/game/config/stageTemplateRuntime.ts";

const isStageProgressionConfigFile = (path) => path === "src/game/config/stageProgressionConfig.ts";

const isConfigSourceFile = (path) =>
  path.startsWith("src/game/config/") || path === "src/game/itemRegistry.ts";

const isCoreSourceFile = (path) => path.startsWith("src/core/");

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
  const hasCoreChange = changedFiles.some(isCoreSourceFile);
  const hasSessionChange = changedFiles.some(isSessionSourceFile);
  const hasContentChange = changedFiles.some(isContentSourceFile);
  const hasStageTemplateRuntimeChange = changedFiles.some(isStageTemplateRuntimeFile);
  const hasStageProgressionConfigChange = changedFiles.some(isStageProgressionConfigFile);

  if (hasGameplaySourceChange && !hasTestChange) {
    violations.push(
      "src/game or src/app source changed, but no *.test.ts(x) file changed. Add or update tests.",
    );
  }

  if (hasConfigChange && !hasDocChange) {
    violations.push(
      "src/game/config/* or src/game/itemRegistry.ts changed, but README.md/docs/architecture.md were not updated.",
    );
  }

  if (
    (hasSessionChange ||
      hasContentChange ||
      hasStageTemplateRuntimeChange ||
      hasStageProgressionConfigChange) &&
    !hasDocChange
  ) {
    violations.push(
      "src/game/session/*, src/game/content/*, or stage template/progression config changed, but docs/architecture.md was not updated.",
    );
  }

  if (hasCoreChange) {
    const archCheck = run(["vp", "run", "check:arch"], "vp run check:arch");
    if (!archCheck.success) {
      violations.push(
        `src/core changed and architecture boundary check failed.\n${archCheck.output}`,
      );
    }
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
