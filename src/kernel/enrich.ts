import { collectNodeContexts, createTermResolver } from "./context.js";
import { resolveSourceTexts } from "./path.js";
import type {
  EnrichRecordResult,
  EnrichmentConfiguration,
  JsonLdNode,
  NamedGraph,
  OntologySet,
  SourceRecord,
  TagTeamEnrichment,
  TagTeamRuntime,
  WarningResource,
  ContextManifest,
} from "./types.js";
import { CORE_CONTEXT, iri, Status, TAGTEAM_GRAPH_CONTEXT, WarningCode } from "./vocabulary.js";
import { evaluateTagTeamVersion } from "./version.js";
import { makeWarning, stableFragment } from "./warnings.js";

export function enrichRecord(
  record: SourceRecord,
  configuration: EnrichmentConfiguration,
  contextManifest: ContextManifest,
  ontologySet: OntologySet,
  tagTeamRuntime: TagTeamRuntime,
): EnrichRecordResult {
  const recordId = record["@id"];
  const warnings: WarningResource[] = [];
  const enrichedRecord = cloneRecord(record);
  const propertyPath = configuration["sc:sourcePropertyPath"];
  const graphResults: NamedGraph[] = [];
  const enrichments: TagTeamEnrichment[] = [];

  warnings.push(...ontologyAlignmentWarnings(ontologySet, recordId));

  const versionDecision = evaluateTagTeamVersion(configuration, tagTeamRuntime.version, recordId);
  warnings.push(...versionDecision.warnings);
  if (!versionDecision.canRun) {
    enrichments.push(
      makeEnrichment({
        recordId,
        index: 0,
        sourceText: undefined,
        propertyPath,
        tagTeamVersion: tagTeamRuntime.version,
        status: Status.Failed,
      }),
    );
    attachEnrichments(enrichedRecord, enrichments);
    return { record: enrichedRecord, graph: null, warnings: sortWarnings(warnings) };
  }

  const resolver = createTermResolver(contextManifest, [
    ...collectNodeContexts(record),
    ...collectNodeContexts(configuration),
  ]);
  const textResolution = resolveSourceTexts(record, propertyPath, resolver);
  warnings.push(...textResolution.warnings);

  if (textResolution.candidates.length === 0) {
    enrichments.push(
      makeEnrichment({
        recordId,
        index: 0,
        sourceText: undefined,
        propertyPath,
        tagTeamVersion: tagTeamRuntime.version,
        status: Status.Skipped,
      }),
    );
    attachEnrichments(enrichedRecord, enrichments);
    return { record: enrichedRecord, graph: null, warnings: sortWarnings(warnings) };
  }

  const options = configuration["sc:tagTeamOptions"] ?? {
    "@type": "sc:TagTeamOptions",
    "sc:ontologyThreshold": 0,
    "sc:verbose": false,
  };

  for (let index = 0; index < textResolution.candidates.length; index++) {
    const candidate = textResolution.candidates[index];
    try {
      const tagTeamOutput = tagTeamRuntime.buildGraph(candidate.text, options, ontologySet);
      const graph = makeNamedGraph(recordId, index, tagTeamOutput);
      graphResults.push(graph);
      enrichments.push(
        makeEnrichment({
          recordId,
          index,
          sourceText: candidate.text,
          propertyPath,
          tagTeamVersion: tagTeamRuntime.version,
          status: Status.Succeeded,
          graphId: graph["@id"],
          summary: summarizeGraph(graph),
        }),
      );
    } catch (error) {
      warnings.push(
        makeWarning({
          code: WarningCode.TagTeamRuntimeError,
          message: error instanceof Error ? error.message : String(error),
          recordId,
        }),
      );
      enrichments.push(
        makeEnrichment({
          recordId,
          index,
          sourceText: candidate.text,
          propertyPath,
          tagTeamVersion: tagTeamRuntime.version,
          status: Status.Failed,
        }),
      );
    }
  }

  attachEnrichments(enrichedRecord, enrichments);

  return {
    record: enrichedRecord,
    graph: graphResults.length === 0 ? null : graphResults.length === 1 ? graphResults[0] : graphResults,
    warnings: sortWarnings(warnings),
  };
}

interface EnrichmentInput {
  recordId: string;
  index: number;
  sourceText: string | undefined;
  propertyPath: EnrichmentConfiguration["sc:sourcePropertyPath"];
  tagTeamVersion: string;
  status: string;
  graphId?: string;
  summary?: TagTeamEnrichment["sc:summary"];
}

function makeEnrichment(input: EnrichmentInput): TagTeamEnrichment {
  const enrichment: TagTeamEnrichment = {
    "@context": CORE_CONTEXT,
    "@id": `urn:semanticore:enrichment:${stableFragment(input.recordId)}:${input.index}`,
    "@type": "sc:TagTeamEnrichment",
    "sc:status": iri(input.status),
    "sc:sourcePropertyPath": input.propertyPath,
    "sc:tagTeamVersion": input.tagTeamVersion,
  };
  if (input.sourceText !== undefined) {
    enrichment["sc:sourceText"] = input.sourceText;
  }
  if (input.graphId) {
    enrichment["sc:namedGraph"] = iri(input.graphId);
  }
  if (input.summary) {
    enrichment["sc:summary"] = input.summary;
  }
  return enrichment;
}

function makeNamedGraph(recordId: string, index: number, tagTeamOutput: JsonLdNode | JsonLdNode[]): NamedGraph {
  const graph: NamedGraph = {
    "@context": graphContextFor(tagTeamOutput),
    "@id": graphIdForRecord(recordId, index),
    "@type": ["sc:TagTeamGraph"],
    "sc:graphForRecord": iri(recordId),
    "sc:graphIndex": index,
    "@graph": extractGraphNodes(tagTeamOutput),
  };
  const metadata = extractTagTeamMetadata(tagTeamOutput);
  if (metadata !== undefined) {
    graph["sc:tagTeamMetadata"] = metadata;
  }
  return graph;
}

function graphIdForRecord(recordId: string, index: number): string {
  const prefix = "urn:semanticore:record:";
  const fragment = recordId.startsWith(prefix) ? recordId.slice(prefix.length) : stableFragment(recordId);
  return index === 0 ? `urn:semanticore:graph:${fragment}` : `urn:semanticore:graph:${fragment}:${index}`;
}

function graphContextFor(tagTeamOutput: JsonLdNode | JsonLdNode[]): NamedGraph["@context"] {
  if (!Array.isArray(tagTeamOutput) && tagTeamOutput["@context"] !== undefined) {
    return [TAGTEAM_GRAPH_CONTEXT, structuredClone(tagTeamOutput["@context"])] as NamedGraph["@context"];
  }
  return TAGTEAM_GRAPH_CONTEXT;
}

function extractGraphNodes(tagTeamOutput: JsonLdNode | JsonLdNode[]): JsonLdNode[] {
  if (Array.isArray(tagTeamOutput)) {
    return tagTeamOutput.map((node) => cloneNode(node));
  }
  if (Array.isArray(tagTeamOutput["@graph"])) {
    return tagTeamOutput["@graph"].filter(isJsonLdNode).map((node) => cloneNode(node));
  }
  return [cloneNode(tagTeamOutput)];
}

function extractTagTeamMetadata(tagTeamOutput: JsonLdNode | JsonLdNode[]): JsonLdNode["sc:tagTeamMetadata"] | undefined {
  if (Array.isArray(tagTeamOutput)) return undefined;
  const metadata = tagTeamOutput["_metadata"];
  if (metadata !== null && typeof metadata === "object") {
    return structuredClone(metadata) as JsonLdNode["sc:tagTeamMetadata"];
  }
  return undefined;
}

function summarizeGraph(graph: NamedGraph): TagTeamEnrichment["sc:summary"] {
  const metadata = graph["sc:tagTeamMetadata"];
  if (metadata !== null && typeof metadata === "object" && !Array.isArray(metadata)) {
    return {
      "@type": "sc:TagTeamSummary",
      "sc:entityCount": numericMetadata(metadata, "entities") ?? countEntityNodes(graph),
      "sc:actCount": numericMetadata(metadata, "acts") ?? countActNodes(graph),
      "sc:roleCount": numericMetadata(metadata, "roles") ?? countRoleNodes(graph),
      "sc:deonticDetected": graph["@graph"].some(hasDeonticSignal),
    };
  }
  return {
    "@type": "sc:TagTeamSummary",
    "sc:entityCount": countEntityNodes(graph),
    "sc:actCount": countActNodes(graph),
    "sc:roleCount": countRoleNodes(graph),
    "sc:deonticDetected": graph["@graph"].some(hasDeonticSignal),
  };
}

function countEntityNodes(graph: NamedGraph): number {
  let entityCount = 0;
  for (const node of graph["@graph"]) {
    const types = collectTypes(node);
    if (types.some(isEntityType)) {
      entityCount++;
    }
  }
  return entityCount;
}

function countActNodes(graph: NamedGraph): number {
  let actCount = 0;
  for (const node of graph["@graph"]) {
    const types = collectTypes(node);
    if (types.some(isActType)) {
      actCount++;
    }
  }
  return actCount;
}

function countRoleNodes(graph: NamedGraph): number {
  let roleCount = 0;
  for (const node of graph["@graph"]) {
    const types = collectTypes(node);
    if (types.some(isRoleType)) {
      roleCount++;
    }
  }
  return roleCount;
}

function isEntityType(type: string): boolean {
  return [
    "tagteam:Entity",
    "Entity",
    "Organization",
    "Person",
    "Agent",
    "MaterialEntity",
    "IndependentContinuant",
    "cco:Agent",
    "cco:Person",
    "obo:BFO_0000040",
  ].includes(type);
}

function isActType(type: string): boolean {
  return [
    "tagteam:Act",
    "tagteam:VerbPhrase",
    "IntentionalAct",
    "ActSpecification",
    "Process",
    "bfo:Process",
    "obo:BFO_0000015",
  ].includes(type);
}

function isRoleType(type: string): boolean {
  return type === "Role" || type === "cco:Role" || type === "obo:BFO_0000023" || type.endsWith("Role");
}

function hasDeonticSignal(node: JsonLdNode): boolean {
  const types = collectTypes(node);
  return types.some((type) => type.includes("Deontic")) || node["tagteam:deontic"] === true || node["tagteam:deonticCategory"] !== undefined;
}

function numericMetadata(metadata: Record<string, unknown>, key: string): number | undefined {
  const value = metadata[key];
  return typeof value === "number" ? value : undefined;
}

function collectTypes(node: JsonLdNode): string[] {
  const raw = node["@type"];
  if (typeof raw === "string") {
    return [raw];
  }
  if (Array.isArray(raw)) {
    return raw.filter((value): value is string => typeof value === "string");
  }
  return [];
}

function attachEnrichments(record: SourceRecord, enrichments: TagTeamEnrichment[]): void {
  const types = new Set<string>();
  const existingType = record["@type"];
  if (typeof existingType === "string") {
    types.add(existingType);
  } else if (Array.isArray(existingType)) {
    for (const value of existingType) {
      if (typeof value === "string") {
        types.add(value);
      }
    }
  }
  types.add("sc:EnrichedRecord");
  record["@type"] = [...types].sort();
  record["sc:semanticEnrichment"] = enrichments.length === 1 ? enrichments[0] : enrichments;
}

function ontologyAlignmentWarnings(ontologySet: OntologySet, recordId: string): WarningResource[] {
  const ontologies = ontologySet["sc:ontologies"] ?? ontologySet.ontologies ?? [];
  return ontologies
    .filter((ontology) => ontology["sc:ontologyAlignment"]?.["@id"] !== "sc:CCO2BFO2020Aligned")
    .map((ontology) =>
      makeWarning({
        code: WarningCode.NonCCOAlignedOntology,
        message: `Ontology ${ontology["@id"]} is not declared as CCO 2.0 / BFO 2020 aligned.`,
        recordId,
        extra: { "sc:ontology": iri(ontology["@id"]) },
      }),
    );
}

function sortWarnings(warnings: WarningResource[]): WarningResource[] {
  return [...warnings].sort((a, b) => a["@id"].localeCompare(b["@id"]));
}

function cloneRecord(record: SourceRecord): SourceRecord {
  return structuredClone(record) as SourceRecord;
}

function cloneNode(node: JsonLdNode): JsonLdNode {
  return structuredClone(node) as JsonLdNode;
}

function isJsonLdNode(value: unknown): value is JsonLdNode {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
