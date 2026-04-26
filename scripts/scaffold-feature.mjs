import { access, mkdir, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";

const inputName = process.argv[2];

function fail(message) {
  console.error(`[scaffold-feature] ${message}`);
  process.exit(1);
}

if (!inputName) {
  fail("Usage: node scripts/scaffold-feature.mjs <feature-name>");
}

const slug = inputName
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

if (!slug) {
  fail("Feature name becomes empty after normalization.");
}

const toPascalCase = (value) =>
  value
    .split("-")
    .filter(Boolean)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join("");

const pascalName = toPascalCase(slug);
const functionName = `create${pascalName}`;
const directory = "src/game-v2/features";
const sourcePath = `${directory}/${slug}.ts`;
const testPath = `${directory}/${slug}.test.ts`;

async function exists(path) {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

if (await exists(sourcePath)) {
  fail(`Source file already exists: ${sourcePath}`);
}
if (await exists(testPath)) {
  fail(`Test file already exists: ${testPath}`);
}

await mkdir(directory, { recursive: true });

const sourceCode = `export interface ${pascalName}FeatureInput {
  // TODO: define required input fields.
}

export function ${functionName}(input: ${pascalName}FeatureInput): void {
  // TODO(implementation): implement ${slug} feature behavior.
  // TODO(doc): update README.md if feature/user-visible behavior changes.
  // TODO(doc): update docs/architecture.md if responsibilities or data flow change.
  void input;
}
`;

const testCode = `import { describe, expect, test } from "vitest";
import { ${functionName} } from "./${slug}";

describe("${slug}", () => {
  test("scaffold sanity", () => {
    expect(typeof ${functionName}).toBe("function");
  });
});
`;

await writeFile(sourcePath, sourceCode, "utf8");
await writeFile(testPath, testCode, "utf8");

console.log("[scaffold-feature] Generated:");
console.log(`- ${sourcePath}`);
console.log(`- ${testPath}`);
console.log("[scaffold-feature] Next steps:");
console.log(`- Implement ${functionName}`);
console.log("- Add behavior-focused tests");
console.log("- Resolve TODO(doc) comments");
