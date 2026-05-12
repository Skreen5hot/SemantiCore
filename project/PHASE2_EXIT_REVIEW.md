# Phase 2 Exit Review: Local Ingestion and Export Adapters

Status: Approved  
Date prepared: 2026-05-12  
Phase started after Phase 1 approval

## Implementation Submitted for Review

Phase 2 implementation is ready for human review in the commit that contains this document update.

What changed:

- Added `src/adapters/integration/csv.ts` for local CSV text ingestion.
- Added `src/adapters/integration/json.ts` for plain JSON object/array ingestion and RFC 6901 JSON Pointer selection.
- Added `src/adapters/integration/jsonld.ts` for `sc:Dataset` passthrough validation.
- Added `src/adapters/integration/export.ts` for canonical JSON-LD, graph bundle, and CSV summary exports.
- Added mapping-manifest validation helpers for missing and ambiguous mappings.
- Added adapter type definitions and integration exports.
- Added `tests/adapter-integration.test.ts` for Phase 2 conformance behavior.
- Kept adapter code outside `src/kernel/`.

Verification run before review:

- `npm.cmd test`
- `npm.cmd run test:purity`

Both commands passed locally on 2026-05-12.

## Purpose

This document defines the human approval gate for leaving Phase 2 and beginning Phase 3.

Phase 2 proves that SemantiCore can convert local CSV, plain JSON, and already-canonical JSON-LD into kernel-ready JSON-LD datasets, and can export deterministic derived outputs without changing core computation.

Approval means: "The adapter boundary is stable enough for browser workbench UI development."

Approval does not mean:

- IndexedDB persistence is complete;
- the browser workbench UI is complete;
- real TagTeam bundle loading is complete;
- remote import, cloud sync, or remote ontology/context lookup exists.

## Reviewer Role

Review as if you are deciding whether a browser UI can safely call these adapters without inventing data semantics.

The core question is:

Can a small browser workbench import local files, produce canonical SemantiCore JSON-LD, and export reviewable output while keeping the kernel pure?

## Review Inputs

Review these files and areas:

- `project/SPEC.md`
- `project/detailPlan.md`
- `src/adapters/integration/`
- `src/adapters/orchestration/`
- `src/kernel/`
- `tests/`
- `examples/`
- `package.json`

## Phase 2 Deliverables

### 1. CSV Adapter

Expected:

- Accepts CSV text and a mapping manifest.
- Supports `sc:hasHeaderRow`.
- Preserves row order.
- Emits deterministic record IDs.
- Preserves cell values as strings unless mapping declares datatype conversion.
- Emits canonical `sc:Dataset`.
- Emits mapping-manifest warnings instead of unstructured failures.

Block if:

- CSV parsing requires a server or remote service.
- Header-row behavior is implicit.
- Same CSV plus same mapping manifest can produce different output.

### 2. Plain JSON Adapter

Expected:

- Accepts an array of objects.
- Accepts an object containing an array selected by RFC 6901 JSON Pointer.
- Accepts a single object as one record when no array pointer is provided.
- Emits `sc:UnsupportedInputShape` for unsupported shapes.
- Uses mapping manifests for semantic target properties.

Block if:

- The adapter uses JSONPath or implementation-specific pathing.
- Unsupported shapes throw without a SemantiCore warning/error resource.

### 3. JSON-LD Passthrough Adapter

Expected:

- Accepts `sc:Dataset` JSON-LD.
- Verifies records have stable non-blank `@id`.
- Preserves semantically valid input without needless rewrites.

Block if:

- Blank-node record IDs are allowed.
- The adapter mutates valid input in a way that changes semantics.

### 4. Export Utilities

Expected:

- Exports canonical enriched JSON-LD.
- Exports named graph bundles.
- Exports CSV summaries with required columns from spec section 20.
- Does not embed full graphs in CSV cells.
- Derived outputs are reproducible from canonical input.

Block if:

- CSV summary omits required columns.
- Full JSON-LD graphs are stuffed into CSV cells.

### 5. Boundary and Tests

Expected:

- Adapter code lives outside `src/kernel/`.
- Kernel purity tests still pass.
- Adapter tests cover CSV determinism, missing/ambiguous mapping, JSON Pointer selection, JSON-LD passthrough, and export shape.

Human check:

```bash
npm ci
npm test
npm run test:purity
```

Approve if:

- Tests pass locally and in CI.
- Adapter outputs match SemantiCore v1.0 modeling expectations.

Block if:

- Adapter code leaks into `src/kernel/`.
- Kernel purity fails.
- Required adapter tests are missing.

## Blocking Conditions

Do not approve Phase 2 if any of these are true:

- Kernel code imports adapter code.
- CSV import does not require or emit a mapping manifest.
- JSON nested array selection is not RFC 6901 JSON Pointer.
- JSON-LD passthrough accepts blank-node record IDs.
- Exported CSV summary omits required spec columns.
- Tests fail.
- The implementation introduces required servers, databases, network calls, or cloud services.

## Known Non-Blocking Notes

The reviewer may choose to allow these if documented:

- CSV parser is intentionally small and scoped to local MVP use.
- Datatype conversion is limited to string preservation in Phase 2.
- Browser UI wiring is deferred to Phase 3.
- IndexedDB persistence is deferred to Phase 4.

## Approval Record

Complete this section at Phase 2 review.

### Reviewer

Name:
Aaron

Date:
2026-05-12

Commit reviewed:
51c0482

### Checklist

- [x] CSV adapter works from local text plus mapping manifest.
- [x] CSV header-row behavior is explicit.
- [x] Plain JSON adapter supports arrays, single objects, and RFC 6901 array pointers.
- [x] JSON-LD passthrough validates stable record IDs.
- [x] Export utilities produce canonical JSON-LD, graph bundles, and CSV summaries.
- [x] Adapter warnings/errors use SemantiCore JSON-LD resources.
- [x] Adapter code stays outside `src/kernel/`.
- [x] `npm test` passes.
- [x] `npm run test:purity` passes.
- [x] CI passes.
- [x] No required infrastructure was introduced.

### Decision

Choose one:

- [x] Approved: Begin Phase 3.
- [ ] Approved with non-blocking notes: Begin Phase 3 after recording notes.
- [ ] Not approved: Address blockers and repeat Phase 2 review.

### Notes

Add review notes here:
Approved. Proceed.
