import { buildDatasetFromRows } from "./dataset.js";
import { getColumnMappings, hasBlockingMappingWarnings } from "./mapping.js";
import type { DatasetAdapterOptions, DatasetResult, MappingManifest } from "./types.js";
import { makeWarning } from "../../kernel/warnings.js";

export function csvToDataset(
  csvText: string,
  mappingManifest: MappingManifest | null | undefined,
  options: DatasetAdapterOptions,
): DatasetResult {
  const { mappings, warnings } = getColumnMappings(mappingManifest);
  if (!mappingManifest || hasBlockingMappingWarnings(warnings)) {
    return { value: null, warnings };
  }

  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return {
      value: buildDatasetFromRows([], mappingManifest, mappings, options),
      warnings,
    };
  }

  const hasHeaderRow = mappingManifest["sc:hasHeaderRow"] === true;
  const headers = hasHeaderRow
    ? rows[0]
    : rows[0].map((_column, index) => String(index));
  const dataRows = hasHeaderRow ? rows.slice(1) : rows;

  const rowObjects = dataRows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])),
  );

  const missingColumns = mappings
    .map((mapping) => mapping["sc:sourceColumn"])
    .filter((sourceColumn) => !headers.includes(sourceColumn));
  for (const sourceColumn of missingColumns) {
    warnings.push(
      makeWarning({
        code: "sc:MappingManifestAmbiguous",
        message: `CSV mapping references missing source column ${sourceColumn}.`,
      }),
    );
  }

  if (hasBlockingMappingWarnings(warnings)) {
    return { value: null, warnings };
  }

  return {
    value: buildDatasetFromRows(rowObjects, mappingManifest, mappings, options),
    warnings,
  };
}

export function parseCsv(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index++) {
    const char = csvText[index];
    const next = csvText[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index++;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index++;
      }
      row.push(cell);
      if (!isBlankRow(row)) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }

  row.push(cell);
  if (!isBlankRow(row)) {
    rows.push(row);
  }
  return rows;
}

function isBlankRow(row: string[]): boolean {
  return row.every((cell) => cell.length === 0);
}
