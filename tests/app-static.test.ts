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
  strictEqual(html.includes("Selected TagTeam Record Graph"), true);
});

test("GitHub Pages app advertises Phase 10 status", () => {
  strictEqual(html.includes("Phase 10 in progress"), true);
  strictEqual(js.includes('const phaseLabel = "Phase 10"'), true);
  strictEqual(html.includes("PHASE10_EXIT_REVIEW.md"), true);
  strictEqual(html.includes("styles.css?v=phase10"), true);
  strictEqual(html.includes("main.js?v=phase10"), true);
});

test("GitHub Pages app exposes visible Phase 4 persistence controls", () => {
  strictEqual(html.includes("Save Session"), true);
  strictEqual(html.includes("Restore Session"), true);
  strictEqual(html.includes("Session JSON-LD"), true);
  strictEqual(html.includes("Import TTL"), true);
  strictEqual(html.includes("ontologyFileInput"), true);
  strictEqual(html.includes("Ontology set JSON-LD"), true);
  strictEqual(html.includes("Context manifest JSON-LD"), true);
  strictEqual(js.includes("indexedDB.open"), true);
  strictEqual(js.includes("importOntologyFile"), true);
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
  strictEqual(html.includes("Flat Graphs"), true);
  strictEqual(html.includes("Download Flat JSON-LD"), true);
  strictEqual(html.includes("Export Guide"), true);
  strictEqual(html.includes("Flat triple-store import"), true);
  strictEqual(html.includes("full graph bundle"), true);
  strictEqual(html.includes("selectedGraphSelect"), true);
  strictEqual(js.includes("sc:tagTeamMetadata"), true);
  strictEqual(js.includes("countGraphEntities"), true);
  strictEqual(js.includes("renderSelectedGraph"), true);
  strictEqual(js.includes("preferredSelectedGraphIndex"), true);
  strictEqual(js.includes("ontologyMatchCountForGraph"), true);
});

test("GitHub Pages app emits a de-duplicated TagTeam graph context", () => {
  strictEqual(js.includes('tagteam: "http://tagteam.fandaws.com/ontology/"'), true);
  strictEqual(js.includes('inst: "http://tagteam.fandaws.com/instance/"'), true);
  strictEqual(js.includes('rdfs: "http://www.w3.org/2000/01/rdf-schema#"'), true);
  strictEqual(js.includes('owl: "http://www.w3.org/2002/07/owl#"'), true);
  strictEqual(js.includes('bfo: "http://purl.obolibrary.org/obo/"'), true);
  strictEqual(js.includes('cco: "https://www.commoncoreontologies.org/"'), true);
  strictEqual(js.includes('is_about: { "@id": "tagteam:is_about", "@type": "@id" }'), false);
  strictEqual(js.includes('Entity: "tagteam:Entity"'), false);
  strictEqual(js.includes('Process: "tagteam:Process"'), false);
  strictEqual(js.includes('ontologyMatch: { "@id": "tagteam:ontologyMatch", "@container": "@set" }'), false);
  strictEqual(js.includes("runtimeGraphContext"), true);
  strictEqual(js.includes("buildGraphBundle"), true);
  strictEqual(js.includes("buildFlatGraphBundle"), true);
  strictEqual(js.includes("flattenGraphNodes"), true);
  strictEqual(js.includes("stripGraphContext"), true);
  strictEqual(js.includes('const { "@context": _context, ...namedGraph } = graph;'), true);
  strictEqual(js.includes('"sc:graphs": runGraphs()'), false);
  strictEqual(js.includes("assertValidDownload(kind, content, type)"), true);
  strictEqual(js.includes("JSON.parse(content)"), true);
  strictEqual(js.includes('normalizedGraph["sc:contentHash"] = canonicalContentHash(normalizedGraph);'), true);
  strictEqual(js.includes("normalizeJsonLdTypes"), true);
  strictEqual(js.includes('const parseTraceInclusion = "summary";'), true);
  strictEqual(js.includes('"sc:parseTraceInclusion": parseTraceInclusion'), true);
  strictEqual(js.includes("confirmLargeFile"), true);
  strictEqual(js.includes("previewText"), true);
  strictEqual(js.includes("formatBytes"), true);
});

test("GitHub Pages app reports ontology bridge status per graph", () => {
  strictEqual(js.includes('import { createTagTeamRuntimeAdapter } from "./dist/adapters/integration/tagteam-runtime.js";'), true);
  strictEqual(js.includes("createTagTeamRuntimeAdapter"), true);
  strictEqual(js.includes("function createTagTeamRuntimeAdapter"), false);
  strictEqual(js.includes("options.ontology ="), false);
  strictEqual(js.includes("sc:OntologyBridgeReport"), true);
  strictEqual(js.includes("sc:ontologyOptionPassed"), true);
  strictEqual(js.includes("sc:ontologyOptionStatus"), true);
  strictEqual(js.includes("sc:ontologyMatchCount"), true);
  strictEqual(js.includes("sc:ontologyCompileMode"), true);
  strictEqual(js.includes("sc:compiledOntologyCount"), true);
  strictEqual(js.includes("sc:TagTeamDefaultPriorityChain"), true);
  strictEqual(js.includes('join("\\n\\n")'), false);
});

test("GitHub Pages app makes the TagTeam text source explicit", () => {
  strictEqual(html.includes("TagTeam text source"), true);
  strictEqual(html.includes("sc:source / schema:text"), true);
  strictEqual(js.includes("sc:tagTeamSourcePropertyPath"), true);
  strictEqual(js.includes('sourceColumn: "Text", targetProperty: "schema:text"'), true);
  strictEqual(js.includes("selectedTagTeamSourceProperty"), true);
  strictEqual(js.includes("firstTextProperty"), false);
});

test("GitHub Pages app exposes visible Phase 6 canonical hash output", () => {
  strictEqual(html.includes("Hashes"), true);
  strictEqual(js.includes("sc:CanonicalHashReport"), true);
  strictEqual(js.includes("sha256"), true);
  strictEqual(js.includes("canonicalContentHash"), true);
  strictEqual(/^\s+records,$/m.test(js), false);
  strictEqual(/^\s+graphs,$/m.test(js), false);
});

test("GitHub Pages app exposes Phase 7 accessibility and large-file guardrails", () => {
  strictEqual(html.includes('role="status" aria-live="polite"'), true);
  strictEqual(html.includes("Download format descriptions"), true);
  strictEqual(html.includes("Roadmap"), true);
  strictEqual(html.includes("GitHub"), true);
  strictEqual(js.includes("largeFileWarningBytes"), true);
  strictEqual(js.includes("largeRunWarningRecords"), true);
  strictEqual(js.includes("outputPreviewSoftLimit"), true);
  strictEqual(js.includes("window.confirm"), true);
  strictEqual(js.includes("Run cancelled before enrichment"), true);
});

test("GitHub Pages app exposes Phase 8 optional integration policy", () => {
  strictEqual(html.includes("Optional Integrations"), true);
  strictEqual(html.includes("No remote integration is active"), true);
  strictEqual(html.includes("Offline enrichment and export remain fully valid"), true);
  strictEqual(html.includes("Fandaws export validator"), true);
  strictEqual(html.includes("Remote ontology resolver"), true);
  strictEqual(html.includes("HIRI artifact publishing"), true);
  strictEqual(html.includes("Integration policy JSON-LD"), true);
  strictEqual(html.includes("sc:IntegrationPolicy"), true);
  strictEqual(html.includes("sc:NoDataEgress"), true);
  strictEqual(html.includes("sc:requiresExplicitOptIn"), true);
});

test("GitHub Pages app exposes Phase 9 integration preflight checkpoints", () => {
  strictEqual(html.includes("Preflight Checklist"), true);
  strictEqual(html.includes("Show the destination before transmission"), true);
  strictEqual(html.includes("Show the payload scope before transmission"), true);
  strictEqual(html.includes("Require an explicit approval action"), true);
  strictEqual(html.includes("Record the artifact hash and integration decision"), true);
  strictEqual(html.includes("Integration preflight JSON-LD"), true);
  strictEqual(html.includes("sc:IntegrationPreflight"), true);
  strictEqual(html.includes("sc:activeIntegrationCount"), true);
  strictEqual(html.includes("sc:networkRequestCount"), true);
  strictEqual(html.includes("sc:blockedUntilUserApproval"), true);
});

test("GitHub Pages app exposes Phase 10 integration decision receipts", () => {
  strictEqual(html.includes("Decision Receipt Requirements"), true);
  strictEqual(html.includes("Bind receipt to the artifact hash"), true);
  strictEqual(html.includes("Capture destination and payload scope"), true);
  strictEqual(html.includes("Record approve, deny, or cancel decision"), true);
  strictEqual(html.includes("Keep the receipt local unless the user exports it"), true);
  strictEqual(html.includes("Integration decision receipt JSON-LD"), true);
  strictEqual(html.includes("sc:IntegrationDecisionReceipt"), true);
  strictEqual(html.includes("sc:NotSubmitted"), true);
  strictEqual(html.includes("sc:artifactHashRequired"), true);
  strictEqual(html.includes("sc:localReceiptOnly"), true);
  strictEqual(html.includes("sc:remoteTransmission"), true);
});

test("Browser MVP does not make network calls", () => {
  strictEqual(/\bfetch\s*\(/.test(js), false);
  strictEqual(/XMLHttpRequest/.test(js), false);
});

console.log(`\n  ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
