import { deepStrictEqual, strictEqual } from "node:assert";
import { createTagTeamRuntimeAdapter } from "../src/adapters/integration/tagteam-runtime.js";
import type { OntologySet, TagTeamOptions } from "../src/kernel/types.js";

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

test("TagTeam runtime adapter exposes version and normalizes graph output", () => {
  const runtime = createTagTeamRuntimeAdapter({
    version: "7.0.0",
    buildGraph(sourceText) {
      return {
        "@context": { tagteam: "https://tagteam.fandaws.org/ontology/" },
        "@graph": [
          {
            "@id": "urn:tagteam:test",
            "@type": "tagteam:Entity",
            "schema:name": sourceText,
          },
        ],
      };
    },
  });

  strictEqual(runtime.version, "7.0.0");
  const graph = runtime.buildGraph("The agency shall publish.", tagTeamOptions(), ontologySet());
  strictEqual(Array.isArray(graph), false);
  if (!Array.isArray(graph)) {
    strictEqual(Array.isArray(graph["@graph"]), true);
  }
});

test("TagTeam runtime adapter passes enabled ontology TTL when API supports it", () => {
  let ttlReceived = "";
  let optionsReceived: Record<string, unknown> | undefined;
  const runtime = createTagTeamRuntimeAdapter({
    version: "7.0.0",
    OntologyTextTagger: {
      fromTTL(ttl, options) {
        ttlReceived = ttl;
        optionsReceived = options;
        return { tagText: () => [] };
      },
    },
    buildGraph(_sourceText, options) {
      return [
        {
          "@id": "urn:tagteam:ontology-option",
          "@type": "tagteam:Entity",
          "schema:name": typeof options?.ontology === "object" ? "ontology attached" : "missing",
        },
      ];
    },
  });

  const graph = runtime.buildGraph("Notice text.", tagTeamOptions(), ontologySet());
  strictEqual(ttlReceived.includes("ex:Notice"), true);
  strictEqual(optionsReceived?.ontologyThreshold, 0.2);
  deepStrictEqual(graph, [
    {
      "@id": "urn:tagteam:ontology-option",
      "@type": "tagteam:Entity",
      "schema:name": "ontology attached",
    },
  ]);
});

console.log(`\n  ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}

function tagTeamOptions(): TagTeamOptions {
  return {
    "@type": "sc:TagTeamOptions",
    "sc:ontologyThreshold": 0.2,
    "sc:verbose": false,
  };
}

function ontologySet(): OntologySet {
  return {
    "@id": "urn:semanticore:ontology-set:test",
    "@type": "sc:OntologySet",
    ontologies: [
      {
        "@id": "urn:semanticore:ontology:test",
        "@type": "sc:LocalOntology",
        "sc:enabled": true,
        "sc:content": "@prefix ex: <urn:example:> .\nex:Notice a ex:InformationContentEntity .",
        "sc:ontologyAlignment": { "@id": "sc:CCO2BFO2020Aligned" },
      },
    ],
  };
}
