# SemantiCore v1.0 Specification

Status: Published v1.0
Date: 2026-05-12
Repository: `Skreen5hot/SemantiCore`
Canonical runtime: browser or `node index.js`

## 1. Purpose

SemantiCore is an edge-canonical semantic enrichment workbench and deterministic JSON-LD transformation kernel for structured data.

SemantiCore accepts CSV, plain JSON, or JSON-LD source records; converts them into canonical JSON-LD; selects a string-bearing semantic property path; invokes a pinned local TagTeam.js runtime over that text; and emits enriched JSON-LD records plus TagTeam JSON-LD named graphs.

TagTeam.js is the semantic graph engine. SemantiCore is the workbench, ingestion model, state/session model, deterministic orchestration contract, and canonical output format around that engine.

This document supersedes earlier working drafts titled `TagTeam Data Enricher`. That name referred to the same design space during drafting. The published project name and vocabulary are SemantiCore.

## 2. Architectural Truths

### 2.1 Edge-Canonical Execution

A conforming SemantiCore implementation MUST run, unmodified, in:

- a browser; or
- a local Node.js runtime via `node index.js`.

Cloud services, servers, databases, queues, service registries, background workers, and deployment topologies are optional adapters. They are not core requirements.

### 2.2 JSON-LD Is Canonical

JSON-LD is authoritative for:

- source datasets;
- records;
- mapping manifests;
- context manifests;
- ontology set manifests;
- enrichment configurations;
- sessions;
- enrichment runs;
- TagTeam graph outputs;
- warnings, errors, and uncertainty annotations;
- inter-component contracts.

CSV and plain JSON are adapter formats. They are never canonical.

### 2.3 Determinism Is Mandatory

Given the same canonical inputs, SemantiCore MUST produce the same canonical outputs.

The deterministic input set is:

- canonical dataset JSON-LD;
- mapping manifest JSON-LD, when ingestion is involved;
- context manifest JSON-LD;
- ontology set manifest JSON-LD;
- enrichment configuration JSON-LD;
- pinned TagTeam version;
- pinned SemantiCore kernel version.

A conforming implementation MUST use deterministic graph and envelope canonicalization:

- JSON-LD graph normalization: RDFC-1.0, formerly URDNA2015, for RDF dataset normalization and blank-node canonicalization.
- JSON envelope serialization: RFC 8785 JSON Canonicalization Scheme (JCS), or a documented sorted-key UTF-8 JSON serialization that is byte-stable for the same JSON value.

Map iteration order, Set iteration order, object key insertion order, blank-node labels, and `@graph` array order MUST NOT affect canonical output.

### 2.4 Offline Is Normal

Offline execution is a first-class mode. Inability to reach remote systems is not an error by itself.

Remote context lookup, remote ontology lookup, cloud save, and remote export are integration adapters. If they are unavailable, core enrichment MUST either proceed with local manifests or emit explicit degraded-execution metadata.

### 2.5 Separation of Concerns

SemantiCore distinguishes four concerns:

- Computation: deterministic derivation from JSON-LD inputs to JSON-LD outputs. This is core.
- State: storage and resumption of documents. This is pluggable.
- Orchestration: when and how computation is invoked. This is pluggable.
- Integration: how external systems or file formats are contacted. This is pluggable.

Only computation is core.

## 3. Namespaces and Vocabulary

SemantiCore uses the prefix `sc` for its own vocabulary.

```json
{
  "@context": {
    "sc": "https://semanticore.fandaws.org/ns/",
    "tagteam": "http://tagteam.fandaws.com/ontology/",
    "schema": "https://schema.org/",
    "dcterms": "http://purl.org/dc/terms/",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "xsd": "http://www.w3.org/2001/XMLSchema#"
  }
}
```

Implementations MAY compact with different prefixes, but canonical comparison MUST be performed over expanded or normalized RDF form, not prefix spelling.

## 4. Scope

### 4.1 Core v1.0 Scope

SemantiCore v1.0 core includes:

- validating canonical JSON-LD input documents;
- applying local context manifests;
- resolving semantic property paths;
- validating required TagTeam version compatibility;
- invoking local TagTeam over selected string literals;
- creating enrichment metadata;
- creating TagTeam named graph resources;
- emitting warning and error resources;
- canonicalizing output.

### 4.2 Adapter Scope

Adapters MAY provide:

- CSV ingestion;
- plain JSON ingestion;
- JSON-LD file loading;
- browser IndexedDB persistence;
- Node filesystem persistence;
- export downloads;
- remote context lookup;
- remote ontology lookup;
- cloud session sync.

Adapters MUST NOT change core computation semantics.

### 4.3 Out of Scope for Core v1.0

Core v1.0 does not require:

- databases;
- servers;
- background workers;
- message brokers;
- service discovery;
- authentication;
- multi-user collaboration;
- cloud storage;
- network access;
- OWL reasoning beyond TagTeam's local behavior.

## 5. Core Computation Interface

The normative core operation is record-oriented:

```javascript
enrichRecord(recordJsonLd, configurationJsonLd, contextManifestJsonLd, ontologySetJsonLd, tagTeamRuntime)
```

It returns:

```javascript
{
  record: enrichedRecordJsonLd,
  graph: namedGraphJsonLd,
  warnings: warningOrErrorJsonLdArray
}
```

A dataset convenience function MAY exist:

```javascript
enrichDataset(datasetJsonLd, configurationJsonLd, contextManifestJsonLd, ontologySetJsonLd, tagTeamRuntime)
```

`enrichDataset` is orchestration over `enrichRecord` and MUST preserve `enrichRecord` semantics.

Core functions MUST NOT:

- read files;
- write files;
- access network APIs;
- access IndexedDB;
- reference ambient time for semantic identity;
- use randomness;
- depend on environment variables;
- require a server or database.

Core functions MUST NOT throw for recoverable TagTeam runtime failures. They MUST translate such failures into the warning/error model and return enriched failure metadata for the record.

## 6. Enrichment Configuration

An enrichment configuration is JSON-LD and MUST include a required TagTeam version constraint.

```json
{
  "@context": {
    "sc": "https://semanticore.fandaws.org/ns/",
    "schema": "https://schema.org/",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "sc:code": { "@type": "@id" },
    "sc:onMissingText": { "@type": "@id" },
    "sc:onTagTeamError": { "@type": "@id" },
    "sc:contextManifest": { "@type": "@id" },
    "sc:ontologySet": { "@type": "@id" }
  },
  "@type": "sc:EnrichmentConfiguration",
  "@id": "urn:semanticore:config:default",
  "sc:semantiCoreVersion": "1.0.0",
  "sc:requiredTagTeamVersion": "7.0.0",
  "sc:tagTeamVersionPolicy": { "@id": "sc:RejectOnMismatch" },
  "sc:sourcePropertyPath": {
    "@type": "sc:PropertyPath",
    "sc:path": [
      { "@id": "sc:source" },
      { "@id": "schema:description" }
    ],
    "sc:multiValuePolicy": { "@id": "sc:EnrichEachValue" },
    "sc:languagePolicy": {
      "@type": "sc:LanguagePolicy",
      "sc:acceptedLanguage": "en",
      "sc:onLanguageMissing": { "@id": "sc:AcceptPlainLiteral" }
    }
  },
  "sc:tagTeamOptions": {
    "@type": "sc:TagTeamOptions",
    "sc:ontologyThreshold": 0.2,
    "sc:verbose": false
  },
  "sc:contextManifest": { "@id": "urn:semanticore:context-manifest:default" },
  "sc:ontologySet": { "@id": "urn:semanticore:ontology-set:default" },
  "sc:onMissingText": { "@id": "sc:WarnAndSkip" },
  "sc:onTagTeamError": { "@id": "sc:CaptureAndContinue" }
}
```

### 6.1 TagTeam Version Policy

`sc:requiredTagTeamVersion` is REQUIRED and MUST be a SemVer string.

Supported version policies:

- `sc:RejectOnMismatch`: if the runtime TagTeam version does not exactly match, emit `sc:TagTeamVersionMismatch` and do not run TagTeam for the record.
- `sc:WarnAndRunOnMismatch`: emit `sc:TagTeamVersionMismatch` and proceed.
- `sc:AllowCompatibleMinor`: allow matching major version and runtime minor version greater than or equal to the required minor version; otherwise reject.

The default policy is `sc:RejectOnMismatch`.

### 6.2 TagTeam Options

`sc:tagTeamOptions` MUST be a typed `sc:TagTeamOptions` node.

`sc:ontologyThreshold` is an `xsd:decimal` in the closed interval `[0, 1]`. It is the minimum ontology tagger confidence required for SemantiCore to pass ontology match results through as accepted semantic enrichment metadata. A lower value increases recall and may increase false positives. A higher value increases precision and may reduce ontology-backed enrichment.

`sc:verbose` is an `xsd:boolean`. If true, TagTeam debug metadata MAY be preserved in the named graph resource. If false, debug metadata SHOULD be omitted unless required to explain an error.

## 7. Dataset and Record Model

A SemantiCore dataset is JSON-LD containing source records.

```json
{
  "@context": {
    "sc": "https://semanticore.fandaws.org/ns/",
    "schema": "https://schema.org/",
    "records": { "@id": "sc:records", "@container": "@list" }
  },
  "@id": "urn:semanticore:dataset:example",
  "@type": "sc:Dataset",
  "schema:name": "Example dataset",
  "sc:recordIdStrategy": { "@id": "sc:RowIndexRecordId" },
  "sc:records": [
    {
      "@id": "urn:semanticore:record:example:0",
      "@type": "sc:SourceRecord",
      "sc:source": {
        "schema:description": "The committee shall review the proposal."
      }
    }
  ]
}
```

Records MUST have stable non-blank `@id` values. Blank node record identifiers are forbidden because they break export/re-import determinism.

If a source lacks stable identifiers, an ingestion adapter MUST assign deterministic identifiers and record the strategy.

Allowed record ID strategies:

- `sc:RowIndexRecordId`: dataset ID plus zero-based row index.
- `sc:SourcePrimaryKeyRecordId`: dataset ID plus explicit source key.
- `sc:CanonicalContentHashRecordId`: dataset ID plus hash of RDFC-1.0-normalized record graph.

Content-hash record IDs MUST use SHA-256 over canonical normalized bytes unless the mapping manifest explicitly declares another hash algorithm.

## 8. Semantic Property Path Semantics

A property path is an ordered list of expanded JSON-LD property IRIs, represented compactly as IRI nodes.

Before path resolution, the record MUST be expanded or flattened using the supplied context manifest, or converted into an internal RDF graph losslessly derived from expansion or flattening.

Path resolution MUST be invariant under compaction. `schema:description` and `https://schema.org/description` are the same path segment after expansion.

### 8.1 Traversal Rules

Given a path `[p1, p2, ... pn]`:

1. Start at the record node.
2. For each property segment, collect all values reachable by that property from all current nodes.
3. If an intermediate value is an ordered `@list`, preserve list order.
4. If an intermediate value is an unordered `@set` or multi-valued property, canonicalize traversal order by normalized RDF term ordering.
5. If no values are reachable, emit `sc:MissingSourceText` unless failure occurred because a path term could not be resolved, in which case emit `sc:ContextResolutionError`.

### 8.2 Multi-Value Resolution

If the terminal path resolves to multiple eligible string literals, behavior is controlled by `sc:multiValuePolicy`:

- `sc:EnrichEachValue`: produce one `sc:TagTeamEnrichment` and one named graph per terminal literal.
- `sc:ConcatenateValues`: concatenate terminal literals using `sc:joinSeparator`, then produce one enrichment.
- `sc:FirstCanonicalValue`: use the first value after canonical ordering and emit `sc:MultipleSourceValues`.
- `sc:ErrorOnMultipleValues`: emit `sc:MultipleSourceValues` and skip enrichment.

The default policy is `sc:EnrichEachValue`.

### 8.3 Eligible String Literals

The following terminal values are eligible for TagTeam enrichment:

- plain JSON strings;
- JSON-LD string literals without datatype;
- `xsd:string`;
- `xsd:normalizedString`;
- `xsd:token`;
- `rdf:langString` literals accepted by the language policy.

Terminal values that are node references, embedded nodes, numbers, booleans, arrays, or objects are not eligible and MUST emit `sc:NonStringSourceValue` or `sc:NodeSourceValue` as appropriate.

### 8.4 Language Policy

If the terminal value is an `rdf:langString`, SemantiCore MUST apply `sc:languagePolicy`.

Supported policies:

- accepted language list: enrich matching language tags;
- `sc:AcceptAllLanguages`: enrich all language-tagged strings independently;
- `sc:RejectLanguageTaggedLiterals`: emit `sc:UnsupportedLanguageLiteral`;
- `sc:AcceptPlainLiteral`: allow untagged literals when accepted language is unavailable.

Language matching MUST use BCP 47 basic filtering.

### 8.5 Path Error Detail

A context or path resolution warning SHOULD include:

- `sc:pathIndex`: zero-based failing segment index;
- `sc:pathTerm`: the unresolved term or IRI;
- `sc:record`: the record ID.

## 9. Context Manifest

A context manifest is a versioned, hashable JSON-LD resource that packages local `@context` documents with provenance.

The wrapper exists so contexts can be named, hashed, versioned, audited, and shipped offline. The embedded `sc:contextDocument` is a proper JSON-LD `@context` document. SemantiCore does not define a parallel context language.

```json
{
  "@context": {
    "sc": "https://semanticore.fandaws.org/ns/",
    "dcterms": "http://purl.org/dc/terms/",
    "contexts": { "@id": "sc:contexts", "@container": "@list" }
  },
  "@id": "urn:semanticore:context-manifest:default",
  "@type": "sc:ContextManifest",
  "dcterms:title": "SemantiCore default context manifest",
  "sc:hashAlgorithm": { "@id": "sc:SHA256" },
  "contexts": [
    {
      "@id": "urn:semanticore:context:core-v1",
      "@type": "sc:LocalContext",
      "sc:contentHash": "sha256:REPLACE_WITH_CANONICAL_HASH",
      "sc:contextDocument": {
        "@context": {
          "sc": "https://semanticore.fandaws.org/ns/",
          "schema": "https://schema.org/",
          "description": "https://schema.org/description",
          "name": "https://schema.org/name"
        }
      }
    }
  ]
}
```

A conforming implementation MUST ship or accept a local context manifest sufficient to expand its own examples and core vocabulary offline.

Remote context retrieval MAY exist as an adapter but MUST NOT be required for core conformance.

## 10. Mapping Manifest

A mapping manifest describes how adapter input becomes canonical JSON-LD.

CSV adapters MUST use or produce a mapping manifest. Plain JSON adapters MUST use JSON Pointer, RFC 6901, when selecting an array inside a source object.

```json
{
  "@context": {
    "sc": "https://semanticore.fandaws.org/ns/",
    "schema": "https://schema.org/",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "columnMappings": { "@id": "sc:columnMappings", "@container": "@list" }
  },
  "@id": "urn:semanticore:mapping:example-csv",
  "@type": "sc:MappingManifest",
  "sc:sourceFormat": { "@id": "sc:CSV" },
  "sc:hasHeaderRow": true,
  "sc:recordIdStrategy": { "@id": "sc:RowIndexRecordId" },
  "sc:mappingInference": { "@id": "sc:ExplicitMapping" },
  "columnMappings": [
    {
      "@type": "sc:ColumnMapping",
      "sc:sourceColumn": "description",
      "sc:targetProperty": { "@id": "schema:description" },
      "sc:valueDatatype": { "@id": "xsd:string" }
    }
  ]
}
```

If an adapter infers a mapping, it MUST serialize the inferred manifest and mark it with `sc:InferredMapping`.

The same source file plus the same mapping manifest MUST produce the same dataset JSON-LD.

## 11. Ontology Set Manifest

An ontology set is a JSON-LD manifest identifying local ontology content available to TagTeam.

```json
{
  "@context": {
    "sc": "https://semanticore.fandaws.org/ns/",
    "dcterms": "http://purl.org/dc/terms/",
    "ontologies": { "@id": "sc:ontologies", "@container": "@list" }
  },
  "@id": "urn:semanticore:ontology-set:default",
  "@type": "sc:OntologySet",
  "dcterms:title": "Default local ontologies",
  "sc:ontologyCompositionPolicy": { "@id": "sc:OrderedUnion" },
  "ontologies": [
    {
      "@id": "urn:semanticore:ontology:constitution",
      "@type": "sc:LocalOntology",
      "dcterms:title": "Constitution example",
      "sc:mediaType": "text/turtle",
      "sc:contentHash": "sha256:REPLACE_WITH_CANONICAL_HASH",
      "sc:contentLocation": "project/ontologies/constitution.ttl",
      "sc:ontologyAlignment": { "@id": "sc:CCO2BFO2020Aligned" }
    }
  ]
}
```

Ontology content SHOULD be referenced by `sc:contentLocation` with `sc:contentHash`. Inline content MAY be used for portable single-file sessions, but content location plus hash is preferred.

Hashing MUST use SHA-256 over the exact UTF-8 ontology bytes unless `sc:canonicalizationAlgorithm` is declared. If canonicalization is declared, hash input MUST be the canonicalized bytes.

### 11.1 Composition Policy

Supported composition policies:

- `sc:OrderedUnion`: load ontologies in manifest order; later duplicate labels may add alternatives but MUST NOT silently replace earlier IRIs.
- `sc:StrictDisjointUnion`: duplicate labels or conflicting term definitions emit `sc:OntologyCompositionConflict`.
- `sc:PriorityOverride`: later ontologies may override earlier mappings; each override MUST be recorded as a warning.

The default is `sc:OrderedUnion`.

### 11.2 BFO/CCO Posture

SemantiCore is designed for TagTeam graphs that can feed BFO 2020 / CCO 2.0-oriented consumers.

Ontologies in an ontology set SHOULD be BFO 2020 / CCO 2.0 aligned or explicitly declared otherwise using `sc:ontologyAlignment`.

Non-aligned ontologies are permitted, but SemantiCore MUST record `sc:NonCCOAlignedOntology` when such ontologies are active. Downstream Fandaws or FNSR consumers MAY reject or degrade outputs produced with non-aligned ontology sets.

## 12. Named Graph Output

TagTeam output MUST be attached as a JSON-LD named graph resource. It MUST NOT be embedded as an opaque JSON string or value object.

```json
{
  "@context": {
    "sc": "https://semanticore.fandaws.org/ns/",
    "tagteam": "http://tagteam.fandaws.com/ontology/",
    "inst": "http://tagteam.fandaws.com/instance/",
    "bfo": "http://purl.obolibrary.org/obo/",
    "cco": "https://www.commoncoreontologies.org/"
  },
  "@id": "urn:semanticore:graph:example:0",
  "@type": ["sc:TagTeamGraph"],
  "sc:graphForRecord": { "@id": "urn:semanticore:record:example:0" },
  "sc:graphIndex": 0,
  "@graph": [
    {
      "@id": "urn:tagteam:example-node",
      "@type": "tagteam:DiscourseReferent"
    }
  ]
}
```

Graph bundle exports SHOULD consolidate contexts into one top-level `@context` and represent per-record TagTeam outputs as named graph resources in a top-level `@graph` array. The named graph entries SHOULD NOT repeat the same context once per record.

Combined exports MUST reconcile contexts:

- absolute IRIs MUST be preserved;
- the same prefix MUST NOT be used for different IRIs;
- context collisions MUST emit `sc:GraphContextCollision`;
- compacted combined output MUST be losslessly expandable;
- canonical comparison MUST use normalized RDF datasets, not compacted text.

## 13. Enriched Record Output

Each enriched record preserves source data and appends enrichment metadata.

```json
{
  "@context": {
    "sc": "https://semanticore.fandaws.org/ns/",
    "schema": "https://schema.org/"
  },
  "@id": "urn:semanticore:record:example:0",
  "@type": ["sc:SourceRecord", "sc:EnrichedRecord"],
  "sc:source": {
    "schema:description": "The committee shall review the proposal."
  },
  "sc:semanticEnrichment": {
    "@id": "urn:semanticore:enrichment:example:0:0",
    "@type": "sc:TagTeamEnrichment",
    "sc:status": { "@id": "sc:EnrichmentSucceeded" },
    "sc:sourceText": "The committee shall review the proposal.",
    "sc:sourcePropertyPath": {
      "@type": "sc:PropertyPath",
      "sc:path": [
        { "@id": "sc:source" },
        { "@id": "schema:description" }
      ]
    },
    "sc:tagTeamVersion": "7.0.0",
    "sc:namedGraph": { "@id": "urn:semanticore:graph:example:0" },
    "sc:summary": {
      "@type": "sc:TagTeamSummary",
      "sc:entityCount": 2,
      "sc:actCount": 1,
      "sc:roleCount": 0,
      "sc:deonticDetected": true
    }
  }
}
```

Status values MUST be IRIs. Required status IRIs:

- `sc:EnrichmentSucceeded`
- `sc:EnrichmentSkipped`
- `sc:EnrichmentFailed`
- `sc:EnrichmentDegraded`

## 14. Processing Semantics

For each record, SemantiCore MUST:

1. Validate configuration shape.
2. Validate SemantiCore kernel version compatibility.
3. Validate TagTeam runtime version against `sc:requiredTagTeamVersion` and `sc:tagTeamVersionPolicy`.
4. Apply context manifest and expand or flatten the record.
5. Resolve the semantic property path.
6. Apply multi-value and language policies.
7. For each eligible terminal string, invoke `TagTeam.buildGraph(sourceText, tagTeamOptions)`.
8. Convert TagTeam output into a named graph resource.
9. Attach enrichment metadata to the source record.
10. Emit warnings/errors as JSON-LD resources.
11. Canonicalize output for deterministic comparison.

If TagTeam throws, SemantiCore MUST catch the failure, emit `sc:TagTeamRuntimeError`, attach failed enrichment metadata, and continue processing other terminal values or records according to orchestration policy.

## 15. Warning and Error Model

Warnings and errors are JSON-LD resources. Codes MUST be IRIs, not string literals.

```json
{
  "@context": {
    "sc": "https://semanticore.fandaws.org/ns/",
    "sc:code": { "@type": "@id" },
    "sc:record": { "@type": "@id" }
  },
  "@id": "urn:semanticore:warning:example:0",
  "@type": "sc:Warning",
  "sc:code": { "@id": "sc:MissingSourceText" },
  "sc:message": "No string value was found at the configured source property path.",
  "sc:record": { "@id": "urn:semanticore:record:example:3" },
  "sc:recoverable": true,
  "sc:pathIndex": 1,
  "sc:pathTerm": { "@id": "schema:description" }
}
```

Required warning/error codes:

- `sc:MissingSourceText`
- `sc:NonStringSourceValue`
- `sc:NodeSourceValue`
- `sc:EmptySourceText`
- `sc:MultipleSourceValues`
- `sc:UnsupportedLanguageLiteral`
- `sc:TagTeamRuntimeError`
- `sc:TagTeamVersionMismatch`
- `sc:OntologyUnavailable`
- `sc:OntologyParseWarning`
- `sc:OntologyCompositionConflict`
- `sc:NonCCOAlignedOntology`
- `sc:ContextResolutionError`
- `sc:ContextUnavailable`
- `sc:ContextAliasConflict`
- `sc:GraphContextCollision`
- `sc:DegradedOfflineExecution`
- `sc:UnsupportedInputShape`
- `sc:MappingManifestMissing`
- `sc:MappingManifestAmbiguous`
- `sc:StateWriteConflict`
- `sc:SessionReferenceMismatch`

## 16. Offline and Degraded Execution

If an ontology is unavailable, SemantiCore MUST:

- run TagTeam without that ontology when policy permits;
- emit `sc:OntologyUnavailable`;
- identify the unavailable ontology by `@id`;
- mark the affected enrichment or run as `sc:EnrichmentDegraded`.

If a remote context is unavailable, SemantiCore MUST:

- use the local context manifest;
- emit `sc:ContextUnavailable` if remote lookup was requested;
- emit `sc:ContextResolutionError` if required local terms cannot be resolved;
- preserve unresolved data without fabricating semantic equivalence.

Offline degraded output is valid output when degradation is explicit.

## 17. Iterator-Oriented Orchestration and Scale

The core operation is record-oriented to support large datasets.

Orchestration SHOULD support an async iterator pattern:

```javascript
for await (const record of recordIterator) {
  const result = enrichRecord(record, config, contextManifest, ontologySet, TagTeam);
  await stateAdapter.savePartialResult(result);
}
```

Iterator orchestration MUST NOT change `enrichRecord` semantics.

### 17.1 Backpressure and Concurrency

Orchestrators MAY process records concurrently only if output ordering is restored canonically before final export.

Concurrency controls SHOULD include:

- maximum in-flight records;
- cancellation signal;
- progress callback;
- checkpoint interval.

If concurrency causes a recoverable per-record failure, that failure MUST be represented in the output model, not thrown as an unstructured orchestration failure.

### 17.2 Resume Semantics

Resume MUST be based on stable record IDs and idempotent result writes.

A resumed run MUST NOT duplicate enriched records or named graphs for records already committed under the same run ID, configuration hash, and record ID.

## 18. State Adapter Contract

State adapters persist JSON-LD documents. State is not core computation.

State adapters SHOULD provide atomic document writes.

Recommended consistency model:

- at-least-once save attempts;
- idempotent writes keyed by document `@id` plus canonical content hash;
- atomic replace where supported;
- explicit `sc:StateWriteConflict` when an existing document with the same `@id` has a different content hash and overwrite is not permitted.

IndexedDB adapters SHOULD use a single transaction for record enrichment metadata and named graph save.

Filesystem adapters SHOULD write to a temporary file and then perform atomic rename where the platform supports it.

## 19. Session Model

A session is a JSON-LD document that references a reproducible working state.

Session references SHOULD be hash-pinned. A session restored with a different hash for the same referenced document MUST emit `sc:StateWriteConflict` or `sc:SessionReferenceMismatch`.

```json
{
  "@context": {
    "sc": "https://semanticore.fandaws.org/ns/"
  },
  "@id": "urn:semanticore:session:example",
  "@type": "sc:Session",
  "sc:dataset": {
    "@id": "urn:semanticore:dataset:example",
    "sc:contentHash": "sha256:REPLACE_WITH_HASH"
  },
  "sc:configuration": {
    "@id": "urn:semanticore:config:default",
    "sc:contentHash": "sha256:REPLACE_WITH_HASH"
  },
  "sc:contextManifest": {
    "@id": "urn:semanticore:context-manifest:default",
    "sc:contentHash": "sha256:REPLACE_WITH_HASH"
  },
  "sc:ontologySet": {
    "@id": "urn:semanticore:ontology-set:default",
    "sc:contentHash": "sha256:REPLACE_WITH_HASH"
  }
}
```

Snapshot export MAY inline all referenced documents for portable session exchange.

## 20. Output Formats

Canonical output is JSON-LD containing:

- enriched records;
- named graph resources;
- enrichment run metadata;
- warnings/errors;
- hashes of configuration, context, ontology, and mapping manifests.

Derived outputs MAY include:

- plain JSON;
- CSV summary;
- JSON-LD graph bundle;
- ZIP archive of JSON-LD documents.

CSV summary exports MAY add implementation-specific columns. They MUST include at minimum:

- record ID;
- enrichment status;
- source text or source text hash;
- entity count;
- act count;
- role count;
- deontic detected;
- named graph ID;
- warning/error codes.

Full TagTeam graphs SHOULD NOT be embedded in CSV cells.

## 21. Security and Privacy

Core computation MUST NOT require network access.

Browser implementations served from an origin SHOULD use a restrictive Content Security Policy. Inline styles and scripts SHOULD use nonces or hashes, not unrestricted `'unsafe-inline'`.

Recommended baseline CSP:

```text
default-src 'self';
script-src 'self' 'nonce-{RUNTIME_NONCE}';
style-src 'self' 'nonce-{RUNTIME_NONCE}';
connect-src 'self';
img-src 'self' data:;
object-src 'none';
base-uri 'none';
form-action 'none';
frame-ancestors 'none';
```

If remote adapters are enabled, `connect-src` MUST be expanded explicitly. Remote ontology lookup, remote context lookup, cloud save, and remote export MUST be opt-in.

Optional remote scripts MUST use Subresource Integrity when loaded from a URL. Privacy-sensitive deployments SHOULD avoid remote scripts entirely.

## 22. Integration Surfaces

SemantiCore v1.0 defines these integration surfaces but does not require them for core conformance.

### 22.1 TagTeam.js

TagTeam is the required semantic graph engine for enrichment. SemantiCore requires a local TagTeam runtime matching configuration policy.

### 22.2 Fandaws

Fandaws may consume SemantiCore named graphs and ontology-backed enrichment metadata for downstream OWL reasoning. SemantiCore output intended for Fandaws SHOULD use BFO 2020 / CCO 2.0-aligned ontology sets.

### 22.3 HIRI / Hash-Addressed Artifacts

Context manifests, ontology sets, mapping manifests, sessions, and outputs MAY be HIRI-addressed in companion specifications. SemantiCore v1.0 requires content hashes but does not require a remote HIRI resolver.

### 22.4 FNSR / Sentinel Consumers

Downstream FNSR or Sentinel-style consumers may require stricter CCO/BFO alignment and graph validation. SemantiCore MUST preserve enough provenance for such consumers to accept, reject, or degrade the output.

## 23. Conformance Tests

A SemantiCore v1.0 implementation MUST include or pass an equivalent conformance corpus.

Minimum corpus:

1. Deterministic rerun test: same canonical inputs produce byte-identical canonical output after RDFC-1.0 plus JCS serialization.
2. Offline context test: enrichment succeeds using only local context manifests.
3. Context failure test: unresolved path term emits `sc:ContextResolutionError` with `sc:pathIndex`.
4. CSV mapping test: same CSV plus same mapping manifest produces same dataset JSON-LD.
5. Multi-value path test: `sc:EnrichEachValue` produces multiple enrichments and named graphs deterministically.
6. Language literal test: accepted English `rdf:langString` is enriched; rejected language emits `sc:UnsupportedLanguageLiteral`.
7. TagTeam mismatch test: `sc:RejectOnMismatch` prevents enrichment and emits `sc:TagTeamVersionMismatch`.
8. TagTeam runtime error test: core catches failure and emits `sc:TagTeamRuntimeError` without aborting the dataset run.
9. Named graph test: TagTeam output appears as `@graph` in a named graph resource, not as an opaque JSON payload.
10. No-network test: core computation performs no network calls.
11. Purity test: kernel code performs no file, IndexedDB, network, time, random, or environment access.
12. Snapshot test: representative input matches expected output exactly after canonicalization.

The repository template's determinism, no-network, snapshot, and purity tests are mandatory baseline tests and SHOULD be extended with the SemantiCore-specific cases above.

## 24. Conformance Checklist

A v1.0 conforming implementation MUST:

1. Run in browser or Node.js without required external infrastructure.
2. Treat JSON-LD as canonical for inputs, outputs, configuration, manifests, sessions, and warnings.
3. Use RDFC-1.0 for graph normalization.
4. Use JCS or documented sorted-key canonical JSON serialization for envelopes.
5. Require `sc:requiredTagTeamVersion` in configuration.
6. Apply a declared TagTeam version mismatch policy.
7. Resolve source text through semantic property paths over expanded, flattened, or equivalent RDF graph form.
8. Define behavior for multi-value, language-tagged, list, set, node, and non-string path results.
9. Use JSON-LD IRIs for statuses, policies, and warning codes.
10. Model TagTeam options as a typed JSON-LD node.
11. Use local context manifests with embedded proper `@context` documents.
12. Use mapping manifests for CSV ingestion and deterministic JSON Pointer for nested plain JSON arrays.
13. Use ontology set manifests with content hashes and composition policy.
14. Attach TagTeam output as named graph resources using `@graph`.
15. Preserve original source records.
16. Support partial success and degraded offline execution.
17. Catch recoverable TagTeam runtime errors and represent them as JSON-LD warnings/errors.
18. Support iterator-oriented orchestration without changing record semantics.
19. Define atomic or idempotent state adapter writes for resumable sessions.
20. Include conformance tests covering determinism, offline mode, pathing, named graphs, and no-network purity.

## 25. Spec Test

A developer MUST be able to evaluate, reason about, and execute SemantiCore core behavior using only:

- a browser;
- a local Node.js runtime;
- local JSON-LD files;
- optional local CSV or plain JSON files;
- local TagTeam JavaScript.

If a system requires a database, server, message broker, service registry, background worker, deployment topology, or network resolver for core enrichment, it is not SemantiCore v1.0 conforming.
