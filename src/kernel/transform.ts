import { enrichRecord } from "./enrich.js";
import type { JsonLdNode, TagTeamRuntime, TransformInput } from "./types.js";
import { CORE_CONTEXT } from "./vocabulary.js";

export interface TransformResult extends JsonLdNode {
  "@type": "sc:TransformResult";
  "sc:record": JsonLdNode;
  "sc:graph": JsonLdNode | JsonLdNode[] | null;
  "sc:warnings": JsonLdNode[];
}

export interface TransformError extends JsonLdNode {
  "@type": "sc:Error";
  "sc:code": { "@id": string };
  "sc:message": string;
  "sc:recoverable": false;
}

export function transform(input: unknown): TransformResult | TransformError {
  if (!isTransformInput(input)) {
    return makeError("sc:UnsupportedInputShape", "Input must be a SemantiCore transform fixture.");
  }

  const runtime: TagTeamRuntime = {
    version: input["sc:configuration"]["sc:requiredTagTeamVersion"],
    buildGraph(): JsonLdNode | JsonLdNode[] {
      return input["sc:tagTeamFixtureGraph"] ?? [];
    },
  };

  const result = enrichRecord(
    input["sc:record"],
    input["sc:configuration"],
    input["sc:contextManifest"],
    input["sc:ontologySet"],
    runtime,
  );

  return {
    "@context": CORE_CONTEXT,
    "@id": "urn:semanticore:transform-result:example",
    "@type": "sc:TransformResult",
    "sc:record": result.record,
    "sc:graph": result.graph,
    "sc:warnings": result.warnings,
  };
}

function makeError(code: string, message: string): TransformError {
  return {
    "@context": CORE_CONTEXT,
    "@id": `urn:semanticore:error:${code.replace(/[^A-Za-z0-9]+/g, "-")}`,
    "@type": "sc:Error",
    "sc:code": { "@id": code },
    "sc:message": message,
    "sc:recoverable": false,
  };
}

function isTransformInput(input: unknown): input is TransformInput {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return false;
  }
  const doc = input as Partial<TransformInput>;
  return Boolean(
    doc["@context"] &&
      doc["sc:record"] &&
      doc["sc:configuration"] &&
      doc["sc:contextManifest"] &&
      doc["sc:ontologySet"],
  );
}
