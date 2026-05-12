import type { ColumnMapping, DatasetAdapterOptions, MappingManifest } from "./types.js";
import type { JsonObject, JsonValue, SemantiCoreDataset, SourceRecord } from "../../kernel/index.js";
import { CORE_CONTEXT } from "../../kernel/vocabulary.js";

export function buildDatasetFromRows(
  rows: Record<string, string>[],
  mappingManifest: MappingManifest,
  mappings: ColumnMapping[],
  options: DatasetAdapterOptions,
): SemantiCoreDataset {
  return {
    "@context": {
      ...CORE_CONTEXT,
      records: { "@id": "sc:records", "@container": "@list" },
    },
    "@id": options.datasetId,
    "@type": "sc:Dataset",
    "schema:name": options.datasetName ?? options.datasetId,
    "sc:recordIdStrategy": mappingManifest["sc:recordIdStrategy"] ?? { "@id": "sc:RowIndexRecordId" },
    "sc:mappingManifest": { "@id": mappingManifest["@id"] },
    "sc:records": rows.map((row, index) =>
      buildRecord(row, mappings, `${options.datasetId}:record:${index}`),
    ),
  };
}

function buildRecord(row: Record<string, string>, mappings: ColumnMapping[], recordId: string): SourceRecord {
  const record: SourceRecord = {
    "@id": recordId,
    "@type": "sc:SourceRecord",
    "sc:source": {},
  };
  const source = record["sc:source"] as JsonObject;
  for (const mapping of mappings) {
    const value = row[mapping["sc:sourceColumn"]] ?? "";
    assignProperty(source, mapping["sc:targetProperty"]["@id"], value);
  }
  return record;
}

export function assignProperty(target: JsonObject, property: string, value: JsonValue): void {
  const existing = target[property];
  if (existing === undefined) {
    target[property] = value;
  } else if (Array.isArray(existing)) {
    existing.push(value);
  } else {
    target[property] = [existing, value];
  }
}
