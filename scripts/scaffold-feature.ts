const inputName = Bun.argv[2];

function fail(message: string): never {
  console.error(`[scaffold-feature] ${message}`);
  process.exit(1);
}

if (!inputName) {
  fail("Usage: bun run scaffold:feature <feature-name>");
}

const slug = inputName
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

if (!slug) {
  fail("Feature name becomes empty after normalization.");
}

const toPascalCase = (value: string): string =>
  value
    .split("-")
    .filter(Boolean)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join("");

const pascalName = toPascalCase(slug);
const functionName = `create${pascalName}`;
const directory = "src/game/features";
const sourcePath = `${directory}/${slug}.ts`;
const testPath = `${directory}/${slug}.test.ts`;

if (await Bun.file(sourcePath).exists()) {
  fail(`Source file already exists: ${sourcePath}`);
}
if (await Bun.file(testPath).exists()) {
  fail(`Test file already exists: ${testPath}`);
}

await Bun.$`mkdir -p ${directory}`;

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

const testCode = `import { describe, expect, test } from "bun:test";
import { ${functionName} } from "./${slug}";

describe("${slug}", () => {
  test("scaffold sanity", () => {
    expect(typeof ${functionName}).toBe("function");
  });
});
`;

await Bun.write(sourcePath, sourceCode);
await Bun.write(testPath, testCode);

console.log("[scaffold-feature] Generated:");
console.log(`- ${sourcePath}`);
console.log(`- ${testPath}`);
console.log("[scaffold-feature] Next steps:");
console.log(`- Implement ${functionName}`);
console.log("- Add behavior-focused tests");
console.log("- Resolve TODO(doc) comments");
