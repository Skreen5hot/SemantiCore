import { strictEqual } from "node:assert";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..", "..");

const html = await readFile(resolve(projectRoot, "app", "index.html"), "utf-8");
const js = await readFile(resolve(projectRoot, "app", "main.js"), "utf-8");

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  \u2713 PASS: ${name}`);
    passed++;
  } catch (error) {
    console.error(`  \u2717 FAIL: ${name}`);
    console.error(" ", error instanceof Error ? error.message : String(error));
    failed++;
  }
}

test("GitHub Pages app exposes visible workbench workflow controls", () => {
  strictEqual(html.includes("Load Sample CSV"), true);
  strictEqual(html.includes("Run Enrichment"), true);
  strictEqual(html.includes("Mapping manifest JSON-LD"), true);
  strictEqual(html.includes("CSV Summary"), true);
});

test("GitHub Pages app advertises Phase 4 status", () => {
  strictEqual(html.includes("Phase 4 in progress"), true);
  strictEqual(js.includes('const phaseLabel = "Phase 4"'), true);
});

test("GitHub Pages app exposes visible Phase 4 persistence controls", () => {
  strictEqual(html.includes("Save Session"), true);
  strictEqual(html.includes("Restore Session"), true);
  strictEqual(html.includes("Session JSON-LD"), true);
  strictEqual(html.includes("Ontology set JSON-LD"), true);
  strictEqual(html.includes("Context manifest JSON-LD"), true);
  strictEqual(js.includes("indexedDB.open"), true);
});

test("Browser MVP does not make network calls", () => {
  strictEqual(/\bfetch\s*\(/.test(js), false);
  strictEqual(/XMLHttpRequest/.test(js), false);
});

console.log(`\n  ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
