import type { EnrichedExportInput } from "./types.js";
import type { JsonValue, NamedGraph, SourceRecord, WarningResource } from "../../kernel/index.js";
import { stableStringify } from "../../kernel/index.js";
import { TAGTEAM_GRAPH_CONTEXT } from "../../kernel/vocabulary.js";

const CSV_COLUMNS = [
  "recordId",
  "enrichmentStatus",
  "sourceText",
  "entityCount",
  "actCount",
  "roleCount",
  "deonticDetected",
  "namedGraphId",
  "warningErrorCodes",
] as const;

export function exportCanonicalJsonLd(input: unknown): string {
  return stableStringify(input, true);
}

export function exportGraphBundle(input: EnrichedExportInput): string {
  const graphs = collectGraphs(input);
  return stableStringify(
    {
      "@context": consolidatedGraphContext(graphs),
      "@id": `${input["@id"] ?? "urn:semanticore:export"}:graphs`,
      "@type": "sc:GraphBundle",
      "@graph": graphs.map(stripGraphContext),
    },
    true,
  );
}

export function exportCsvSummary(input: EnrichedExportInput): string {
  const records = collectRecords(input);
  const warnings = input["sc:warnings"] ?? [];
  const lines = [CSV_COLUMNS.join(",")];
  for (const record of records) {
    const enrichment = firstEnrichment(record);
    const summary = enrichment?.["sc:summary"];
    const row = [
      record["@id"],
      enrichment?.["sc:status"]?.["@id"] ?? "sc:EnrichmentSkipped",
      enrichment?.["sc:sourceText"] ?? "",
      String(summary?.["sc:entityCount"] ?? 0),
      String(summary?.["sc:actCount"] ?? 0),
      String(summary?.["sc:roleCount"] ?? 0),
      String(summary?.["sc:deonticDetected"] ?? false),
      enrichment?.["sc:namedGraph"]?.["@id"] ?? "",
      warningCodesForRecord(warnings, record["@id"]).join(" "),
    ];
    lines.push(row.map(escapeCsvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function collectRecords(input: EnrichedExportInput): SourceRecord[] {
  if (Array.isArray(input["sc:records"])) {
    return input["sc:records"];
  }
  if (Array.isArray(input["sc:record"])) {
    return input["sc:record"];
  }
  return input["sc:record"] ? [input["sc:record"]] : [];
}

function collectGraphs(input: EnrichedExportInput): NamedGraph[] {
  if (Array.isArray(input["sc:graphs"])) {
    return input["sc:graphs"];
  }
  if (Array.isArray(input["sc:graph"])) {
    return input["sc:graph"];
  }
  return input["sc:graph"] ? [input["sc:graph"]] : [];
}

function stripGraphContext(graph: NamedGraph): NamedGraph {
  const copy = structuredClone(graph);
  delete copy["@context"];
  return copy;
}

function consolidatedGraphContext(graphs: NamedGraph[]): JsonValue {
  return graphs.reduce<JsonValue>((context, graph) => mergeContexts(context, graph["@context"]), TAGTEAM_GRAPH_CONTEXT);
}

function mergeContexts(baseContext: JsonValue, nextContext: JsonValue | undefined): JsonValue {
  if (nextContext === undefined || nextContext === null) {
    return baseContext;
  }
  if (Array.isArray(nextContext)) {
    return nextContext.reduce<JsonValue>((context, item) => mergeContexts(context, item), baseContext);
  }
  if (!isPlainObject(nextContext) || !isPlainObject(baseContext)) {
    return baseContext;
  }
  const merged: Record<string, JsonValue> = { ...baseContext };
  for (const [term, value] of Object.entries(nextContext)) {
    merged[term] = structuredClone(value) as JsonValue;
  }
  return merged;
}

function isPlainObject(value: JsonValue): value is Record<string, JsonValue> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function firstEnrichment(record: SourceRecord): Record<string, any> | null {
  const enrichment = record["sc:semanticEnrichment"];
  if (Array.isArray(enrichment)) {
    return enrichment[0] as Record<string, any>;
  }
  if (enrichment !== null && typeof enrichment === "object") {
    return enrichment as Record<string, any>;
  }
  return null;
}

function warningCodesForRecord(warnings: WarningResource[], recordId: string): string[] {
  return warnings
    .filter((warning) => warning["sc:record"]?.["@id"] === recordId || warning["sc:record"] === undefined)
    .map((warning) => warning["sc:code"]["@id"])
    .sort();
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
