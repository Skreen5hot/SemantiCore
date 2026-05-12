import { transform } from "../src/kernel/transform.js";

let passed = 0;
let failed = 0;

let fetchCalled = false;
let fetchUrl = "";
const originalFetch = globalThis.fetch;

globalThis.fetch = (async (input: string | URL | Request, _init?: unknown) => {
  fetchCalled = true;
  fetchUrl = String(input);
  throw new Error(`Network call detected: ${fetchUrl}`);
}) as typeof globalThis.fetch;

let xhrInstantiated = false;
const originalXHR = (globalThis as Record<string, unknown>)["XMLHttpRequest"];

(globalThis as Record<string, unknown>)["XMLHttpRequest"] = class StubXHR {
  constructor() {
    xhrInstantiated = true;
    throw new Error("XMLHttpRequest instantiation detected during kernel execution");
  }
};

const input = {
  "@context": {
    sc: "https://semanticore.fandaws.org/ns/",
    schema: "https://schema.org/",
  },
  "@type": "sc:TransformFixture",
  "sc:record": {
    "@id": "urn:semanticore:record:no-network:0",
    "@type": "sc:SourceRecord",
    "sc:source": {
      "schema:description": "No network should be needed.",
    },
  },
  "sc:configuration": {
    "@id": "urn:semanticore:config:no-network",
    "@type": "sc:EnrichmentConfiguration",
    "sc:requiredTagTeamVersion": "7.0.0",
    "sc:sourcePropertyPath": {
      "@type": "sc:PropertyPath",
      "sc:path": [{ "@id": "sc:source" }, { "@id": "schema:description" }],
    },
  },
  "sc:contextManifest": {
    "@id": "urn:semanticore:context-manifest:no-network",
    "@type": "sc:ContextManifest",
    contexts: [
      {
        "@id": "urn:semanticore:context:no-network",
        "@type": "sc:LocalContext",
        "sc:contextDocument": {
          "@context": {
            sc: "https://semanticore.fandaws.org/ns/",
            schema: "https://schema.org/",
          },
        },
      },
    ],
  },
  "sc:ontologySet": {
    "@id": "urn:semanticore:ontology-set:no-network",
    "@type": "sc:OntologySet",
    ontologies: [],
  },
  "sc:tagTeamFixtureGraph": [],
};

try {
  transform(input);

  if (fetchCalled) {
    console.error(`  \u2717 FAIL: kernel invoked fetch (URL: ${fetchUrl})`);
    failed++;
  } else {
    console.log("  \u2713 PASS: kernel does not invoke fetch during transform");
    passed++;
  }

  if (xhrInstantiated) {
    console.error("  \u2717 FAIL: kernel instantiated XMLHttpRequest");
    failed++;
  } else {
    console.log("  \u2713 PASS: kernel does not instantiate XMLHttpRequest during transform");
    passed++;
  }
} catch (error) {
  console.error("  \u2717 FAIL: kernel threw during no-network test");
  console.error(" ", error instanceof Error ? error.message : String(error));
  failed++;
} finally {
  globalThis.fetch = originalFetch;
  (globalThis as Record<string, unknown>)["XMLHttpRequest"] = originalXHR;
}

console.log(`\n  ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
