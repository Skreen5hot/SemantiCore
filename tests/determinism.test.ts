import { deepStrictEqual, strictEqual } from "node:assert";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "../src/kernel/transform.js";
import { canonicalContentHash, canonicalizeJson, sha256Hex, stableStringify } from "../src/kernel/canonicalize.js";

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
  deepStrictEqual(
    canonicalizeJson({ b: 2, a: { d: 4, c: 3 } }),
    { a: { c: 3, d: 4 }, b: 2 },
  );
  strictEqual(stableStringify({ b: 2, a: 1 }), "{\"a\":1,\"b\":2}");
  console.log("  \u2713 PASS: canonical JSON envelope sorts object keys recursively");
  passed++;
} catch (error) {
  console.error("  \u2717 FAIL: canonical JSON envelope did not sort keys recursively");
  console.error(" ", error instanceof Error ? error.message : String(error));
  failed++;
}

try {
  const helloBytes = new TextEncoder().encode("abc");
  strictEqual(sha256Hex(helloBytes), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  strictEqual(canonicalContentHash({ b: 2, a: 1 }), "sha256:43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777");
  console.log("  \u2713 PASS: canonical content hashes use SHA-256 over canonical bytes");
  passed++;
} catch (error) {
  console.error("  \u2717 FAIL: canonical content hashes are not stable SHA-256 values");
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
