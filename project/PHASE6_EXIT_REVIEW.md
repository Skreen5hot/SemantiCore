# Phase 6 Exit Review: Determinism and Canonicalization Hardening

Status: Ready for Human Review  
Date prepared: 2026-05-13  
Phase started after Phase 5 approval

## Implementation Submitted for Review

Phase 6 implementation is ready for human review in the commit that contains this document update.

What changed:

- Added kernel canonicalization helpers:
  - `canonicalizeJson`;
  - `stableStringify`;
  - `canonicalBytes`;
  - `canonicalContentHash`;
  - `sha256Hex`.
- Added pure SHA-256 hashing over canonical UTF-8 bytes.
- Added tests proving stable sorted-key JSON envelopes and SHA-256 content hashes.
- Removed demo-only duplicate browser run properties:
  - removed `records` duplicate of `sc:records`;
  - removed `graphs` duplicate of `sc:graphs`;
  - removed `warnings` duplicate of `sc:warnings`.
- Added a visible Hashes output tab to the browser workbench.
- Updated browser session, ontology, context, and hash report metadata to use SHA-256 content hashes.
- Documented the canonicalization strategy and the remaining RDFC-1.0 gap in [CANONICALIZATION.md](./CANONICALIZATION.md).
- Added an explicit TagTeam text source selector and persisted `sc:tagTeamSourcePropertyPath`.
- Changed the browser sample/default mapping to `Text -> schema:text` so TagTeam input semantics are explicit and not inferred from `schema:description`.

Verification run before review:

- `npm.cmd test`
- `npm.cmd run test:purity`
- `npm.cmd run build`
- `node --check app/main.js`

## Purpose

This document defines the human approval gate for leaving Phase 6 and beginning Phase 7.

Phase 6 proves that SemantiCore output is less demo-shaped and more reproducible: JSON object envelopes are sorted, hashes are SHA-256 over canonical bytes, output duplicates are removed, and the remaining RDF dataset normalization gap is explicit.

Approval means: "The current SemantiCore browser and Node surfaces produce stable, hashable JSON-LD envelopes and clearly document what remains before full RDF canonicalization."

Approval does not mean:

- full RDFC-1.0 / URDNA2015 graph normalization is complete;
- blank-node graph canonicalization is complete;
- large-file streaming is complete;
- production accessibility polish is complete.

## Demo Checklist

Use the deployed GitHub Pages site or a local static server serving `app/`.

### 1. Phase And Output Surface

Expected:

- The page clearly says Phase 6.
- A Hashes output tab is visible.
- Running sample enrichment still works.
- The enriched output no longer contains duplicate top-level `records`, `graphs`, or `warnings` aliases.
- The Run panel exposes a TagTeam text source selector.
- The default source path is `sc:source / schema:text`.

Block if:

- The page still presents Phase 5 as the current phase.
- Canonical output still depends on duplicate convenience keys.

### 2. Canonical Hash Report

Expected:

- The Hashes tab shows `sc:CanonicalHashReport`.
- The report states `sha256`.
- Dataset, run, graph bundle, and warning hashes are visible.
- Re-running the same sample does not change hashes.

Block if:

- Hashes are short demo hashes while labeled `sha256`.
- Hash report is not inspectable.

### 3. Explicit TagTeam Source Path

Expected:

- The mapping manifest includes `sc:tagTeamSourcePropertyPath`.
- The default sample maps `Text -> schema:text`.
- The TagTeam source selector shows `Text -> schema:text`.
- The enrichment record reports `sc:sourcePropertyPath` as `sc:source / schema:text`.

Block if:

- TagTeam input is chosen by a hidden first-column or description heuristic.
- The app defaults the TagTeam source text to `schema:description`.

### 4. Kernel Canonicalization

Expected:

- Tests prove recursive sorted-key serialization.
- Tests prove SHA-256 for known bytes.
- Tests prove canonical content hash for a known JSON object.
- Kernel purity still passes.

Block if:

- Hashing imports filesystem, network, time, randomness, or environment state.
- Canonicalization mutates caller input.

### 5. Documented RDFC Gap

Expected:

- The canonicalization note plainly says full RDFC-1.0 is not implemented.
- The note explains why current fixtures remain deterministic.
- The note names future work before production-grade RDF graph interchange.

Block if:

- The project claims full RDF dataset normalization without implementing it.

## Blocking Conditions

Do not approve Phase 6 if any of these are true:

- Tests fail.
- Kernel purity fails.
- Browser output still includes duplicate top-level convenience aliases.
- TagTeam source text is selected by hidden heuristic instead of explicit source-path configuration.
- Content hashes are not SHA-256 over canonical bytes.
- The RDFC-1.0 gap is hidden or misrepresented.
- A server, database, CDN, or cloud dependency is introduced.

## Known Non-Blocking Notes

The reviewer may choose to allow these if documented:

- Full RDFC-1.0 / URDNA2015 remains future work.
- Browser hashing mirrors the kernel helper rather than importing a shared bundle.
- The static browser app still uses hand-written JavaScript until a later bundling decision.

## Approval Record

Complete this section at Phase 6 review.

### Reviewer

Name:

Date:

Commit reviewed:

### Checklist

- [ ] Page shows Phase 6.
- [ ] Hashes tab is visible.
- [ ] Hashes tab shows `sc:CanonicalHashReport`.
- [ ] TagTeam text source selector is visible.
- [ ] Default source path is `sc:source / schema:text`.
- [ ] Mapping manifest includes `sc:tagTeamSourcePropertyPath`.
- [ ] Hashes are `sha256`.
- [ ] Re-running sample keeps hashes stable.
- [ ] Enriched output has no top-level `records` alias.
- [ ] Enriched output has no top-level `graphs` alias.
- [ ] Enriched output has no top-level `warnings` alias.
- [ ] Kernel canonicalization tests pass.
- [ ] Kernel SHA-256 tests pass.
- [ ] `npm test` passes.
- [ ] `npm run test:purity` passes.
- [ ] `npm run build` passes.
- [ ] CI passes.
- [ ] RDFC-1.0 gap is documented.
- [ ] No required infrastructure was introduced.

### Decision

Choose one:

- [ ] Approved: Begin Phase 7.
- [ ] Approved with non-blocking notes: Begin Phase 7 after recording notes.
- [ ] Not approved: Address blockers and repeat Phase 6 review.

### Notes

Add review notes here:
