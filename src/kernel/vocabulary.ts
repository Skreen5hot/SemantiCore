export const SC = "https://semanticore.fandaws.org/ns/";
export const TAGTEAM = "https://tagteam.fandaws.org/ontology/";
export const SC_PREFIX = "sc:";

export const CORE_CONTEXT = {
  sc: SC,
  tagteam: TAGTEAM,
  schema: "https://schema.org/",
  dcterms: "http://purl.org/dc/terms/",
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  xsd: "http://www.w3.org/2001/XMLSchema#",
  "sc:code": { "@type": "@id" },
  "sc:record": { "@type": "@id" },
  "sc:status": { "@type": "@id" },
  "sc:namedGraph": { "@type": "@id" },
  "sc:graphForRecord": { "@type": "@id" },
  "sc:path": { "@type": "@id", "@container": "@list" },
} as const;

export const KERNEL_VERSION = "1.0.0-phase1";

export const VersionPolicy = {
  RejectOnMismatch: "sc:RejectOnMismatch",
  WarnAndRunOnMismatch: "sc:WarnAndRunOnMismatch",
  AllowCompatibleMinor: "sc:AllowCompatibleMinor",
} as const;

export const MultiValuePolicy = {
  EnrichEachValue: "sc:EnrichEachValue",
  ConcatenateValues: "sc:ConcatenateValues",
  FirstCanonicalValue: "sc:FirstCanonicalValue",
  ErrorOnMultipleValues: "sc:ErrorOnMultipleValues",
} as const;

export const LanguagePolicyIri = {
  AcceptAllLanguages: "sc:AcceptAllLanguages",
  RejectLanguageTaggedLiterals: "sc:RejectLanguageTaggedLiterals",
  AcceptPlainLiteral: "sc:AcceptPlainLiteral",
} as const;

export const Status = {
  Succeeded: "sc:EnrichmentSucceeded",
  Skipped: "sc:EnrichmentSkipped",
  Failed: "sc:EnrichmentFailed",
  Degraded: "sc:EnrichmentDegraded",
} as const;

export const WarningCode = {
  MissingSourceText: "sc:MissingSourceText",
  NonStringSourceValue: "sc:NonStringSourceValue",
  NodeSourceValue: "sc:NodeSourceValue",
  EmptySourceText: "sc:EmptySourceText",
  MultipleSourceValues: "sc:MultipleSourceValues",
  UnsupportedLanguageLiteral: "sc:UnsupportedLanguageLiteral",
  TagTeamRuntimeError: "sc:TagTeamRuntimeError",
  TagTeamVersionMismatch: "sc:TagTeamVersionMismatch",
  ContextResolutionError: "sc:ContextResolutionError",
  NonCCOAlignedOntology: "sc:NonCCOAlignedOntology",
} as const;

export function iri(id: string): { "@id": string } {
  return { "@id": id };
}
