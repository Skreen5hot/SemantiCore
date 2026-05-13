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
  strictEqual(optionsReceived, undefined);
  deepStrictEqual(graph, [
    {
      "@id": "urn:tagteam:ontology-option",
      "@type": "tagteam:Entity",
      "schema:name": "ontology attached",
    },
  ]);
});

test("TagTeam runtime adapter compiles enabled ontology TTL documents independently", () => {
  const ttlReceived: string[] = [];
  const runtime = createTagTeamRuntimeAdapter({
    version: "7.0.0",
    OntologyTextTagger: {
      fromTTL(ttl, options) {
        optionsReceivedMustBeUndefined(options);
        ttlReceived.push(ttl);
        return {
          tagText() {
            return [{ ontologyMatchIRI: `urn:ontology:${ttlReceived.length}` }];
          },
          getStats() {
            return { classCount: 1 };
          },
        };
      },
    },
    buildGraph(_sourceText, options) {
      const ontology = options?.ontology as { getStats?: () => Record<string, number>; tagText?: () => unknown[] };
      const matches = ontology.tagText?.() ?? [];
      return {
        "@id": "urn:tagteam:multi-ontology",
        "@type": "tagteam:Entity",
        "schema:name": `${ontology.getStats?.().classCount} classes`,
        ontologyMatch: matches,
      };
    },
  });

  const graph = runtime.buildGraph("Firmware update.", tagTeamOptions(), multiOntologySet());
  deepStrictEqual(ttlReceived, [
    "@prefix a: <urn:a:> .\na:FirmwareUpdate a a:Process .",
    "@prefix b: <urn:b:> .\nb:Drone a b:Platform .",
  ]);
  if (Array.isArray(graph)) throw new Error("Expected single graph node.");
  strictEqual(graph["schema:name"], "2 classes");
  deepStrictEqual(graph.ontologyMatch, [
    { ontologyMatchIRI: "urn:ontology:2" },
    { ontologyMatchIRI: "urn:ontology:2" },
  ]);
});

test("merged ontology tagger delegates clause authority matches", () => {
  const runtime = createTagTeamRuntimeAdapter({
    version: "7.0.0",
    OntologyTextTagger: {
      fromTTL(ttl) {
        return {
          emitClauseAuthorityMatch() {
            return {
              ontologyMatchIRI: ttl.includes("Firmware") ? "urn:firmware" : "urn:drone",
              matchConfidence: ttl.includes("Firmware") ? 0.4 : 0.9,
            };
          },
        };
      },
    },
    buildGraph(_sourceText, options) {
      const ontology = options?.ontology as { emitClauseAuthorityMatch?: () => unknown[] };
      return {
        "@id": "urn:tagteam:authority",
        "@type": "tagteam:Entity",
        ontologyMatch: ontology.emitClauseAuthorityMatch?.() ?? [],
      };
    },
  });

  const graph = runtime.buildGraph("Firmware update.", tagTeamOptions(), multiOntologySet());
  if (Array.isArray(graph)) throw new Error("Expected single graph node.");
  deepStrictEqual(graph.ontologyMatch, {
    ontologyMatchIRI: "urn:drone",
    matchConfidence: 0.9,
  });
});

test("merged ontology tagger exposes tagDefinitions and parse result union", () => {
  const runtime = createTagTeamRuntimeAdapter({
    version: "7.0.0",
    OntologyTextTagger: {
      fromTTL(ttl) {
        const prefix = ttl.includes("Firmware") ? "firmware" : "drone";
        return {
          tagDefinitions: [{ id: `urn:${prefix}:Class`, type: "owl:Class" }],
          _parseResult: parseResult(prefix),
        };
      },
    },
    buildGraph(_sourceText, options) {
      const ontology = options?.ontology as {
        tagDefinitions?: unknown[];
        _parseResult?: {
          triples?: unknown[];
          getClasses?: () => unknown[];
          getNamedIndividuals?: () => unknown[];
          getLabels?: (subject: unknown) => unknown[];
          getAltLabels?: (subject: unknown) => unknown[];
          getProperty?: (subject: unknown, predicate: unknown) => unknown;
          getProperties?: (subject: unknown, predicate: unknown) => unknown[];
          getObjects?: (subject: unknown, predicate: unknown) => unknown[];
          isSubclassOf?: (classIri: unknown, targetIri: unknown) => boolean;
          resolveIRI?: (iri: unknown) => unknown;
        };
      };
      return {
        "@id": "urn:tagteam:parse-result",
        "@type": "tagteam:Entity",
        "sc:definitionCount": ontology.tagDefinitions?.length ?? 0,
        "sc:tripleCount": ontology._parseResult?.triples?.length ?? 0,
        "sc:classes": ontology._parseResult?.getClasses?.(),
        "sc:namedIndividuals": ontology._parseResult?.getNamedIndividuals?.(),
        "sc:labels": ontology._parseResult?.getLabels?.("subject"),
        "sc:altLabels": ontology._parseResult?.getAltLabels?.("subject"),
        "sc:property": ontology._parseResult?.getProperty?.("subject", "predicate"),
        "sc:properties": ontology._parseResult?.getProperties?.("subject", "predicate"),
        "sc:objects": ontology._parseResult?.getObjects?.("subject", "predicate"),
        "sc:isSubclass": ontology._parseResult?.isSubclassOf?.("class", "target"),
        "sc:resolved": ontology._parseResult?.resolveIRI?.("alias"),
      };
    },
  });

  const graph = runtime.buildGraph("Firmware update.", tagTeamOptions(), multiOntologySet());
  if (Array.isArray(graph)) throw new Error("Expected single graph node.");
  strictEqual(graph["sc:definitionCount"], 2);
  strictEqual(graph["sc:tripleCount"], 2);
  deepStrictEqual(graph["sc:classes"], [
    { id: "urn:firmware:Class", type: "owl:Class" },
    { id: "urn:drone:Class", type: "owl:Class" },
  ]);
  deepStrictEqual(graph["sc:namedIndividuals"], ["firmware-individual", "drone-individual"]);
  deepStrictEqual(graph["sc:labels"], ["firmware label", "drone label"]);
  deepStrictEqual(graph["sc:altLabels"], ["firmware alt", "drone alt"]);
  strictEqual(graph["sc:property"], "firmware property");
  deepStrictEqual(graph["sc:properties"], ["firmware property", "drone property"]);
  deepStrictEqual(graph["sc:objects"], ["firmware object", "drone object"]);
  strictEqual(graph["sc:isSubclass"], true);
  strictEqual(graph["sc:resolved"], "urn:firmware:resolved");
});

test("TagTeam runtime adapter forwards supported TagTeam options", () => {
  let received: Record<string, unknown> | undefined;
  const runtime = createTagTeamRuntimeAdapter({
    version: "7.0.0",
    buildGraph(_sourceText, options) {
      received = options;
      return { "@id": "urn:tagteam:options", "@type": "tagteam:Entity" };
    },
  });

  runtime.buildGraph("Options text.", {
    ...tagTeamOptions(),
    context: "test-context",
    extractEntities: false,
    extractActs: true,
    detectRoles: false,
    useLegacy: true,
  }, ontologySet());
  strictEqual(received?.context, "test-context");
  strictEqual(received?.extractEntities, false);
  strictEqual(received?.extractActs, true);
  strictEqual(received?.detectRoles, false);
  strictEqual(received?.useLegacy, true);
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

function optionsReceivedMustBeUndefined(options: Record<string, unknown> | undefined): void {
  strictEqual(options, undefined);
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

function multiOntologySet(): OntologySet {
  return {
    "@id": "urn:semanticore:ontology-set:multi",
    "@type": "sc:OntologySet",
    ontologies: [
      {
        "@id": "urn:semanticore:ontology:a",
        "@type": "sc:LocalOntology",
        "sc:enabled": true,
        "sc:content": "@prefix a: <urn:a:> .\na:FirmwareUpdate a a:Process .",
      },
      {
        "@id": "urn:semanticore:ontology:b",
        "@type": "sc:LocalOntology",
        "sc:enabled": true,
        "sc:content": "@prefix b: <urn:b:> .\nb:Drone a b:Platform .",
      },
    ],
  };
}

function parseResult(prefix: string): Record<string, unknown> {
  return {
    triples: [`${prefix}:triple`],
    getClasses() {
      return [{ id: `urn:${prefix}:Class`, type: "owl:Class" }];
    },
    getNamedIndividuals() {
      return [`${prefix}-individual`];
    },
    getLabels() {
      return [`${prefix} label`];
    },
    getAltLabels() {
      return [`${prefix} alt`];
    },
    getProperty() {
      return `${prefix} property`;
    },
    getProperties() {
      return [`${prefix} property`];
    },
    getObjects() {
      return [`${prefix} object`];
    },
    isSubclassOf() {
      return prefix === "drone";
    },
    resolveIRI(iri: unknown) {
      return prefix === "firmware" ? "urn:firmware:resolved" : iri;
    },
  };
}
