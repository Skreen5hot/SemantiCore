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
  strictEqual(html.includes("Selected TagTeam Graph"), true);
});

test("GitHub Pages app advertises Phase 6 status", () => {
  strictEqual(html.includes("Phase 6 in progress"), true);
  strictEqual(js.includes('const phaseLabel = "Phase 6"'), true);
});

test("GitHub Pages app exposes visible Phase 4 persistence controls", () => {
  strictEqual(html.includes("Save Session"), true);
  strictEqual(html.includes("Restore Session"), true);
  strictEqual(html.includes("Session JSON-LD"), true);
  strictEqual(html.includes("Ontology set JSON-LD"), true);
  strictEqual(html.includes("Context manifest JSON-LD"), true);
  strictEqual(js.includes("indexedDB.open"), true);
});

test("GitHub Pages app exposes visible Phase 5 runtime controls", () => {
  strictEqual(html.includes("Load Local TagTeam Bundle"), true);
  strictEqual(html.includes("Runtime diagnostics JSON-LD"), true);
  strictEqual(html.includes("Reject mismatch"), true);
  strictEqual(js.includes("window.TagTeam"), true);
  strictEqual(js.includes("OntologyTextTagger"), true);
  strictEqual(js.includes("fromTTL"), true);
  strictEqual(js.includes("sc:TagTeamVersionMismatch"), true);
  strictEqual(js.includes("sc:ContextCollision"), true);
});

test("GitHub Pages app exposes direct TagTeam graph inspection", () => {
  strictEqual(html.includes("TagTeam Output"), true);
  strictEqual(html.includes("TagTeam Graphs"), true);
  strictEqual(js.includes("sc:tagTeamMetadata"), true);
  strictEqual(js.includes("countGraphEntities"), true);
  strictEqual(js.includes("renderSelectedGraph"), true);
});

test("GitHub Pages app exposes visible Phase 6 canonical hash output", () => {
  strictEqual(html.includes("Hashes"), true);
  strictEqual(js.includes("sc:CanonicalHashReport"), true);
  strictEqual(js.includes("sha256"), true);
  strictEqual(js.includes("canonicalContentHash"), true);
  strictEqual(/^\s+records,$/m.test(js), false);
  strictEqual(/^\s+graphs,$/m.test(js), false);
});

test("Browser MVP does not make network calls", () => {
  strictEqual(/\bfetch\s*\(/.test(js), false);
  strictEqual(/XMLHttpRequest/.test(js), false);
});

console.log(`\n  ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
