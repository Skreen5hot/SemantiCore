import type {
  JsonLdNode,
  JsonObject,
  JsonValue,
  LanguagePolicy,
  PropertyPath,
  WarningResource,
} from "./types.js";
import { propertyMatches, type TermResolver } from "./context.js";
import { iri, LanguagePolicyIri, MultiValuePolicy, WarningCode } from "./vocabulary.js";
import { makeWarning } from "./warnings.js";
import { stableStringify } from "./canonicalize.js";

export interface SourceTextCandidate {
  text: string;
  language?: string;
}

export interface SourceTextResolution {
  candidates: SourceTextCandidate[];
  warnings: WarningResource[];
}

type TraversedValue = JsonValue | undefined;

export function resolveSourceTexts(
  record: JsonLdNode,
  propertyPath: PropertyPath,
  resolver: TermResolver,
): SourceTextResolution {
  const warnings: WarningResource[] = [];
  const path = propertyPath["sc:path"] ?? [];
  const recordId = record["@id"] ?? "urn:semanticore:record:unknown";

  const expandedPath: string[] = [];
  for (let index = 0; index < path.length; index++) {
    const term = path[index]?.["@id"];
    const expanded = term ? resolver.expandTerm(term) : null;
    if (!term || !expanded) {
      warnings.push(
        makeWarning({
          code: WarningCode.ContextResolutionError,
          message: "A property path term could not be resolved from the local context manifest.",
          recordId,
          pathIndex: index,
          pathTerm: term,
        }),
      );
      return { candidates: [], warnings };
    }
    expandedPath.push(expanded);
  }

  let current: TraversedValue[] = [record as JsonValue];
  for (let index = 0; index < expandedPath.length; index++) {
    const propertyIri = expandedPath[index];
    const next: TraversedValue[] = [];

    for (const value of current) {
      if (isJsonObject(value)) {
        next.push(...valuesForProperty(value, propertyIri, resolver));
      }
    }

    if (next.length === 0) {
      warnings.push(
        makeWarning({
          code: WarningCode.MissingSourceText,
          message: "No string value was found at the configured source property path.",
          recordId,
          pathIndex: index,
          pathTerm: path[index]?.["@id"],
        }),
      );
      return { candidates: [], warnings };
    }

    current = index === expandedPath.length - 1 ? sortValues(next) : flattenContainers(next);
  }

  return applyTerminalPolicies(current, propertyPath, recordId, warnings);
}

function applyTerminalPolicies(
  values: TraversedValue[],
  propertyPath: PropertyPath,
  recordId: string,
  warnings: WarningResource[],
): SourceTextResolution {
  const candidates: SourceTextCandidate[] = [];

  for (const value of values) {
    const literal = asEligibleLiteral(value, propertyPath, recordId, warnings);
    if (literal) {
      if (literal.text.trim().length === 0) {
        warnings.push(
          makeWarning({
            code: WarningCode.EmptySourceText,
            message: "The configured source property path resolved to an empty string.",
            recordId,
          }),
        );
      } else {
        candidates.push(literal);
      }
    }
  }

  if (candidates.length === 0 && warnings.length === 0) {
    warnings.push(
      makeWarning({
        code: WarningCode.MissingSourceText,
        message: "No eligible string value was found at the configured source property path.",
        recordId,
      }),
    );
  }

  const policy = propertyPath["sc:multiValuePolicy"]?.["@id"] ?? MultiValuePolicy.EnrichEachValue;
  if (candidates.length <= 1 || policy === MultiValuePolicy.EnrichEachValue) {
    return { candidates, warnings };
  }

  warnings.push(
    makeWarning({
      code: WarningCode.MultipleSourceValues,
      message: "The configured source property path resolved to multiple string values.",
      recordId,
    }),
  );

  if (policy === MultiValuePolicy.ErrorOnMultipleValues) {
    return { candidates: [], warnings };
  }

  if (policy === MultiValuePolicy.FirstCanonicalValue) {
    return { candidates: [sortCandidates(candidates)[0]], warnings };
  }

  const separator = propertyPath["sc:joinSeparator"] ?? "\n";
  return {
    candidates: [{ text: sortCandidates(candidates).map((candidate) => candidate.text).join(separator) }],
    warnings,
  };
}

function asEligibleLiteral(
  value: TraversedValue,
  propertyPath: PropertyPath,
  recordId: string,
  warnings: WarningResource[],
): SourceTextCandidate | null {
  if (typeof value === "string") {
    return { text: value };
  }

  if (isJsonObject(value)) {
    if (typeof value["@value"] === "string") {
      const language = typeof value["@language"] === "string" ? value["@language"] : undefined;
      if (language && !languageAccepted(language, propertyPath["sc:languagePolicy"])) {
        warnings.push(
          makeWarning({
            code: WarningCode.UnsupportedLanguageLiteral,
            message: `Language-tagged literal '${language}' is not accepted by the configured language policy.`,
            recordId,
          }),
        );
        return null;
      }
      return { text: value["@value"], language };
    }

    if (typeof value["@id"] === "string") {
      warnings.push(
        makeWarning({
          code: WarningCode.NodeSourceValue,
          message: "The configured source property path resolved to a node reference.",
          recordId,
        }),
      );
      return null;
    }

    warnings.push(
      makeWarning({
        code: WarningCode.NodeSourceValue,
        message: "The configured source property path resolved to an embedded node.",
        recordId,
      }),
    );
    return null;
  }

  warnings.push(
    makeWarning({
      code: WarningCode.NonStringSourceValue,
      message: "The configured source property path resolved to a non-string value.",
      recordId,
    }),
  );
  return null;
}

function languageAccepted(language: string, policy: PropertyPath["sc:languagePolicy"]): boolean {
  if (!policy) {
    return true;
  }
  if ("@id" in policy) {
    return policy["@id"] === LanguagePolicyIri.AcceptAllLanguages;
  }

  const languagePolicy = policy as LanguagePolicy;
  const accepted = languagePolicy["sc:acceptedLanguage"];
  const acceptedLanguages = Array.isArray(accepted) ? accepted : accepted ? [accepted] : [];
  if (acceptedLanguages.length === 0) {
    return true;
  }
  return acceptedLanguages.some((acceptedLanguage) => bcp47BasicMatch(language, acceptedLanguage));
}

function bcp47BasicMatch(language: string, range: string): boolean {
  const normalizedLanguage = language.toLowerCase();
  const normalizedRange = range.toLowerCase();
  return normalizedLanguage === normalizedRange || normalizedLanguage.startsWith(`${normalizedRange}-`);
}

function valuesForProperty(
  node: JsonObject,
  propertyIri: string,
  resolver: TermResolver,
): TraversedValue[] {
  const values: TraversedValue[] = [];
  for (const key of Object.keys(node).sort()) {
    if (propertyMatches(key, propertyIri, resolver)) {
      values.push(...asArray(node[key]));
    }
  }
  return flattenContainers(values);
}

function flattenContainers(values: TraversedValue[]): TraversedValue[] {
  const flattened: TraversedValue[] = [];
  for (const value of values) {
    if (isJsonObject(value) && Array.isArray(value["@list"])) {
      flattened.push(...value["@list"]);
    } else if (isJsonObject(value) && Array.isArray(value["@set"])) {
      flattened.push(...sortValues(value["@set"]));
    } else {
      flattened.push(value);
    }
  }
  return flattened;
}

function asArray(value: JsonValue | undefined): TraversedValue[] {
  return Array.isArray(value) ? value : [value];
}

function sortValues(values: TraversedValue[]): TraversedValue[] {
  return [...values].sort((a, b) => stableStringify(a).localeCompare(stableStringify(b)));
}

function sortCandidates(candidates: SourceTextCandidate[]): SourceTextCandidate[] {
  return [...candidates].sort((a, b) => stableStringify(a).localeCompare(stableStringify(b)));
}

function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
