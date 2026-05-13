# Phase 4 Exit Review: Local State, Sessions, and Ontology Management

Status: Ready for Human Review  
Date prepared: 2026-05-13  
Phase started after Phase 3 approval

## Implementation Submitted for Review

Phase 4 implementation is ready for human review in the commit that contains this document update.

What changed:

- Added visible Session controls to the GitHub Pages app:
  - Save Session
  - Restore Session
  - Clear
  - Download Session Snapshot
  - Session JSON-LD inspector
- Added browser IndexedDB-backed session persistence.
- Added hash-pinned session snapshot metadata using deterministic browser hashing.
- Added visible Ontology controls:
  - ontology name;
  - ontology content;
  - CCO/BFO alignment declaration;
  - add ontology;
  - enable/disable ontology entries;
  - ontology set JSON-LD inspector.
- Added visible Context manifest JSON-LD inspector.
- Added a small `src/adapters/persistence/` IndexedDB adapter boundary.
- Updated static app tests so Phase 4 persistence controls cannot disappear silently.

Verification run before review:

- `npm.cmd test`
- `npm.cmd run test:purity`
- `node --check app/main.js`

All passed locally on 2026-05-13.

## Purpose

This document defines the human approval gate for leaving Phase 4 and beginning Phase 5.

Phase 4 proves that SemantiCore can preserve local browser work without required infrastructure. A reviewer should be able to save a session, reload the page, restore the session, inspect hash-pinned session metadata, manage local ontology entries, and view context/ontology manifests as JSON-LD.

Approval means: "The browser workbench can preserve and resume local work through a declared state adapter boundary."

Approval does not mean:

- real TagTeam.js runtime loading is complete;
- cloud sync exists;
- multi-device collaboration exists;
- remote ontology/context resolution exists.

## Demo Checklist

Use the deployed GitHub Pages site or a local static server serving `app/`.

### 1. Save And Restore Session

Expected:

- A visible control saves the current workbench session locally.
- The app reports that the session was saved.
- A visible control restores the saved session.
- A reload does not erase the saved session.

Block if:

- Session save requires a server or remote account.
- Restore cannot reconstruct input, mapping, dataset/run, and local manifests.

### 2. Session JSON-LD

Expected:

- The reviewer can inspect session JSON-LD.
- Session references include stable document IDs and content hashes where possible.
- Snapshot export can inline the local working state.

Block if:

- Session metadata is opaque or not inspectable.

### 3. Ontology Manager

Expected:

- The reviewer can add a local ontology entry.
- The reviewer can name ontology entries.
- The reviewer can enable or disable ontology entries.
- Alignment can be declared as CCO/BFO aligned or not aligned.
- Ontology set manifest is visible as JSON-LD.

Block if:

- Ontology state is hidden from the user.
- Non-aligned ontology status cannot be represented.

### 4. Context Manifest

Expected:

- Default SemantiCore context manifest is visible locally.
- No remote context fetch is required.
- Missing terms still surface through SemantiCore warning behavior.

Block if:

- Context behavior relies on a network resolver.

### 5. Boundary And Verification

Expected:

- Kernel purity still passes.
- State behavior stays in browser/app or persistence adapter code.
- No required database, server, or cloud service is introduced.

Human check:

```bash
npm ci
npm test
npm run test:purity
```

Browser check:

- Run sample enrichment.
- Save session.
- Reload page.
- Restore session.
- Inspect session JSON-LD.
- Add and toggle ontology entries.
- Inspect ontology set JSON-LD.

## Blocking Conditions

Do not approve Phase 4 if any of these are true:

- Kernel imports persistence code.
- Save/restore requires a server.
- Session JSON-LD is not inspectable.
- Ontology set manifest is not inspectable.
- Tests fail.
- Kernel purity fails.

## Known Non-Blocking Notes

The reviewer may choose to allow these if documented:

- Browser persistence uses IndexedDB only; Node filesystem persistence may remain later adapter work.
- Content hashes use deterministic browser hashing rather than full RDFC-1.0 canonical hashes until Phase 6 hardening.
- Real TagTeam runtime remains Phase 5.

## Approval Record

Complete this section at Phase 4 review.

### Reviewer

Name:

Date:

Commit reviewed:

### Checklist

- [ ] Local session save is visible and works.
- [ ] Local session restore is visible and works after reload.
- [ ] Session JSON-LD is inspectable.
- [ ] Snapshot export includes local working state.
- [ ] Ontology entries can be added.
- [ ] Ontology entries can be enabled/disabled.
- [ ] Ontology alignment can be declared.
- [ ] Ontology set JSON-LD is inspectable.
- [ ] Context manifest JSON-LD is inspectable.
- [ ] `npm test` passes.
- [ ] `npm run test:purity` passes.
- [ ] CI passes.
- [ ] No required infrastructure was introduced.

### Decision

Choose one:

- [ ] Approved: Begin Phase 5.
- [ ] Approved with non-blocking notes: Begin Phase 5 after recording notes.
- [ ] Not approved: Address blockers and repeat Phase 4 review.

### Notes

Add review notes here:
