import { deepStrictEqual, strictEqual } from "node:assert";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "../src/kernel/transform.js";
import { stableStringify } from "../src/kernel/canonicalize.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..", "..");
const inputPath = resolve(projectRoot, "examples", "input.jsonld");

let passed = 0;
let failed = 0;

const input = JSON.parse(await readFile(inputPath, "utf-8"));

try {
  const output1 = transform(input);
  const output2 = transform(input);
  deepStrictEqual(output1, output2);
  console.log("  \u2713 PASS: transform produces structurally identical output on repeated invocation");
  passed++;
} catch (error) {
  console.error("  \u2717 FAIL: transform produced structurally different output on repeated invocation");
  console.error(" ", error instanceof Error ? error.message : String(error));
  failed++;
}

try {
  const output1 = transform(input);
  const output2 = transform(input);
  strictEqual(stableStringify(output1), stableStringify(output2));
  console.log("  \u2713 PASS: canonicalized output strings are identical");
  passed++;
} catch (error) {
  console.error("  \u2717 FAIL: canonicalized output strings differ");
  console.error(" ", error instanceof Error ? error.message : String(error));
  failed++;
}

try {
  const freshInput = JSON.parse(await readFile(inputPath, "utf-8"));
  transform(input);
  deepStrictEqual(input, freshInput);
  console.log("  \u2713 PASS: transform does not mutate input");
  passed++;
} catch (error) {
  console.error("  \u2717 FAIL: transform mutated the input object");
  console.error(" ", error instanceof Error ? error.message : String(error));
  failed++;
}

console.log(`\n  ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
