import { buildDatasetFromRows } from "./dataset.js";
import { getColumnMappings, hasBlockingMappingWarnings } from "./mapping.js";
import type { DatasetAdapterOptions, DatasetResult, MappingManifest } from "./types.js";
import type { JsonObject } from "../../kernel/index.js";
import { makeWarning } from "../../kernel/warnings.js";

export interface JsonAdapterOptions extends DatasetAdapterOptions {
  recordsPointer?: string;
}

export function jsonToDataset(
  input: unknown,
  mappingManifest: MappingManifest | null | undefined,
  options: JsonAdapterOptions,
): DatasetResult {
  const { mappings, warnings } = getColumnMappings(mappingManifest);
  if (!mappingManifest || hasBlockingMappingWarnings(warnings)) {
    return { value: null, warnings };
  }

  const selected = options.recordsPointer ? resolveJsonPointer(input, options.recordsPointer) : input;
  if (selected instanceof PointerResolutionError) {
    return {
      value: null,
      warnings: [
        makeWarning({
          code: "sc:UnsupportedInputShape",
          message: selected.message,
        }),
      ],
    };
  }

  const objects = normalizeJsonRecords(selected);
  if (!objects) {
    return {
      value: null,
      warnings: [
        makeWarning({
          code: "sc:UnsupportedInputShape",
          message: "Plain JSON input must be an object, an array of objects, or an object containing an array selected by JSON Pointer.",
        }),
      ],
    };
  }

  const rows = objects.map((item) =>
    Object.fromEntries(
      Object.entries(item).map(([key, value]) => [
        key,
        typeof value === "string" ? value : JSON.stringify(value),
      ]),
    ),
  );

  return {
    value: buildDatasetFromRows(rows, mappingManifest, mappings, options),
    warnings,
  };
}

export function resolveJsonPointer(input: unknown, pointer: string): unknown | PointerResolutionError {
  if (pointer === "") {
    return input;
  }
  if (!pointer.startsWith("/")) {
    return new PointerResolutionError(`JSON Pointer must start with '/': ${pointer}`);
  }
  const segments = pointer
    .slice(1)
    .split("/")
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));

  let current = input;
  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return new PointerResolutionError(`JSON Pointer segment '${segment}' does not resolve to an array index.`);
      }
      current = current[index];
    } else if (isPlainObject(current)) {
      if (!(segment in current)) {
        return new PointerResolutionError(`JSON Pointer segment '${segment}' does not exist.`);
      }
      current = current[segment];
    } else {
      return new PointerResolutionError(`JSON Pointer segment '${segment}' cannot traverse a scalar value.`);
    }
  }
  return current;
}

export class PointerResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PointerResolutionError";
  }
}

function normalizeJsonRecords(input: unknown): JsonObject[] | null {
  if (Array.isArray(input)) {
    return input.every(isPlainObject) ? input : null;
  }
  if (isPlainObject(input)) {
    return [input];
  }
  return null;
}

function isPlainObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
