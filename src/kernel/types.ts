export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue | undefined;
}

export interface IriNode extends JsonObject {
  "@id": string;
}

export interface JsonLdNode extends JsonObject {
  "@context"?: JsonValue;
  "@id"?: string;
  "@type"?: JsonValue;
}

export interface PropertyPath extends JsonLdNode {
  "@type": "sc:PropertyPath";
  "sc:path": IriNode[];
  "sc:multiValuePolicy"?: IriNode;
  "sc:joinSeparator"?: string;
  "sc:languagePolicy"?: LanguagePolicy | IriNode;
}

export interface LanguagePolicy extends JsonLdNode {
  "@type": "sc:LanguagePolicy";
  "sc:acceptedLanguage"?: string | string[];
  "sc:onLanguageMissing"?: IriNode;
}

export interface TagTeamOptions extends JsonLdNode {
  "@type": "sc:TagTeamOptions";
  "sc:ontologyThreshold"?: number;
  "sc:verbose"?: boolean;
}

export interface EnrichmentConfiguration extends JsonLdNode {
  "@type": "sc:EnrichmentConfiguration";
  "@id": string;
  "sc:semantiCoreVersion"?: string;
  "sc:requiredTagTeamVersion": string;
  "sc:tagTeamVersionPolicy"?: IriNode;
  "sc:sourcePropertyPath": PropertyPath;
  "sc:tagTeamOptions"?: TagTeamOptions;
  "sc:onMissingText"?: IriNode;
  "sc:onTagTeamError"?: IriNode;
}

export interface LocalContext extends JsonLdNode {
  "@id": string;
  "@type": "sc:LocalContext";
  "sc:contentHash"?: string;
  "sc:contextDocument": JsonLdNode;
}

export interface ContextManifest extends JsonLdNode {
  "@id": string;
  "@type": "sc:ContextManifest";
  "sc:contexts"?: LocalContext[];
  contexts?: LocalContext[];
}

export interface LocalOntology extends JsonLdNode {
  "@id": string;
  "@type": "sc:LocalOntology";
  "sc:contentHash"?: string;
  "sc:contentLocation"?: string;
  "sc:ontologyAlignment"?: IriNode;
}

export interface OntologySet extends JsonLdNode {
  "@id": string;
  "@type": "sc:OntologySet";
  "sc:ontologyCompositionPolicy"?: IriNode;
  "sc:ontologies"?: LocalOntology[];
  ontologies?: LocalOntology[];
}

export interface SourceRecord extends JsonLdNode {
  "@id": string;
}

export interface SemantiCoreDataset extends JsonLdNode {
  "@id": string;
  "@type": "sc:Dataset";
  "sc:records": SourceRecord[];
}

export interface TagTeamRuntime {
  version: string;
  buildGraph(sourceText: string, options: TagTeamOptions, ontologySet: OntologySet): JsonLdNode | JsonLdNode[];
}

export interface WarningResource extends JsonLdNode {
  "@id": string;
  "@type": "sc:Warning" | "sc:Error";
  "sc:code": IriNode;
  "sc:message": string;
  "sc:record"?: IriNode;
  "sc:recoverable": boolean;
  "sc:pathIndex"?: number;
  "sc:pathTerm"?: IriNode;
}

export interface TagTeamSummary extends JsonLdNode {
  "@type": "sc:TagTeamSummary";
  "sc:entityCount": number;
  "sc:actCount": number;
  "sc:roleCount": number;
  "sc:deonticDetected": boolean;
}

export interface TagTeamEnrichment extends JsonLdNode {
  "@id": string;
  "@type": "sc:TagTeamEnrichment";
  "sc:status": IriNode;
  "sc:sourceText"?: string;
  "sc:sourcePropertyPath": PropertyPath;
  "sc:tagTeamVersion": string;
  "sc:namedGraph"?: IriNode;
  "sc:summary"?: TagTeamSummary;
}

export interface NamedGraph extends JsonLdNode {
  "@id": string;
  "@type": ["sc:TagTeamGraph"];
  "sc:graphForRecord": IriNode;
  "sc:graphIndex": number;
  "@graph": JsonLdNode[];
}

export interface EnrichRecordResult {
  record: SourceRecord;
  graph: NamedGraph | NamedGraph[] | null;
  warnings: WarningResource[];
}

export interface TransformInput extends JsonLdNode {
  "sc:record": SourceRecord;
  "sc:configuration": EnrichmentConfiguration;
  "sc:contextManifest": ContextManifest;
  "sc:ontologySet": OntologySet;
  "sc:tagTeamFixtureGraph"?: JsonLdNode | JsonLdNode[];
}
