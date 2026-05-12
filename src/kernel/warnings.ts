import type { JsonObject, WarningResource } from "./types.js";
import { CORE_CONTEXT, iri } from "./vocabulary.js";

export interface WarningInput {
  code: string;
  message: string;
  recordId?: string;
  recoverable?: boolean;
  pathIndex?: number;
  pathTerm?: string;
  extra?: JsonObject;
}

export function makeWarning(input: WarningInput): WarningResource {
  const idRecord = input.recordId ? stableFragment(input.recordId) : "global";
  const idCode = stableFragment(input.code);
  const idMessage = stableFragment(input.message).slice(0, 80) || "warning";
  const warning: WarningResource = {
    "@context": CORE_CONTEXT,
    "@id": `urn:semanticore:warning:${idRecord}:${idCode}:${idMessage}`,
    "@type": "sc:Warning",
    "sc:code": iri(input.code),
    "sc:message": input.message,
    "sc:recoverable": input.recoverable ?? true,
  };

  if (input.recordId) {
    warning["sc:record"] = iri(input.recordId);
  }
  if (input.pathIndex !== undefined) {
    warning["sc:pathIndex"] = input.pathIndex;
  }
  if (input.pathTerm) {
    warning["sc:pathTerm"] = iri(input.pathTerm);
  }
  if (input.extra) {
    Object.assign(warning, input.extra);
  }

  return warning;
}

export function stableFragment(value: string): string {
  return value.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "id";
}
