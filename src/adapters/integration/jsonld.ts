import type { AdapterResult } from "./types.js";
import type { SemantiCoreDataset, SourceRecord } from "../../kernel/index.js";
import { makeWarning } from "../../kernel/warnings.js";

export function jsonLdToDataset(input: unknown): AdapterResult<SemantiCoreDataset> {
  if (!isDataset(input)) {
    return {
      value: null,
      warnings: [
        makeWarning({
          code: "sc:UnsupportedInputShape",
          message: "JSON-LD input must be a sc:Dataset with sc:records.",
        }),
      ],
    };
  }

  const invalidRecord = input["sc:records"].find((record) => !hasStableRecordId(record));
  if (invalidRecord) {
    return {
      value: null,
      warnings: [
        makeWarning({
          code: "sc:UnsupportedInputShape",
          message: "JSON-LD dataset records must have stable non-blank @id values.",
        }),
      ],
    };
  }

  return {
    value: structuredClone(input) as SemantiCoreDataset,
    warnings: [],
  };
}

function isDataset(input: unknown): input is SemantiCoreDataset {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return false;
  }
  const candidate = input as Partial<SemantiCoreDataset>;
  return candidate["@type"] === "sc:Dataset" && Array.isArray(candidate["sc:records"]);
}

function hasStableRecordId(record: SourceRecord): boolean {
  return typeof record["@id"] === "string" && record["@id"].length > 0 && !record["@id"].startsWith("_:");
}
