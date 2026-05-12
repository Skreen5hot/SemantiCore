import type { ContextManifest, JsonLdNode, JsonObject, JsonValue } from "./types.js";
import { CORE_CONTEXT, SC } from "./vocabulary.js";

export interface TermResolver {
  expandTerm(term: string): string | null;
  termKnown(term: string): boolean;
}

type ContextMap = Record<string, JsonValue | undefined>;

const ABSOLUTE_IRI = /^[a-z][a-z0-9+.-]*:/i;

export function createTermResolver(
  contextManifest: ContextManifest,
  additionalContexts: JsonValue[] = [],
): TermResolver {
  const contextMaps: ContextMap[] = [CORE_CONTEXT as unknown as ContextMap];

  for (const context of additionalContexts) {
    collectContextMaps(context, contextMaps);
  }

  const localContexts = contextManifest["sc:contexts"] ?? contextManifest.contexts ?? [];
  for (const localContext of localContexts) {
    collectContextMaps(localContext["sc:contextDocument"]["@context"], contextMaps);
  }

  function expandTerm(term: string): string | null {
    if (isAbsoluteIri(term)) {
      const [prefix, suffix] = splitCompactIri(term);
      if (!prefix || prefix === "urn" || prefix === "http" || prefix === "https") {
        return term;
      }
    }

    for (let i = contextMaps.length - 1; i >= 0; i--) {
      const expanded = expandFromContext(term, contextMaps[i], contextMaps);
      if (expanded) {
        return expanded;
      }
    }

    const [prefix, suffix] = splitCompactIri(term);
    if (prefix && suffix) {
      for (let i = contextMaps.length - 1; i >= 0; i--) {
        const prefixValue = contextMaps[i][prefix];
        if (typeof prefixValue === "string") {
          return prefixValue + suffix;
        }
        if (isJsonObject(prefixValue) && typeof prefixValue["@id"] === "string") {
          return prefixValue["@id"] + suffix;
        }
      }
    }

    return isAbsoluteIri(term) ? term : null;
  }

  return {
    expandTerm,
    termKnown(term: string): boolean {
      return expandTerm(term) !== null;
    },
  };
}

export function collectNodeContexts(node: JsonLdNode): JsonValue[] {
  const contexts: JsonValue[] = [];
  if (node["@context"] !== undefined) {
    contexts.push(node["@context"]);
  }
  return contexts;
}

export function propertyMatches(key: string, propertyIri: string, resolver: TermResolver): boolean {
  if (key.startsWith("@")) {
    return false;
  }
  return resolver.expandTerm(key) === propertyIri;
}

function collectContextMaps(context: JsonValue | undefined, maps: ContextMap[]): void {
  if (context === undefined || context === null) {
    return;
  }
  if (Array.isArray(context)) {
    for (const item of context) {
      collectContextMaps(item, maps);
    }
    return;
  }
  if (typeof context === "object") {
    maps.push(context as ContextMap);
  }
}

function expandFromContext(
  term: string,
  context: ContextMap,
  allContexts: ContextMap[],
): string | null {
  const value = context[term];
  if (typeof value === "string") {
    return expandContextValue(value, allContexts);
  }
  if (isJsonObject(value) && typeof value["@id"] === "string") {
    return expandContextValue(value["@id"], allContexts);
  }
  return null;
}

function expandContextValue(value: string, allContexts: ContextMap[]): string {
  const [prefix, suffix] = splitCompactIri(value);
  if (!prefix || !suffix || prefix === "urn" || prefix === "http" || prefix === "https") {
    return value;
  }
  for (let i = allContexts.length - 1; i >= 0; i--) {
    const prefixValue = allContexts[i][prefix];
    if (typeof prefixValue === "string") {
      return prefixValue + suffix;
    }
  }
  if (prefix === "sc") {
    return SC + suffix;
  }
  return value;
}

function splitCompactIri(term: string): [string | null, string | null] {
  const index = term.indexOf(":");
  if (index <= 0 || index === term.length - 1) {
    return [null, null];
  }
  return [term.slice(0, index), term.slice(index + 1)];
}

function isAbsoluteIri(value: string): boolean {
  return ABSOLUTE_IRI.test(value);
}

function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
