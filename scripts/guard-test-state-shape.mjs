import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const testsRoot = path.join(root, "src");
const forbiddenPatterns = [
  { label: "state.score", regex: /\bstate\.score\b/ },
  { label: "state.lives", regex: /\bstate\.lives\b/ },
  { label: "state.elapsedSec", regex: /\bstate\.elapsedSec\b/ },
  { label: "state.campaign", regex: /\bstate\.campaign\b/ },
  { label: "state.stageStats", regex: /\bstate\.stageStats\b/ },
  { label: "state.options", regex: /\bstate\.options\b/ },
  { label: "state.bricks", regex: /\bstate\.bricks\b/ },
  { label: "state.items", regex: /\bstate\.items\b/ },
  { label: "state.vfx", regex: /\bstate\.vfx\b/ },
  { label: "state.shop", regex: /\bstate\.shop\b/ },
  { label: "state.story", regex: /\bstate\.story\b/ },
  { label: "combat.bossAttackState", regex: /\bstate\.combat\.bossAttackState\b/ },
  { label: "combat.encounterState", regex: /\bstate\.combat\.encounterState\b/ },
  { label: "combat.stageThreatLevel", regex: /\bstate\.combat\.stageThreatLevel\b/ },
  {
    label: "legacy option campaignCourse",
    regex: /\bstate\.(?:run\.)?options\.campaignCourse\b/,
  },
  {
    label: "legacy option debugModeEnabled",
    regex: /\bstate\.(?:run\.)?options\.debugModeEnabled\b/,
  },
  {
    label: "legacy option debugRecordResults",
    regex: /\bstate\.(?:run\.)?options\.debugRecordResults\b/,
  },
];

const failures = [];
for (const file of await collectTestFiles(testsRoot)) {
  const content = await readFile(file, "utf8");
  for (const pattern of forbiddenPatterns) {
    const match = content.match(pattern.regex);
    if (!match || match.index === undefined) {
      continue;
    }
    failures.push({
      file: path.relative(root, file),
      label: pattern.label,
      line: 1 + content.slice(0, match.index).split("\n").length - 1,
    });
  }
}

if (failures.length > 0) {
  console.error("Forbidden legacy runtime-test references found:");
  for (const failure of failures) {
    console.error(`- ${failure.file}:${failure.line} ${failure.label}`);
  }
  process.exit(1);
}

async function collectTestFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectTestFiles(fullPath)));
      continue;
    }
    if (entry.name.endsWith(".test.ts") || entry.name.endsWith(".test.tsx")) {
      files.push(fullPath);
    }
  }
  return files;
}
