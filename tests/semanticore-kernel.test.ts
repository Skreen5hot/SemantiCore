import { deepStrictEqual, strictEqual } from "node:assert";
import { enrichRecord } from "../src/kernel/enrich.js";
import type {
  ContextManifest,
  EnrichmentConfiguration,
  OntologySet,
  SourceRecord,
  TagTeamRuntime,
} from "../src/kernel/types.js";

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

test("offline local context resolves compact semantic property paths", () => {
  const result = enrichRecord(baseRecord(), baseConfig(), baseContextManifest(), baseOntologySet(), graphRuntime());
  strictEqual(result.warnings.length, 0);
  const enrichment = result.record["sc:semanticEnrichment"];
  strictEqual(isNode(enrichment) ? enrichment["@type"] : null, "sc:TagTeamEnrichment");
  strictEqual(!Array.isArray(result.graph) ? result.graph?.["@type"] : null, "sc:TagTeamGraph");
});

test("unresolved path term emits ContextResolutionError with path index", () => {
  const config = baseConfig();
  config["sc:sourcePropertyPath"]["sc:path"] = [{ "@id": "sc:source" }, { "@id": "missingTerm" }];
  const result = enrichRecord(baseRecord(), config, baseContextManifest(), baseOntologySet(), graphRuntime());
  const warning = result.warnings.find((item) => item["sc:code"]["@id"] === "sc:ContextResolutionError");
  strictEqual(warning?.["sc:pathIndex"], 1);
  deepStrictEqual(warning?.["sc:pathTerm"], { "@id": "missingTerm" });
});

test("RejectOnMismatch prevents TagTeam invocation", () => {
  let called = false;
  const runtime = graphRuntime("8.0.0");
  runtime.buildGraph = () => {
    called = true;
    return [];
  };
  const result = enrichRecord(baseRecord(), baseConfig(), baseContextManifest(), baseOntologySet(), runtime);
  strictEqual(called, false);
  strictEqual(result.graph, null);
  strictEqual(result.warnings[0]["sc:code"]["@id"], "sc:TagTeamVersionMismatch");
});

test("WarnAndRunOnMismatch emits warning and still enriches", () => {
  const config = baseConfig();
  config["sc:tagTeamVersionPolicy"] = { "@id": "sc:WarnAndRunOnMismatch" };
  const result = enrichRecord(baseRecord(), config, baseContextManifest(), baseOntologySet(), graphRuntime("8.0.0"));
  strictEqual(!Array.isArray(result.graph) ? result.graph?.["@type"] : null, "sc:TagTeamGraph");
  strictEqual(result.warnings[0]["sc:code"]["@id"], "sc:TagTeamVersionMismatch");
});

test("multi-value EnrichEachValue produces multiple named graphs", () => {
  const record = baseRecord();
  record["sc:source"] = {
    "schema:description": ["First source text.", "Second source text."],
  };
  const result = enrichRecord(record, baseConfig(), baseContextManifest(), baseOntologySet(), graphRuntime());
  strictEqual(Array.isArray(result.graph), true);
  if (Array.isArray(result.graph)) {
    strictEqual(result.graph.length, 2);
  }
  strictEqual(Array.isArray(result.record["sc:semanticEnrichment"]), true);
});

test("English language literal is accepted and rejected language emits warning", () => {
  const accepted = baseRecord();
  accepted["sc:source"] = {
    "schema:description": { "@value": "Accepted text.", "@language": "en-US" },
  };
  const acceptedResult = enrichRecord(
    accepted,
    baseConfig(),
    baseContextManifest(),
    baseOntologySet(),
    graphRuntime(),
  );
  strictEqual(acceptedResult.warnings.length, 0);

  const rejected = baseRecord();
  rejected["sc:source"] = {
    "schema:description": { "@value": "Texte refuse.", "@language": "fr" },
  };
  const rejectedResult = enrichRecord(
    rejected,
    baseConfig(),
    baseContextManifest(),
    baseOntologySet(),
    graphRuntime(),
  );
  strictEqual(rejectedResult.graph, null);
  strictEqual(
    rejectedResult.warnings.some((warning) => warning["sc:code"]["@id"] === "sc:UnsupportedLanguageLiteral"),
    true,
  );
});

test("TagTeam runtime errors become JSON-LD warnings", () => {
  const runtime = graphRuntime();
  runtime.buildGraph = () => {
    throw new Error("fixture runtime failed");
  };
  const result = enrichRecord(baseRecord(), baseConfig(), baseContextManifest(), baseOntologySet(), runtime);
  strictEqual(result.graph, null);
  strictEqual(
    result.warnings.some((warning) => warning["sc:code"]["@id"] === "sc:TagTeamRuntimeError"),
    true,
  );
});

test("TagTeam graph output is represented as top-level @graph", () => {
  const result = enrichRecord(baseRecord(), baseConfig(), baseContextManifest(), baseOntologySet(), graphRuntime());
  const graph = !Array.isArray(result.graph) ? result.graph : null;
  strictEqual(graph?.["@type"], "sc:TagTeamGraph");
  strictEqual(Array.isArray(graph?.["@graph"]), true);
  strictEqual("sc:jsonld" in (result.graph ?? {}), false);
});

test("TagTeam graph context maps TagTeam prefixes and relation terms", () => {
  const result = enrichRecord(baseRecord(), baseConfig(), baseContextManifest(), baseOntologySet(), tagTeamContextRuntime());
  const graph = !Array.isArray(result.graph) ? result.graph : null;
  const context = graph?.["@context"] as Record<string, unknown> | undefined;
  deepStrictEqual(context?.inst, "urn:tagteam:instance:");
  deepStrictEqual(context?.rdfs, "http://www.w3.org/2000/01/rdf-schema#");
  deepStrictEqual(context?.owl, "http://www.w3.org/2002/07/owl#");
  deepStrictEqual(context?.is_about, { "@id": "tagteam:is_about", "@type": "@id" });
  deepStrictEqual(context?.is_concretized_by, { "@id": "tagteam:is_concretized_by", "@type": "@id" });
  deepStrictEqual(context?.ontologyMatch, { "@id": "tagteam:ontologyMatch", "@container": "@set" });
  deepStrictEqual(context?.ontologyMatchIRI, { "@id": "tagteam:ontologyMatchIRI", "@type": "@id" });
  deepStrictEqual(context?.EventDescription, "tagteam:EventDescription");
});

console.log(`\n  ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}

function baseRecord(): SourceRecord {
  return {
    "@id": "urn:semanticore:record:test:0",
    "@type": "sc:SourceRecord",
    "sc:source": {
      "schema:description": "The agency shall publish the notice.",
    },
  };
}

function baseConfig(): EnrichmentConfiguration {
  return {
    "@id": "urn:semanticore:config:test",
    "@type": "sc:EnrichmentConfiguration",
    "sc:requiredTagTeamVersion": "7.0.0",
    "sc:tagTeamVersionPolicy": { "@id": "sc:RejectOnMismatch" },
    "sc:sourcePropertyPath": {
      "@type": "sc:PropertyPath",
      "sc:path": [{ "@id": "sc:source" }, { "@id": "schema:description" }],
      "sc:multiValuePolicy": { "@id": "sc:EnrichEachValue" },
      "sc:languagePolicy": {
        "@type": "sc:LanguagePolicy",
        "sc:acceptedLanguage": "en",
        "sc:onLanguageMissing": { "@id": "sc:AcceptPlainLiteral" },
      },
    },
    "sc:tagTeamOptions": {
      "@type": "sc:TagTeamOptions",
      "sc:ontologyThreshold": 0.2,
      "sc:verbose": false,
    },
  };
}

function baseContextManifest(): ContextManifest {
  return {
    "@id": "urn:semanticore:context-manifest:test",
    "@type": "sc:ContextManifest",
    contexts: [
      {
        "@id": "urn:semanticore:context:test",
        "@type": "sc:LocalContext",
        "sc:contextDocument": {
          "@context": {
            sc: "https://semanticore.fandaws.org/ns/",
            schema: "https://schema.org/",
          },
        },
      },
    ],
  };
}

function baseOntologySet(): OntologySet {
  return {
    "@id": "urn:semanticore:ontology-set:test",
    "@type": "sc:OntologySet",
    ontologies: [
      {
        "@id": "urn:semanticore:ontology:test",
        "@type": "sc:LocalOntology",
        "sc:ontologyAlignment": { "@id": "sc:CCO2BFO2020Aligned" },
      },
    ],
  };
}

function graphRuntime(version = "7.0.0"): TagTeamRuntime {
  return {
    version,
    buildGraph(text) {
      return [
        {
          "@id": `urn:tagteam:entity:${text.length}`,
          "@type": "tagteam:Entity",
          "schema:name": text,
        },
      ];
    },
  };
}

function tagTeamContextRuntime(version = "7.0.0"): TagTeamRuntime {
  return {
    version,
    buildGraph() {
      return {
        "@graph": [
          {
            "@id": "inst:VP_battlefield",
            "@type": ["tagteam:DiscourseReferent", "tagteam:VerbPhrase"],
            "is_about": { "@id": "inst:EventDesc_battlefiel_53416d72" },
            "is_concretized_by": { "@id": "inst:Input_Text_IBE_3aacb2c19656" },
            "rdfs:label": "battlefield",
            "tagteam:denotesType": "EventDescription",
          },
          {
            "@id": "inst:EventDesc_battlefiel_53416d72",
            "@type": ["EventDescription", "ActSpecification", "owl:NamedIndividual"],
            "rdfs:label": "Event: battlefiel",
          },
        ],
      };
    },
  };
}

function isNode(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
