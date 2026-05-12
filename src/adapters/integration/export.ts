import type { EnrichedExportInput } from "./types.js";
import type { NamedGraph, SourceRecord, WarningResource } from "../../kernel/index.js";
import { stableStringify } from "../../kernel/index.js";
import { CORE_CONTEXT } from "../../kernel/vocabulary.js";

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
      "@context": CORE_CONTEXT,
      "@id": `${input["@id"] ?? "urn:semanticore:export"}:graphs`,
      "@type": "sc:GraphBundle",
      "sc:graphs": graphs,
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
