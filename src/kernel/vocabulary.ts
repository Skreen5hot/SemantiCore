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

export const TAGTEAM_GRAPH_CONTEXT = {
  ...CORE_CONTEXT,
  inst: "urn:tagteam:instance:",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#",
  owl: "http://www.w3.org/2002/07/owl#",
  "is_about": { "@id": "tagteam:is_about", "@type": "@id" },
  "is_concretized_by": { "@id": "tagteam:is_concretized_by", "@type": "@id" },
  "is_subject_of": { "@id": "tagteam:is_subject_of", "@type": "@id" },
  "has_input": { "@id": "tagteam:has_input", "@type": "@id" },
  "has_agent": { "@id": "tagteam:has_agent", "@type": "@id" },
  "has_output": { "@id": "tagteam:has_output", "@type": "@id" },
  "prescribes": { "@id": "tagteam:prescribes", "@type": "@id" },
  "is_prescribed_by": { "@id": "tagteam:is_prescribed_by", "@type": "@id" },
  "isSpecifiedBy": { "@id": "tagteam:isSpecifiedBy", "@type": "@id" },
  "inheres_in": { "@id": "tagteam:inheres_in", "@type": "@id" },
  "has_text_value": "tagteam:has_text_value",
  "ontologyMatch": { "@id": "tagteam:ontologyMatch", "@container": "@set" },
  "ontologyMatchIRI": { "@id": "tagteam:ontologyMatchIRI", "@type": "@id" },
  "ontologyMatchConfidence": { "@id": "tagteam:ontologyMatchConfidence", "@type": "xsd:decimal" },
  "ontologyMatchEvidence": "tagteam:ontologyMatchEvidence",
  "ontologyMatchLabel": "tagteam:ontologyMatchLabel",
  "ontologyMatchType": "tagteam:ontologyMatchType",
  "ontologyMatchForm": "tagteam:ontologyMatchForm",
  "ontologyMatchInflection": "tagteam:ontologyMatchInflection",
  "tagteam:classNominationStatus": { "@type": "@id" },
  "ActSpecification": "tagteam:ActSpecification",
  "Agent": "tagteam:Agent",
  "DirectiveInformationContentEntity": "tagteam:DirectiveInformationContentEntity",
  "Entity": "tagteam:Entity",
  "EventDescription": "tagteam:EventDescription",
  "InformationBearingEntity": "tagteam:InformationBearingEntity",
  "InformationContentEntity": "tagteam:InformationContentEntity",
  "IntentionalAct": "tagteam:IntentionalAct",
  "Obligation": "tagteam:Obligation",
  "Organization": "tagteam:Organization",
  "Permission": "tagteam:Permission",
  "Person": "tagteam:Person",
  "PlanSpecification": "tagteam:PlanSpecification",
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
