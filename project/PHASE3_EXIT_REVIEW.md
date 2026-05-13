# Phase 3 Exit Review: Browser Workbench MVP

Status: Approved  
Date prepared: 2026-05-12  
Phase started after Phase 2 approval

## Purpose

This document defines the human approval gate for leaving Phase 3 and beginning Phase 4.

Phase 3 proves that the GitHub Pages app is visibly usable: a reviewer can import or load sample data, inspect mapping, run local enrichment, inspect JSON-LD outputs, and export derived results.

Approval means: "A user can exercise the SemantiCore loop in the browser without required infrastructure."

Approval does not mean:

- IndexedDB persistence is complete;
- real TagTeam bundle loading is complete;
- ontology management is complete;
- production accessibility polish is complete;
- cloud sync or remote integration exists.

## Reviewer Role

Review as a product owner, not as a compiler.

The core question is:

Can I see and use a local-first SemantiCore workflow on GitHub Pages?

## Demo Checklist

Use the deployed GitHub Pages site or a local static server serving `app/`.

### 1. Load Sample

Expected:

- A visible button loads a sample CSV.
- The app shows parsed records.
- Mapping defaults are visible.

Block if:

- The page is still only a static project status shell.

### 2. Import Local Data

Expected:

- A file input accepts local CSV, JSON, or JSON-LD.
- Data is read locally in the browser.
- No upload or remote service is required.

Block if:

- Import requires a server, login, or network endpoint.

### 3. Mapping Preview

Expected:

- The reviewer can see or edit source field to JSON-LD property mapping.
- Header-row behavior is explicit for CSV.
- Mapping manifest JSON-LD is visible.

Block if:

- Mapping behavior is hidden or implicit.

### 4. Source Path and Enrichment

Expected:

- The reviewer can see the source property path.
- A run button executes local enrichment.
- The app displays processed/skipped/failed counts.
- Recoverable warnings are visible.

Block if:

- The user cannot trigger enrichment from the page.

### 5. Results and Graphs

Expected:

- A record table shows status, source text, counts, graph ID, and warning codes.
- Selecting or reviewing output exposes enriched JSON-LD and named graph JSON-LD.
- Named graph output uses top-level `@graph`.

Block if:

- Output is opaque or not inspectable.

### 6. Exports

Expected:

- The page offers JSON-LD, graph bundle, and CSV summary exports.
- Export previews are visible before download.
- CSV summary does not embed full graphs in cells.

Block if:

- Export is absent or cannot be inspected.

## Technical Review Inputs

Review these files and areas:

- `app/`
- `project/detailPlan.md`
- `project/ROADMAP.md`
- `src/adapters/integration/`
- `src/kernel/`
- `tests/`

## Verification

Human check:

```bash
npm ci
npm test
npm run test:purity
```

Browser check:

- Open the GitHub Pages site.
- Load sample data.
- Run enrichment.
- Inspect result table.
- Inspect JSON-LD and graph outputs.
- Export CSV summary.

## Blocking Conditions

Do not approve Phase 3 if any of these are true:

- The Pages app remains only a status shell.
- The reviewer cannot run a sample workflow.
- Import requires a remote service.
- Enrichment output is not visible.
- Named graphs are not inspectable.
- Tests fail.
- Kernel purity fails.

## Known Non-Blocking Notes

The reviewer may choose to allow these if documented:

- The browser MVP uses a deterministic stub TagTeam runtime until real TagTeam loading in Phase 5.
- The app uses static browser JavaScript rather than a build pipeline.
- IndexedDB persistence is deferred to Phase 4.

## Approval Record

Complete this section at Phase 3 review.

### Reviewer

Name:
Aaron

Date:
2026-05-13

Commit reviewed:
fe6f333

### Checklist

- [x] Sample CSV workflow is visible and usable.
- [x] Local file import exists.
- [x] Mapping manifest is visible.
- [x] Source path is visible.
- [x] Enrichment can be triggered from the page.
- [x] Results table is populated.
- [x] Enriched JSON-LD is inspectable.
- [x] Named graph JSON-LD is inspectable.
- [x] CSV summary export is available.
- [x] `npm test` passes.
- [x] `npm run test:purity` passes.
- [x] CI passes.
- [x] No required infrastructure was introduced.

### Decision

Choose one:

- [x] Approved: Begin Phase 4.
- [ ] Approved with non-blocking notes: Begin Phase 4 after recording notes.
- [ ] Not approved: Address blockers and repeat Phase 3 review.

### Notes

Add review notes here:
Reviewed and approved.
