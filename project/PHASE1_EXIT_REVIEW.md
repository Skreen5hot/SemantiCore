# Phase 1 Exit Review: Pure SemantiCore Kernel

Status: Approved  
Date prepared: 2026-05-12  
Phase started after Phase 0 approval

## Purpose

This document defines the human approval gate for leaving Phase 1 and beginning Phase 2.

Phase 1 proves that SemantiCore's pure kernel exists and obeys the v1.0 specification. It does not prove that the browser workbench, CSV import UI, IndexedDB sessions, or real TagTeam bundle loading are complete.

Approval means: "The pure SemantiCore kernel contract is ready for adapter development."

Approval does not mean:

- CSV ingestion is complete;
- browser UI is complete;
- IndexedDB persistence is complete;
- production canonicalization is fully hardened beyond the documented Phase 1 scope;
- remote integrations exist.

## Reviewer Role

Review as if you are deciding whether infrastructure/adapters can safely be built around the kernel.

The core question is:

Can future adapter work depend on this kernel contract without inventing or changing SemantiCore's architecture?

## Review Inputs

Review these files and areas:

- `project/SPEC.md`
- `project/detailPlan.md`
- `src/kernel/`
- `examples/input.jsonld`
- `examples/expected-output.jsonld`
- `tests/`
- `scripts/ensure-kernel-purity.ts`
- `package.json`

## Implementation Submitted for Review

Phase 1 implementation is ready for human review in the commit that contains this document update.

What changed:

- Added the pure SemantiCore kernel modules under `src/kernel/`.
- Added `enrichRecord(record, configuration, contextManifest, ontologySet, tagTeamRuntime)`.
- Added typed JSON-LD structures for records, configuration, context manifests, ontology sets, TagTeam runtime, warnings, enrichments, and named graphs.
- Added local context term resolution for semantic property paths.
- Added deterministic TagTeam version policy handling.
- Added source text resolution for multi-value, language-tagged, node, non-string, and empty values.
- Added JSON-LD warning resources with IRI codes.
- Added named graph output using top-level `@graph`.
- Moved CLI file reading to `src/index.ts`; `src/kernel/` is computation-only.
- Replaced template examples with SemantiCore fixtures.
- Replaced template event-normalization example files.
- Added SemantiCore-specific conformance tests.
- Strengthened the kernel purity script to reject time, randomness, network, storage, environment, and filesystem access in compiled kernel files.

Verification run before review:

- `npm.cmd test`
- `npm.cmd run test:purity`

Both commands passed locally on 2026-05-12.

## Phase 1 Deliverables

### 1. Kernel Types

Expected:

- TypeScript interfaces or types exist for SemantiCore kernel structures.
- Types live in `src/kernel/`.
- Types do not import adapter code.

Human check:

- Inspect `src/kernel/`.
- Confirm types cover records, configuration, property paths, context manifests, ontology sets, named graphs, warnings/errors, and transform results.

Approve if:

- The type surface matches the v1.0 spec closely enough for implementation and testing.

Block if:

- Types are missing major spec concepts.
- Types depend on adapter or UI modules.

### 2. Version Policy

Expected:

- Kernel enforces `sc:requiredTagTeamVersion`.
- Supported policies are implemented:
  - `sc:RejectOnMismatch`
  - `sc:WarnAndRunOnMismatch`
  - `sc:AllowCompatibleMinor`

Human check:

- Inspect version-policy code.
- Inspect tests for matching and mismatching versions.

Approve if:

- Version mismatch behavior is deterministic and represented as JSON-LD warnings/errors.

Block if:

- Runtime version mismatches silently proceed under reject policy.
- Version policy uses unstructured string errors.

### 3. Local Context Resolution

Expected:

- Kernel resolves compact IRIs using local context manifests.
- Kernel does not fetch remote contexts.
- Missing terms emit `sc:ContextResolutionError`.

Human check:

- Inspect context resolution implementation.
- Inspect tests for successful local resolution and missing term failure.

Approve if:

- Semantic property paths do not depend on compacted JSON key spelling.

Block if:

- Resolution uses fragile JSONPath-like strings.
- Missing context terms fail silently.

### 4. Semantic Property Path Resolution

Expected:

- Kernel implements path traversal rules from `project/SPEC.md`.
- Multi-value policy exists at least for `sc:EnrichEachValue`.
- Non-string, node, and empty values produce JSON-LD warnings/errors.

Human check:

- Inspect path resolver.
- Inspect tests for string, multi-value, non-string, node, and missing path behavior.

Approve if:

- Property path behavior is explicit and deterministic.

Block if:

- Multi-value behavior is undefined.
- Language/string eligibility is undocumented or untested.

### 5. `enrichRecord`

Expected:

- Normative `enrichRecord(...)` exists.
- It accepts record, configuration, context manifest, ontology set, and injected TagTeam runtime.
- It returns enriched record, named graph, and warning/error resources.
- It catches recoverable TagTeam failures.

Human check:

- Inspect kernel transform/enrichment implementation.
- Confirm TagTeam runtime is injected rather than imported through an adapter or remote URL.

Approve if:

- The function is pure and adapter-independent.

Block if:

- The kernel reads files, writes files, uses network APIs, uses IndexedDB, reads environment variables, uses time, or uses randomness.

### 6. Named Graph Output

Expected:

- TagTeam output appears in a named graph resource using top-level `@graph`.
- Graph output is not stored as an opaque JSON string.
- Enriched record links to named graph ID.

Human check:

- Inspect example output and tests.

Approve if:

- Output shape matches `project/SPEC.md` section 12.

Block if:

- Output uses `sc:jsonld` or similar opaque wrapper for graph payload.

### 7. Examples and Snapshot

Expected:

- Template examples are replaced with SemantiCore examples.
- Snapshot test compares against SemantiCore expected output.

Human check:

- Open `examples/input.jsonld`.
- Open `examples/expected-output.jsonld`.
- Run `npm test`.

Approve if:

- Example input/output are representative of minimal SemantiCore behavior.

Block if:

- Examples still describe template identity transform only.

### 8. Conformance Tests

Expected:

- Phase 1 adds SemantiCore-specific tests in addition to template baseline tests.

Minimum expected tests:

- Deterministic rerun test.
- Offline context test.
- Context failure test.
- TagTeam version mismatch test.
- Named graph output test.
- TagTeam runtime error test.
- No-network test.
- Kernel purity test.

Human check:

```bash
npm ci
npm test
npm run test:purity
```

Approve if:

- Tests pass locally and in CI.

Block if:

- CI fails.
- Kernel purity fails.
- SemantiCore-specific tests are missing.

## Blocking Conditions

Do not approve Phase 1 if any of these are true:

- Kernel code performs I/O, network access, IndexedDB access, time access, randomness, or environment access.
- `enrichRecord` does not exist.
- TagTeam runtime is not injected.
- Version mismatch policy is not implemented.
- Semantic property paths are unresolved or JSONPath-based.
- Named graph output is opaque rather than JSON-LD `@graph`.
- Recoverable errors throw instead of producing JSON-LD warning/error resources.
- Existing template tests fail.
- Kernel purity check fails.

## Known Non-Blocking Notes

The reviewer may choose to allow these if documented:

- Full RDFC-1.0 canonicalization deferred to Phase 6, if Phase 1 still proves stable sorted-key deterministic output.
- Real TagTeam bundle loading deferred to Phase 5, if Phase 1 uses an injected deterministic TagTeam test runtime.
- Full CSV/JSON adapters deferred to Phase 2.

## Approval Record

Complete this section at Phase 1 review.

### Reviewer

Name:
Aaron

Date:
2026-05-12

Commit reviewed:
5d38325

### Checklist

- [x] Kernel types cover SemantiCore structures.
- [x] Version policy is implemented and tested.
- [x] Local context resolution is implemented and tested.
- [x] Semantic property path resolution is implemented and tested.
- [x] `enrichRecord` exists and is pure.
- [x] Recoverable TagTeam errors become JSON-LD warning/error resources.
- [x] Named graph output uses top-level `@graph`.
- [x] Examples are SemantiCore examples.
- [x] SemantiCore-specific tests exist.
- [x] `npm test` passes.
- [x] `npm run test:purity` passes.
- [x] CI passes.
- [x] No adapter/infrastructure requirement entered the kernel.

### Decision

Choose one:

- [x] Approved: Begin Phase 2.
- [ ] Approved with non-blocking notes: Begin Phase 2 after recording notes.
- [ ] Not approved: Address blockers and repeat Phase 1 review.

### Notes

Add review notes here:
Approved. Proceed.
