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
  onInvocation?: (diagnostics: TagTeamRuntimeInvocationDiagnostics) => void;
}

export interface TagTeamRuntimeInvocationDiagnostics {
  ontologyOptionPassed: boolean;
  enabledOntologyCount: number;
  compiledOntologyCount: number;
  ontologyContentBytes: number;
  tagTeamOptionKeys: string[];
}

export function createTagTeamRuntimeAdapter(
  tagTeam: TagTeamLike,
  adapterOptions: TagTeamRuntimeAdapterOptions = {},
): TagTeamRuntime {
  return {
    version: tagTeam.version ?? adapterOptions.fallbackVersion ?? "unknown",
    buildGraph(sourceText: string, options: TagTeamOptions, ontologySet: OntologySet): JsonLdNode | JsonLdNode[] {
      const result = buildTagTeamOptionsWithDiagnostics(tagTeam, options, ontologySet, adapterOptions.useOntologies !== false);
      adapterOptions.onInvocation?.(result.diagnostics);
      const tagTeamOptions = result.options;
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
  return buildTagTeamOptionsWithDiagnostics(tagTeam, options, ontologySet, useOntologies).options;
}

export function buildTagTeamOptionsWithDiagnostics(
  tagTeam: TagTeamLike,
  options: TagTeamOptions,
  ontologySet: OntologySet,
  useOntologies: boolean,
): { options: Record<string, unknown>; diagnostics: TagTeamRuntimeInvocationDiagnostics } {
  const tagTeamOptions: Record<string, unknown> = {
    ontologyThreshold: options["sc:ontologyThreshold"] ?? 0,
    verbose: options["sc:verbose"] ?? false,
  };
  for (const key of ["context", "extractEntities", "extractActs", "detectRoles", "useLegacy"]) {
    if (Object.prototype.hasOwnProperty.call(options, key)) {
      tagTeamOptions[key] = options[key];
    }
  }

  const ontologyContents = useOntologies ? enabledOntologyContents(ontologySet) : [];
  if (ontologyContents.length > 0 && tagTeam.OntologyTextTagger?.fromTTL) {
    tagTeamOptions.ontology = compileOntologyTaggers(tagTeam, ontologyContents);
  }

  return {
    options: tagTeamOptions,
    diagnostics: {
      ontologyOptionPassed: Boolean(tagTeamOptions.ontology),
      enabledOntologyCount: ontologyContents.length,
      compiledOntologyCount: Boolean(tagTeamOptions.ontology) ? ontologyContents.length : 0,
      ontologyContentBytes: ontologyContents.reduce((total, content) => total + new TextEncoder().encode(content).length, 0),
      tagTeamOptionKeys: Object.keys(tagTeamOptions).sort(),
    },
  };
}

export function normalizeTagTeamOutput(output: unknown): JsonLdNode | JsonLdNode[] {
  if (Array.isArray(output)) {
    return output.map((node) => asJsonLdNode(node));
  }
  return asJsonLdNode(output);
}

function compileOntologyTaggers(tagTeam: TagTeamLike, ontologyContents: string[]): unknown {
  const taggers = ontologyContents.map((ttl) => tagTeam.OntologyTextTagger?.fromTTL(ttl));
  const compiled = taggers.filter((tagger): tagger is NonNullable<typeof tagger> => tagger !== undefined);
  if (compiled.length === 1) return compiled[0];
  return mergeOntologyTaggers(compiled);
}

function mergeOntologyTaggers(taggers: unknown[]): unknown {
  return {
    tagText(...args: unknown[]): unknown[] {
      return taggers.flatMap((tagger) => {
        const candidate = tagger as { tagText?: (...values: unknown[]) => unknown };
        if (typeof candidate.tagText !== "function") return [];
        const result = candidate.tagText(...args);
        return Array.isArray(result) ? result : result ? [result] : [];
      });
    },
    getStats(): Record<string, number> {
      return taggers.reduce<Record<string, number>>((summary, tagger) => {
        const candidate = tagger as { getStats?: () => Record<string, unknown> };
        const stats = typeof candidate.getStats === "function" ? candidate.getStats() : {};
        Object.entries(stats).forEach(([key, value]) => {
          if (typeof value === "number") summary[key] = (summary[key] ?? 0) + value;
        });
        return summary;
      }, { taggerCount: taggers.length });
    },
    emitClauseAuthorityMatch(...args: unknown[]): unknown[] {
      return taggers.flatMap((tagger) => {
        const candidate = tagger as { emitClauseAuthorityMatch?: (...values: unknown[]) => unknown };
        if (typeof candidate.emitClauseAuthorityMatch !== "function") return [];
        const result = candidate.emitClauseAuthorityMatch(...args);
        return Array.isArray(result) ? result : result ? [result] : [];
      });
    },
  };
}

function enabledOntologyContents(ontologySet: OntologySet): string[] {
  const ontologies = ontologySet["sc:ontologies"] ?? ontologySet.ontologies ?? [];
  return ontologies
    .filter((ontology) => ontology["sc:enabled"] !== false)
    .map((ontology) => ontology["sc:content"])
    .filter((content): content is string => typeof content === "string" && content.trim().length > 0)
    .map((content) => content.trim());
}

function asJsonLdNode(value: unknown): JsonLdNode {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return structuredClone(value) as JsonLdNode;
  }
  throw new Error("TagTeam buildGraph returned an unsupported JSON-LD shape.");
}
