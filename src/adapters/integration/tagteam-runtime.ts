import type { JsonLdNode, JsonValue, OntologySet, TagTeamOptions, TagTeamRuntime } from "../../kernel/types.js";

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
  parseTraceInclusion?: ParseTraceInclusion;
  onInvocation?: (diagnostics: TagTeamRuntimeInvocationDiagnostics) => void;
}

export type ParseTraceInclusion = "summary" | "full";

export interface TagTeamRuntimeInvocationDiagnostics {
  ontologyOptionPassed: boolean;
  enabledOntologyCount: number;
  compiledOntologyCount: number;
  ontologyContentBytes: number;
  tagTeamOptionKeys: string[];
  parseTraceInclusion: ParseTraceInclusion;
}

export function createTagTeamRuntimeAdapter(
  tagTeam: TagTeamLike,
  adapterOptions: TagTeamRuntimeAdapterOptions = {},
): TagTeamRuntime {
  return {
    version: tagTeam.version ?? adapterOptions.fallbackVersion ?? "unknown",
    buildGraph(sourceText: string, options: TagTeamOptions, ontologySet: OntologySet): JsonLdNode | JsonLdNode[] {
      const parseTraceInclusion = adapterOptions.parseTraceInclusion ?? "summary";
      const result = buildTagTeamOptionsWithDiagnostics(tagTeam, options, ontologySet, adapterOptions.useOntologies !== false, parseTraceInclusion);
      adapterOptions.onInvocation?.(result.diagnostics);
      const tagTeamOptions = result.options;
      const output = tagTeam.buildGraph(sourceText, tagTeamOptions);
      return normalizeTagTeamOutput(output, parseTraceInclusion);
    },
  };
}

export function buildTagTeamOptions(
  tagTeam: TagTeamLike,
  options: TagTeamOptions,
  ontologySet: OntologySet,
  useOntologies: boolean,
): Record<string, unknown> {
  return buildTagTeamOptionsWithDiagnostics(tagTeam, options, ontologySet, useOntologies, "summary").options;
}

export function buildTagTeamOptionsWithDiagnostics(
  tagTeam: TagTeamLike,
  options: TagTeamOptions,
  ontologySet: OntologySet,
  useOntologies: boolean,
  parseTraceInclusion: ParseTraceInclusion = "summary",
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
      parseTraceInclusion,
    },
  };
}

export function normalizeTagTeamOutput(output: unknown, parseTraceInclusion: ParseTraceInclusion = "summary"): JsonLdNode | JsonLdNode[] {
  if (Array.isArray(output)) {
    return output.map((node) => normalizeParseTrace(asJsonLdNode(node), parseTraceInclusion));
  }
  return normalizeParseTrace(asJsonLdNode(output), parseTraceInclusion);
}

function normalizeParseTrace(output: JsonLdNode, parseTraceInclusion: ParseTraceInclusion): JsonLdNode {
  const metadata = output["_metadata"];
  if (!isRecord(metadata)) return output;
  const normalized = structuredClone(output) as JsonLdNode;
  normalized["_metadata"] = summarizeMetadata(metadata) as JsonValue;
  if (parseTraceInclusion === "full") {
    attachParseTrace(normalized, metadata);
  }
  return normalized;
}

function summarizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const summary = structuredClone(metadata) as Record<string, unknown>;
  if (Array.isArray(summary.sentences)) {
    summary.sentences = summary.sentences.map(summarySentence);
  }
  return summary;
}

function summarySentence(sentence: unknown): unknown {
  if (!isRecord(sentence)) return sentence;
  const summary = structuredClone(sentence) as Record<string, unknown>;
  delete summary.tokens;
  delete summary.tags;
  delete summary.arcs;
  delete summary.root;
  return summary;
}

function attachParseTrace(output: JsonLdNode, metadata: Record<string, unknown>): void {
  const graph = output["@graph"];
  if (!Array.isArray(graph)) return;
  const parsingAct = graph.find(isParsingActNode);
  if (isRecord(parsingAct)) {
    parsingAct["tagteam:parseTrace"] = structuredClone(metadata) as JsonValue;
  }
}

function isParsingActNode(node: unknown): node is Record<string, unknown> {
  if (!isRecord(node)) return false;
  if (typeof node["@id"] === "string" && node["@id"].includes("ParsingAct")) return true;
  const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
  return types.some((type) => type === "IntentionalAct") && node["rdfs:label"] === "Semantic parsing act";
}

function compileOntologyTaggers(tagTeam: TagTeamLike, ontologyContents: string[]): unknown {
  const taggers = ontologyContents.map((ttl) => tagTeam.OntologyTextTagger?.fromTTL(ttl));
  const compiled = taggers.filter(isRecord);
  if (compiled.length === 1) return compiled[0];
  return mergeOntologyTaggers(compiled);
}

function mergeOntologyTaggers(taggers: Record<string, unknown>[]): unknown {
  const list = taggers.filter(isRecord);
  return {
    tagText(...args: unknown[]): unknown[] {
      return list.flatMap((tagger) => {
        const fn = tagger.tagText;
        if (typeof fn !== "function") return [];
        const result = fn.apply(tagger, args);
        return Array.isArray(result) ? result : result ? [result] : [];
      });
    },
    getStats(): Record<string, number> {
      return list.reduce<Record<string, number>>((summary, tagger) => {
        const fn = tagger.getStats;
        const stats = typeof fn === "function" ? fn.call(tagger) as Record<string, unknown> : {};
        Object.entries(stats).forEach(([key, value]) => {
          if (typeof value === "number") summary[key] = (summary[key] ?? 0) + value;
        });
        return summary;
      }, { taggerCount: list.length });
    },
    get tagDefinitions(): unknown[] {
      return list.flatMap((tagger) => Array.isArray(tagger.tagDefinitions) ? tagger.tagDefinitions : []);
    },
    get _parseResult(): unknown {
      const children = list.map((tagger) => tagger._parseResult).filter(isRecord);
      if (children.length === 0) return null;
      if (children.length === 1) return children[0];
      return mergedParseResult(children);
    },
    emitClauseAuthorityMatch(...args: unknown[]): unknown {
      const candidates = list
        .map((tagger) => {
          const fn = tagger.emitClauseAuthorityMatch;
          return typeof fn === "function" ? fn.apply(tagger, args) : null;
        })
        .filter((result) => result !== null && result !== undefined);
      if (candidates.length === 0) return null;
      return candidates.sort((a, b) => confidenceOf(b) - confidenceOf(a))[0];
    },
  };
}

function mergedParseResult(children: Record<string, unknown>[]): unknown {
  const callEach = (method: string, args: unknown[], pick: (results: unknown[]) => unknown): unknown => {
    const results: unknown[] = [];
    for (const child of children) {
      const fn = child[method];
      if (typeof fn !== "function") continue;
      results.push(fn.apply(child, args));
    }
    return pick(results);
  };

  return {
    get triples(): unknown[] {
      return children.flatMap((child) => Array.isArray(child.triples) ? child.triples : []);
    },
    getClasses(): unknown[] {
      return callEach("getClasses", [], unionArray) as unknown[];
    },
    getNamedIndividuals(): unknown[] {
      return callEach("getNamedIndividuals", [], unionArray) as unknown[];
    },
    getLabels(subject: unknown): unknown[] {
      return callEach("getLabels", [subject], unionArray) as unknown[];
    },
    getAltLabels(subject: unknown): unknown[] {
      return callEach("getAltLabels", [subject], unionArray) as unknown[];
    },
    getProperty(subject: unknown, predicate: unknown): unknown {
      return callEach("getProperty", [subject, predicate], firstNonNull);
    },
    getProperties(subject: unknown, predicate: unknown): unknown[] {
      return callEach("getProperties", [subject, predicate], unionArray) as unknown[];
    },
    getObjects(subject: unknown, predicate: unknown): unknown[] {
      return callEach("getObjects", [subject, predicate], unionArray) as unknown[];
    },
    isSubclassOf(classIri: unknown, targetIri: unknown): boolean {
      return children.some((child) => {
        const fn = child.isSubclassOf;
        return typeof fn === "function" && fn.call(child, classIri, targetIri) === true;
      });
    },
    resolveIRI(iri: unknown): unknown {
      for (const child of children) {
        const fn = child.resolveIRI;
        if (typeof fn !== "function") continue;
        const resolved = fn.call(child, iri);
        if (resolved && resolved !== iri) return resolved;
      }
      return iri;
    },
  };
}

function unionArray(results: unknown[]): unknown[] {
  const out: unknown[] = [];
  const seen = new Set<string>();
  for (const result of results) {
    if (!Array.isArray(result)) continue;
    for (const item of result) {
      const key = unionKey(item);
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      out.push(item);
    }
  }
  return out;
}

function unionKey(item: unknown): string | null {
  if (typeof item === "string") return `string:${item}`;
  if (isRecord(item)) {
    const id = item.id ?? item["@id"];
    const type = item.type ?? item["@type"];
    if (typeof id === "string") return `object:${id}|${typeof type === "string" ? type : ""}`;
  }
  return null;
}

function firstNonNull(results: unknown[]): unknown {
  return results.find((result) => result !== null && result !== undefined && result !== "") ?? null;
}

function confidenceOf(value: unknown): number {
  if (!isRecord(value)) return 0;
  const confidence = value.matchConfidence ?? value.ontologyMatchConfidence ?? value.confidence;
  return typeof confidence === "number" ? confidence : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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
