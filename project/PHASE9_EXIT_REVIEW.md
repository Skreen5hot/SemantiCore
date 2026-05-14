# Phase 9 Exit Review: Integration Preflight and Consent

Phase started after Phase 8 approval on 2026-05-14.

This document defines the human approval gate for leaving Phase 9 and beginning Phase 10.

Phase 9 proves that future optional integrations have a user-visible preflight path before any data leaves the browser: destination, payload scope, approval action, and artifact-hash decision evidence must be visible while the default app remains offline and no-network.

## Current Scope

- Integration preflight checklist.
- JSON-LD preflight report.
- Destination review requirement.
- Payload-scope review requirement.
- Explicit approval requirement.
- Artifact-hash and decision evidence requirement.

## Delivered In Initial Phase 9 Slice

- Updated the app to show Phase 9.
- Added a Phase 9 review link.
- Added a preflight checklist to the Optional Integrations panel.
- Added an inspectable Integration Preflight JSON-LD block.
- Kept active integration count and network request count at zero.

## Review Checklist

- [ ] Page shows Phase 9.
- [ ] Integration preflight checklist is visible.
- [ ] Preflight JSON-LD is visible.
- [ ] Preflight reports zero active integrations.
- [ ] Preflight reports zero network requests.
- [ ] Destination review is required before transmission.
- [ ] Payload-scope review is required before transmission.
- [ ] Explicit approval is required before transmission.
- [ ] Artifact hash and integration decision recording are required.
- [ ] `src/kernel` remains free of integration coupling.
- [ ] Core tests remain no-network.
- [ ] `npm.cmd test` passes.
- [ ] `npm.cmd run test:purity` passes.
- [ ] `npm.cmd run build` passes.

## Non-Blocking Notes

- This phase still does not implement remote validators, resolvers, publishing, or sync. It defines the consent and evidence gate those features must satisfy later.
- A future implementation phase should attach preflight decisions to downloaded or published artifacts as JSON-LD resources.

## Approval

Complete this section at Phase 9 review.

- [ ] Approved: Begin Phase 10.
- [ ] Approved with non-blocking notes: Begin Phase 10 after recording notes.
- [ ] Not approved: Address blockers and repeat Phase 9 review.
