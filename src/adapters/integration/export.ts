import type { EnrichedExportInput } from "./types.js";
import type { JsonValue, NamedGraph, SourceRecord, WarningResource } from "../../kernel/index.js";
import { canonicalContentHash, stableStringify } from "../../kernel/index.js";
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
  const bundle = {
    "@context": consolidatedGraphContext(graphs),
    "@id": `${input["@id"] ?? "urn:semanticore:export"}:graphs`,
    "@type": ["sc:GraphBundle"],
    "schema:name": "TagTeam JSON-LD graph bundle",
    "sc:parseTraceInclusion": input["sc:parseTraceInclusion"] ?? "summary",
    "sc:totalGraphs": graphs.length,
    "sc:totalRecords": collectRecords(input).length,
    "sc:aggregateOntologyMatchCount": graphs.reduce((total, graph) => total + ontologyMatchCountForGraph(graph), 0),
    "@graph": graphs.map(stripGraphContext),
  };
  return stableStringify({ ...bundle, "sc:contentHash": canonicalContentHash(bundle) }, true);
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
  const { "@context": _context, ...namedGraph } = graph;
  const normalizedGraph = normalizeJsonLdTypes(structuredClone(namedGraph)) as Record<string, JsonValue>;
  normalizedGraph["sc:contentHash"] = canonicalContentHash(normalizedGraph);
  return normalizedGraph as unknown as NamedGraph;
}

function normalizeJsonLdTypes(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeJsonLdTypes);
  if (!isRecord(value)) return value;
  const normalized = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, normalizeJsonLdTypes(item)]),
  );
  if (typeof normalized["@type"] === "string") normalized["@type"] = [normalized["@type"]];
  return normalized;
}

function ontologyMatchCountForGraph(graph: NamedGraph): number {
  const bridge = graph["sc:ontologyBridge"];
  const bridgeCount = Number(isRecord(bridge) ? bridge["sc:ontologyMatchCount"] : undefined);
  if (Number.isFinite(bridgeCount)) return bridgeCount;
  return countOntologyMatches(graph["@graph"]);
}

function countOntologyMatches(value: unknown): number {
  if (Array.isArray(value)) return value.reduce((total, item) => total + countOntologyMatches(item), 0);
  if (!isRecord(value)) return 0;
  return Object.entries(value).reduce((total, [key, item]) => {
    const current = key === "ontologyMatch" || key === "tagteam:ontologyMatch" ? countMatchValues(item) : 0;
    return total + current + countOntologyMatches(item);
  }, 0);
}

function countMatchValues(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  return value ? 1 : 0;
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

function isRecord(value: unknown): value is Record<string, unknown> {
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
