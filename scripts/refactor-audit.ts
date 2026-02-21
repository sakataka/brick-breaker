import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const WARNING_LINE_LIMIT = 350;
const ERROR_LINE_LIMIT = 500;
const ROOT = process.cwd();

type Severity = "warning" | "error";

interface Finding {
  severity: Severity;
  code: string;
  message: string;
}

interface CliOptions {
  strict: boolean;
  reportFile?: string;
}

const DOC_DRIFT_RULES: Array<{ code: string; pattern: RegExp; note: string }> = [
  { code: "doc-focus-key", pattern: /`F`:\s*Focus/iu, note: "README still documents Focus key input." },
  { code: "doc-focus-spec", pattern: /Focus:\s*`250点`/iu, note: "README still documents Focus system." },
  { code: "doc-dpr-limit", pattern: /DPR上限2/iu, note: "README still documents outdated DPR upper bound." },
  {
    code: "doc-hud-a11y-badge",
    pattern: /HUD に適用状態バッジ/iu,
    note: "README still documents removed HUD accessibility badge.",
  },
];

async function main(): Promise<number> {
  const options = parseCli(process.argv.slice(2));
  const findings: Finding[] = [];

  findings.push(...(await auditDocDrift()));
  findings.push(...(await auditHookDuplication()));
  findings.push(...(await auditScriptDuplication()));
  findings.push(...(await auditLargeFiles()));

  const report = buildReport(findings, options.strict);
  if (options.reportFile) {
    await writeReport(options.reportFile, report);
  }

  if (findings.length <= 0) {
    console.log("[refactor-audit] OK");
    if (options.reportFile) {
      console.log(`[refactor-audit] report: ${options.reportFile}`);
    }
    return 0;
  }

  if (options.strict && findings.some((finding) => finding.severity === "error")) {
    console.error(report);
    return 1;
  }

  console.log(report);
  return 0;
}

function parseCli(argv: string[]): CliOptions {
  let strict = true;
  let reportFile: string | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--strict") {
      strict = true;
      continue;
    }
    if (arg === "--no-strict") {
      strict = false;
      continue;
    }
    if (arg.startsWith("--report-file=")) {
      reportFile = arg.slice("--report-file=".length);
      continue;
    }
    if (arg === "--report-file") {
      reportFile = argv[index + 1];
      index += 1;
    }
  }
  return { strict, reportFile };
}

async function auditDocDrift(): Promise<Finding[]> {
  const findings: Finding[] = [];
  const readmePath = `${ROOT}/README.md`;
  const readmeText = await Bun.file(readmePath).text();
  for (const rule of DOC_DRIFT_RULES) {
    if (rule.pattern.test(readmeText)) {
      findings.push({
        severity: "error",
        code: rule.code,
        message: rule.note,
      });
    }
  }
  return findings;
}

async function auditHookDuplication(): Promise<Finding[]> {
  const hasDotLefthook = await Bun.file(`${ROOT}/.lefthook.yml`).exists();
  const hasLegacyLefthook = await Bun.file(`${ROOT}/lefthook.yml`).exists();
  if (hasDotLefthook && hasLegacyLefthook) {
    return [
      {
        severity: "error",
        code: "duplicate-hook-config",
        message: "Both .lefthook.yml and lefthook.yml exist. Keep only .lefthook.yml.",
      },
    ];
  }
  return [];
}

async function auditScriptDuplication(): Promise<Finding[]> {
  const findings: Finding[] = [];
  const packageJsonPath = `${ROOT}/package.json`;
  const packageJson = await Bun.file(packageJsonPath).json();
  const scripts = (packageJson as { scripts?: Record<string, string> }).scripts ?? {};
  const byCommand = new Map<string, string[]>();
  for (const [name, command] of Object.entries(scripts)) {
    const normalized = command.replace(/\s+/g, " ").trim();
    const list = byCommand.get(normalized) ?? [];
    list.push(name);
    byCommand.set(normalized, list);
  }
  for (const [command, names] of byCommand.entries()) {
    if (names.length < 2) {
      continue;
    }
    findings.push({
      severity: "error",
      code: "duplicate-script-command",
      message: `Scripts share the same command (${names.join(", ")}): ${command}`,
    });
  }
  return findings;
}

async function auditLargeFiles(): Promise<Finding[]> {
  const findings: Finding[] = [];
  const files = await resolveAuditFiles();
  for (const path of files) {
    const text = await Bun.file(path).text();
    const lines = text.length <= 0 ? 0 : text.split(/\r?\n/).length;
    if (lines > ERROR_LINE_LIMIT) {
      findings.push({
        severity: "error",
        code: "file-too-large",
        message: `${path} has ${lines} lines (limit: ${ERROR_LINE_LIMIT}).`,
      });
      continue;
    }
    if (lines > WARNING_LINE_LIMIT) {
      findings.push({
        severity: "warning",
        code: "file-large-warning",
        message: `${path} has ${lines} lines (warning: ${WARNING_LINE_LIMIT}).`,
      });
    }
  }
  return findings;
}

async function resolveAuditFiles(): Promise<string[]> {
  const result = Bun.spawnSync({
    cmd: ["rg", "--files", "src", "scripts", "e2e"],
    cwd: ROOT,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (result.exitCode !== 0) {
    throw new Error(`rg --files failed: ${new TextDecoder().decode(result.stderr).trim()}`);
  }
  return new TextDecoder()
    .decode(result.stdout)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /\.(ts|tsx|js|jsx|cjs|mjs)$/.test(line));
}

function buildReport(findings: Finding[], strict: boolean): string {
  const errors = findings.filter((finding) => finding.severity === "error");
  const warnings = findings.filter((finding) => finding.severity === "warning");
  const lines = [
    `[refactor-audit] strict=${strict ? "on" : "off"}`,
    `[refactor-audit] errors=${errors.length} warnings=${warnings.length}`,
  ];
  for (const finding of findings) {
    lines.push(`- [${finding.severity}] ${finding.code}: ${finding.message}`);
  }
  return lines.join("\n");
}

async function writeReport(path: string, report: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await Bun.write(path, `${report}\n`);
}

process.exit(await main());
