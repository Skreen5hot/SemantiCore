import { strictEqual, deepStrictEqual } from "node:assert";
import {
  csvToDataset,
  exportCanonicalJsonLd,
  exportCsvSummary,
  exportGraphBundle,
  jsonLdToDataset,
  jsonToDataset,
  type EnrichedExportInput,
  type MappingManifest,
} from "../src/adapters/integration/index.js";
import { stableStringify } from "../src/kernel/index.js";

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

test("same CSV and mapping manifest produce byte-stable dataset JSON-LD", () => {
  const csv = 'description,title\n"The committee shall review.",Notice\n';
  const first = csvToDataset(csv, csvMapping(), { datasetId: "urn:semanticore:dataset:csv-test" });
  const second = csvToDataset(csv, csvMapping(), { datasetId: "urn:semanticore:dataset:csv-test" });
  strictEqual(first.warnings.length, 0);
  strictEqual(stableStringify(first.value), stableStringify(second.value));
  strictEqual(first.value?.["sc:records"][0]["@id"], "urn:semanticore:dataset:csv-test:record:0");
  strictEqual(
    (first.value?.["sc:records"][0]["sc:source"] as Record<string, string>)["schema:description"],
    "The committee shall review.",
  );
});

test("missing mapping manifest produces MappingManifestMissing", () => {
  const result = csvToDataset("description\nhello\n", null, {
    datasetId: "urn:semanticore:dataset:missing-map",
  });
  strictEqual(result.value, null);
  strictEqual(result.warnings[0]["sc:code"]["@id"], "sc:MappingManifestMissing");
});

test("ambiguous mapping manifest produces MappingManifestAmbiguous", () => {
  const mapping = csvMapping();
  mapping.columnMappings = [
    ...mapping.columnMappings!,
    {
      "@type": "sc:ColumnMapping",
      "sc:sourceColumn": "description",
      "sc:targetProperty": { "@id": "schema:alternateName" },
    },
  ];
  const result = csvToDataset("description,title\nhello,test\n", mapping, {
    datasetId: "urn:semanticore:dataset:ambiguous-map",
  });
  strictEqual(result.value, null);
  strictEqual(
    result.warnings.some((warning) => warning["sc:code"]["@id"] === "sc:MappingManifestAmbiguous"),
    true,
  );
});

test("plain JSON adapter selects arrays by RFC 6901 JSON Pointer", () => {
  const input = {
    payload: {
      rows: [
        { description: "First", title: "A" },
        { description: "Second", title: "B" },
      ],
    },
  };
  const result = jsonToDataset(input, jsonMapping(), {
    datasetId: "urn:semanticore:dataset:json-test",
    recordsPointer: "/payload/rows",
  });
  strictEqual(result.warnings.length, 0);
  strictEqual(result.value?.["sc:records"].length, 2);
  strictEqual(result.value?.["sc:records"][1]["@id"], "urn:semanticore:dataset:json-test:record:1");
});

test("plain JSON adapter reports unsupported shapes", () => {
  const result = jsonToDataset("not an object", jsonMapping(), {
    datasetId: "urn:semanticore:dataset:bad-json",
  });
  strictEqual(result.value, null);
  strictEqual(result.warnings[0]["sc:code"]["@id"], "sc:UnsupportedInputShape");
});

test("JSON-LD passthrough accepts stable dataset records", () => {
  const dataset = {
    "@context": { sc: "https://semanticore.fandaws.org/ns/" },
    "@id": "urn:semanticore:dataset:jsonld",
    "@type": "sc:Dataset",
    "sc:records": [
      {
        "@id": "urn:semanticore:record:jsonld:0",
        "@type": "sc:SourceRecord",
      },
    ],
  };
  const result = jsonLdToDataset(dataset);
  deepStrictEqual(result.value, dataset);
  strictEqual(result.warnings.length, 0);
});

test("JSON-LD passthrough rejects blank-node record IDs", () => {
  const dataset = {
    "@id": "urn:semanticore:dataset:jsonld",
    "@type": "sc:Dataset",
    "sc:records": [
      {
        "@id": "_:b0",
        "@type": "sc:SourceRecord",
      },
    ],
  };
  const result = jsonLdToDataset(dataset);
  strictEqual(result.value, null);
  strictEqual(result.warnings[0]["sc:code"]["@id"], "sc:UnsupportedInputShape");
});

test("export utilities produce graph bundle and required CSV summary columns", () => {
  const input = enrichedExportInput();
  const canonical = exportCanonicalJsonLd(input);
  const graphBundle = exportGraphBundle(input);
  const csv = exportCsvSummary(input);

  strictEqual(canonical.includes("sc:TransformResult"), true);
  const parsedGraphBundle = JSON.parse(graphBundle);
  deepStrictEqual(parsedGraphBundle["@type"], ["sc:GraphBundle"]);
  strictEqual(Array.isArray(parsedGraphBundle["@graph"]), true);
  strictEqual(parsedGraphBundle["sc:totalGraphs"], 1);
  strictEqual(parsedGraphBundle["sc:totalRecords"], 1);
  strictEqual(parsedGraphBundle["sc:aggregateOntologyMatchCount"], 1);
  strictEqual(String(parsedGraphBundle["sc:contentHash"]).startsWith("sha256:"), true);
  const bundledGraph = parsedGraphBundle["@graph"][0];
  strictEqual(bundledGraph["@context"], undefined);
  strictEqual(bundledGraph["@id"], "urn:semanticore:graph:export:0");
  deepStrictEqual(bundledGraph["@type"], ["sc:TagTeamGraph"]);
  strictEqual(String(bundledGraph["sc:contentHash"]).startsWith("sha256:"), true);
  strictEqual(bundledGraph["sc:graphForRecord"]["@id"], "urn:semanticore:record:export:0");
  strictEqual(bundledGraph["sc:graphIndex"], 0);
  deepStrictEqual(bundledGraph["sc:ontologyBridge"]["@type"], ["sc:OntologyBridgeReport"]);
  strictEqual(bundledGraph["sc:ontologyBridge"]["sc:ontologyMatchCount"], 1);
  strictEqual(bundledGraph["sc:tagTeamMetadata"].entities, 1);
  strictEqual(
    csv.split("\n")[0],
    "recordId,enrichmentStatus,sourceText,entityCount,actCount,roleCount,deonticDetected,namedGraphId,warningErrorCodes",
  );
  strictEqual(csv.includes("@graph"), false);
});

console.log(`\n  ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}

function csvMapping(): MappingManifest {
  return {
    "@id": "urn:semanticore:mapping:csv-test",
    "@type": "sc:MappingManifest",
    "sc:sourceFormat": { "@id": "sc:CSV" },
    "sc:hasHeaderRow": true,
    "sc:recordIdStrategy": { "@id": "sc:RowIndexRecordId" },
    columnMappings: [
      {
        "@type": "sc:ColumnMapping",
        "sc:sourceColumn": "description",
        "sc:targetProperty": { "@id": "schema:description" },
      },
      {
        "@type": "sc:ColumnMapping",
        "sc:sourceColumn": "title",
        "sc:targetProperty": { "@id": "schema:name" },
      },
    ],
  };
}

function jsonMapping(): MappingManifest {
  return {
    "@id": "urn:semanticore:mapping:json-test",
    "@type": "sc:MappingManifest",
    "sc:sourceFormat": { "@id": "sc:JSON" },
    "sc:recordIdStrategy": { "@id": "sc:RowIndexRecordId" },
    columnMappings: csvMapping().columnMappings,
  };
}

function enrichedExportInput(): EnrichedExportInput {
  return {
    "@id": "urn:semanticore:transform-result:export-test",
    "@type": "sc:TransformResult",
    "sc:record": {
      "@id": "urn:semanticore:record:export:0",
      "@type": ["sc:SourceRecord", "sc:EnrichedRecord"],
      "sc:semanticEnrichment": {
        "@id": "urn:semanticore:enrichment:export:0",
        "@type": "sc:TagTeamEnrichment",
        "sc:status": { "@id": "sc:EnrichmentSucceeded" },
        "sc:sourceText": "The agency shall publish the notice.",
        "sc:namedGraph": { "@id": "urn:semanticore:graph:export:0" },
        "sc:summary": {
          "@type": "sc:TagTeamSummary",
          "sc:entityCount": 1,
          "sc:actCount": 1,
          "sc:roleCount": 0,
          "sc:deonticDetected": true,
        },
      },
    },
    "sc:graph": {
      "@context": {
        tagteam: "http://tagteam.fandaws.com/ontology/",
      },
      "@id": "urn:semanticore:graph:export:0",
      "@type": ["sc:TagTeamGraph"],
      "sc:graphForRecord": { "@id": "urn:semanticore:record:export:0" },
      "sc:graphIndex": 0,
      "sc:ontologyBridge": {
        "@type": ["sc:OntologyBridgeReport"],
        "sc:ontologyOptionStatus": { "@id": "sc:OntologyCompiledAndPassed" },
        "sc:ontologyOptionPassed": true,
        "sc:ontologyCompileMode": { "@id": "sc:TagTeamDefaultPriorityChain" },
        "sc:enabledOntologyCount": 1,
        "sc:compiledOntologyCount": 1,
        "sc:ontologyMatchCount": 1,
      },
      "sc:tagTeamMetadata": {
        entities: 1,
        acts: 0,
        sentences: [{ sentenceIndex: 0 }],
      },
      "@graph": [
        {
          "@id": "urn:tagteam:entity:agency",
          "@type": "tagteam:Entity",
        },
      ],
    },
    "sc:warnings": [],
  };
}
