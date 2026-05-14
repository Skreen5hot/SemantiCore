# Phase 8 Exit Review: Optional Integration Surfaces

Phase started after Phase 7 approval on 2026-05-14.

This document defines the human approval gate for leaving Phase 8 and beginning Phase 9.

Phase 8 proves that SemantiCore can introduce optional integration surfaces without weakening the local-first architecture: no remote integration is active by default, the browser app exposes the integration policy, and core behavior remains valid offline.

## Current Scope

- Candidate integration inventory.
- Visible no-data-egress default.
- Explicit opt-in policy for future remote validators, resolvers, sync, or publishing.
- Continued no-network guarantee for the kernel and browser MVP.

## Delivered In Initial Phase 8 Slice

- Updated the app to show Phase 8.
- Added a Phase 8 review link.
- Added an Optional Integrations panel with inactive candidate integrations.
- Added an inspectable Integration Policy JSON-LD block.
- Kept offline enrichment and export as valid default behavior.

## Review Checklist

- [ ] Page shows Phase 8.
- [ ] Optional integration candidates are visible.
- [ ] No remote integration is active by default.
- [ ] Data-egress default is visible as `sc:NoDataEgress`.
- [ ] Explicit opt-in policy is visible.
- [ ] Offline enrichment and export remain fully valid.
- [ ] `src/kernel` remains free of integration coupling.
- [ ] Core tests remain no-network.
- [ ] `npm.cmd test` passes.
- [ ] `npm.cmd run test:purity` passes.
- [ ] `npm.cmd run build` passes.

## Non-Blocking Notes

- This phase starts with policy and UX surfaces only. Actual remote validators, resolvers, or publishing flows require separate opt-in design and review.
- Phase 6 export lessons remain active constraints: generated artifacts must stay valid JSON-LD, traceable, and clear about graph shape.

## Approval

Complete this section at Phase 8 review.

- [ ] Approved: Begin Phase 9.
- [ ] Approved with non-blocking notes: Begin Phase 9 after recording notes.
- [ ] Not approved: Address blockers and repeat Phase 8 review.
