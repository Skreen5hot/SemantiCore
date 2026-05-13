import type { JsonLdNode, OntologySet, TagTeamOptions, TagTeamRuntime } from "../../kernel/types.js";

export interface TagTeamLike {
  version?: string;
  buildGraph(sourceText: string, options?: Record<string, unknown>): unknown;
  OntologyTextTagger?: {
    fromTTL(content: string, options?: Record<string, unknown>): unknown;
  };
}

export interface TagTeamRuntimeAdapterOptions {
  fallbackVersion?: string;
  useOntologies?: boolean;
}

export function createTagTeamRuntimeAdapter(
  tagTeam: TagTeamLike,
  adapterOptions: TagTeamRuntimeAdapterOptions = {},
): TagTeamRuntime {
  return {
    version: tagTeam.version ?? adapterOptions.fallbackVersion ?? "unknown",
    buildGraph(sourceText: string, options: TagTeamOptions, ontologySet: OntologySet): JsonLdNode | JsonLdNode[] {
      const tagTeamOptions = buildTagTeamOptions(tagTeam, options, ontologySet, adapterOptions.useOntologies !== false);
      const output = tagTeam.buildGraph(sourceText, tagTeamOptions);
      return normalizeTagTeamOutput(output);
    },
  };
}

export function buildTagTeamOptions(
  tagTeam: TagTeamLike,
  options: TagTeamOptions,
  ontologySet: OntologySet,
  useOntologies: boolean,
): Record<string, unknown> {
  const tagTeamOptions: Record<string, unknown> = {
    ontologyThreshold: options["sc:ontologyThreshold"] ?? 0,
    verbose: options["sc:verbose"] ?? false,
  };

  const ontologyContent = useOntologies ? enabledOntologyContent(ontologySet) : "";
  if (ontologyContent && tagTeam.OntologyTextTagger?.fromTTL) {
    tagTeamOptions.ontology = tagTeam.OntologyTextTagger.fromTTL(ontologyContent, tagTeamOptions);
  }

  return tagTeamOptions;
}

export function normalizeTagTeamOutput(output: unknown): JsonLdNode | JsonLdNode[] {
  if (Array.isArray(output)) {
    return output.map((node) => asJsonLdNode(node));
  }
  return asJsonLdNode(output);
}

function enabledOntologyContent(ontologySet: OntologySet): string {
  const ontologies = ontologySet["sc:ontologies"] ?? ontologySet.ontologies ?? [];
  return ontologies
    .filter((ontology) => ontology["sc:enabled"] !== false)
    .map((ontology) => ontology["sc:content"])
    .filter((content): content is string => typeof content === "string" && content.trim().length > 0)
    .join("\n\n");
}

function asJsonLdNode(value: unknown): JsonLdNode {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return structuredClone(value) as JsonLdNode;
  }
  throw new Error("TagTeam buildGraph returned an unsupported JSON-LD shape.");
}
