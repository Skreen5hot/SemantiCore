import type {
  IriNode,
  JsonLdNode,
  JsonObject,
  JsonValue,
  NamedGraph,
  SemantiCoreDataset,
  SourceRecord,
  WarningResource,
} from "../../kernel/index.js";

export interface ColumnMapping extends JsonObject {
  "@type": "sc:ColumnMapping";
  "sc:sourceColumn": string;
  "sc:targetProperty": IriNode;
  "sc:valueDatatype"?: IriNode;
}

export interface MappingManifest extends JsonLdNode {
  "@id": string;
  "@type": "sc:MappingManifest";
  "sc:sourceFormat": IriNode;
  "sc:hasHeaderRow"?: boolean;
  "sc:recordIdStrategy"?: IriNode;
  "sc:mappingInference"?: IriNode;
  "sc:columnMappings"?: ColumnMapping[];
  columnMappings?: ColumnMapping[];
}

export interface AdapterResult<T> {
  value: T | null;
  warnings: WarningResource[];
}

export interface DatasetAdapterOptions {
  datasetId: string;
  datasetName?: string;
}

export interface EnrichedExportInput {
  "@context"?: JsonValue;
  "@id"?: string;
  "@type"?: JsonValue;
  "sc:record"?: SourceRecord | SourceRecord[];
  "sc:records"?: SourceRecord[];
  "sc:graph"?: NamedGraph | NamedGraph[] | null;
  "sc:graphs"?: NamedGraph[];
  "sc:warnings"?: WarningResource[];
}

export type DatasetResult = AdapterResult<SemantiCoreDataset>;
