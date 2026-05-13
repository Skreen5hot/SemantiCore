# Phase 5 Exit Review: Real TagTeam Runtime Integration

Status: Approved  
Date prepared: 2026-05-13  
Phase started after Phase 4 approval

## Implementation Submitted for Review

Phase 5 implementation is ready for human review in the commit that contains this document update.

What changed:

- Added a visible Runtime panel to the GitHub Pages workbench:
  - active runtime mode;
  - local TagTeam bundle loader;
  - required TagTeam version;
  - version policy selector;
  - ontology-passing toggle;
  - runtime diagnostics JSON-LD inspector.
- Added browser detection for a local `window.TagTeam` runtime.
- Added local bundle loading from a reviewer-selected JavaScript file.
- Kept the deterministic fallback runtime visible when TagTeam is not present.
- Added browser version policy enforcement for runtime mismatch behavior.
- Added browser ontology option wiring when `OntologyTextTagger.fromTTL` is available.
- Added a Node adapter that wraps any TagTeam-like object with `version`, `buildGraph`, and optional `OntologyTextTagger.fromTTL`.
- Updated static app tests and adapter tests.

Verification run before review:

- `npm.cmd test`
- `npm.cmd run test:purity`
- `npm.cmd run build`
- `node --check app/main.js`

## Purpose

This document defines the human approval gate for leaving Phase 5 and beginning Phase 6.

Phase 5 proves that SemantiCore can invoke a real local TagTeam.js runtime through adapter boundaries while preserving fallback execution, version-policy visibility, ontology state visibility, and JSON-LD graph output.

Approval means: "SemantiCore can run with a locally supplied TagTeam runtime without making TagTeam a hidden kernel dependency or requiring remote infrastructure."

Approval does not mean:

- TagTeam is vendored into this repository;
- remote/CDN runtime loading is allowed;
- production canonicalization hardening is complete;
- large-file streaming is complete;
- the fallback runtime is semantically equivalent to TagTeam.

## Demo Checklist

Use the deployed GitHub Pages site or a local static server serving `app/`.

### 1. Runtime Panel

Expected:

- The page clearly says Phase 5.
- Runtime controls are visible before enrichment.
- Runtime diagnostics are visible as JSON-LD.
- The app reports whether it is using fallback or local TagTeam.

Block if:

- Runtime selection is hidden.
- The page gives no evidence of which runtime produced the output.

### 2. Fallback Runtime

Expected:

- With no TagTeam bundle loaded, the deterministic fallback runtime still runs the sample.
- Output graphs still use top-level `@graph`.
- Runtime diagnostics identify fallback execution.
- Version policy can block or allow execution.

Block if:

- No local enrichment is possible without downloading anything.
- Fallback behavior is mislabeled as real TagTeam output.

### 3. Local TagTeam Bundle

Expected:

- Reviewer can select a local `tagteam.js` bundle.
- After load, diagnostics identify TagTeam and expose its version.
- Running enrichment uses `TagTeam.buildGraph`.
- Output graph nodes are attached under SemantiCore named graph resources.

Block if:

- Runtime loading requires a CDN or remote fetch.
- TagTeam graph output is wrapped as an opaque string or hidden payload.

### 4. Version Policy

Expected:

- Required version and policy controls are visible.
- Exact match can run.
- Reject-on-mismatch blocks enrichment and emits `sc:TagTeamVersionMismatch`.
- Warn-and-run emits `sc:TagTeamVersionMismatch` but still runs.

Block if:

- Version mismatch silently runs without a warning.
- Version mismatch behavior is not inspectable in JSON-LD output.

### 5. Ontology Wiring

Expected:

- Enabled ontology TTL can be passed to TagTeam when `OntologyTextTagger.fromTTL` exists.
- If ontology support is unavailable, the app emits `sc:OntologyUnavailable`.
- Non-CCO/BFO alignment warnings are preserved.

Block if:

- Enabled ontologies silently disappear from runtime options.
- Non-aligned ontology warnings are lost.

### 6. Boundary And Verification

Expected:

- Kernel purity still passes.
- TagTeam integration lives in browser/app or integration adapter code.
- No required database, server, package registry, CDN, or cloud service is introduced.

Human check:

```bash
npm ci
npm test
npm run test:purity
npm run build
```

Browser check:

- Load sample CSV.
- Inspect Runtime diagnostics JSON-LD.
- Run enrichment with fallback.
- Change required version to `8.0.0` and confirm reject-on-mismatch behavior.
- Change policy to warn-and-run and confirm warning plus output.
- If a local TagTeam bundle is available, load it and rerun enrichment.
- Inspect graph JSON-LD and enriched output.

## Blocking Conditions

Do not approve Phase 5 if any of these are true:

- Kernel imports TagTeam directly.
- Runtime loading requires a network call.
- Runtime version mismatch is silent.
- Runtime diagnostics are not visible.
- Real TagTeam graph output cannot be represented as `@graph`.
- Tests fail.
- Kernel purity fails.

## Known Non-Blocking Notes

The reviewer may choose to allow these if documented:

- A real TagTeam bundle is not committed into SemantiCore.
- The browser app still uses static JavaScript rather than a formal bundler.
- Fallback graph output remains a deterministic demo runtime.
- Full RDFC-1.0/JCS canonical hashing remains Phase 6.
- Large dataset streaming remains a later phase.

## Approval Record

Complete this section at Phase 5 review.

### Reviewer

Name:
Aaron

Date:
2026-05-13

Commit reviewed:
2a6121f

### Checklist

- [x] Runtime panel is visible.
- [x] Runtime diagnostics JSON-LD is inspectable.
- [x] Fallback runtime is clearly labeled.
- [x] Fallback runtime can enrich sample data.
- [x] Local TagTeam bundle loading is visible.
- [x] Local TagTeam runtime uses `buildGraph` when loaded.
- [x] Version match behavior works.
- [x] Reject-on-mismatch behavior works.
- [x] Warn-and-run mismatch behavior works.
- [x] Version mismatch warnings are inspectable.
- [x] Ontology support behavior is visible.
- [x] Non-aligned ontology warnings are preserved.
- [x] Output graphs use top-level `@graph`.
- [x] `npm test` passes.
- [x] `npm run test:purity` passes.
- [x] `npm run build` passes.
- [x] CI passes.
- [x] No required infrastructure was introduced.

### Decision

Choose one:

- [x] Approved: Begin Phase 6.
- [ ] Approved with non-blocking notes: Begin Phase 6 after recording notes.
- [ ] Not approved: Address blockers and repeat Phase 5 review.

### Notes

Approved by the product owner/human reviewer. Phase 6 may begin.
