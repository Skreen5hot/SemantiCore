# Phase 0 Exit Review: Repository Activation and App Runway

Status: Ready for human review  
Date prepared: 2026-05-12  
Prepared from commit: `aa620107becdf6774e9653b4397b7f53c77e48aa`

## Purpose

This document is the human approval package for leaving Phase 0 and beginning Phase 1.

Phase 0 does not prove that SemantiCore works as a full app. Phase 0 proves that the repository is correctly activated, named, published as a static shell, and ready for kernel implementation without ambiguity.

The human reviewer should approve Phase 0 only if the repository now answers these questions clearly:

1. What is this project?
2. What spec governs it?
3. Where is the roadmap?
4. Where will the browser app be published?
5. Does the template's kernel purity contract still hold?
6. Is it clear what Phase 1 should build next?

## Reviewer Role

The reviewer is expected to be direct and literal. Do not infer intent from conversation history. Review the files and links as if you are a new maintainer landing in the repo for the first time.

Approval means: "This repo is ready to begin Phase 1 kernel implementation."

Approval does not mean:

- the SemantiCore app is functionally complete;
- TagTeam is integrated;
- CSV import works;
- IndexedDB sessions work;
- GitHub Pages has the final UX;
- all future architecture questions are settled.

## Review Inputs

Review these repository files:

- `README.md`
- `project/SPEC.md`
- `project/ROADMAP.md`
- `project/detailPlan.md`
- `project/DECISIONS.md`
- `project/README.md`
- `app/index.html`
- `app/styles.css`
- `app/main.js`
- `.github/workflows/ci.yml`
- `.github/workflows/pages.yml`
- `package.json`

Review these repository areas:

- `src/kernel/`
- `src/adapters/`
- `tests/`
- `docs/`

## Phase 0 Deliverables

### 1. SemantiCore Identity

Expected:

- The project is named SemantiCore.
- The old draft name `TagTeam Data Enricher` is explained as superseded.
- The relationship to TagTeam.js is clear: TagTeam is the semantic graph engine; SemantiCore is the workbench and deterministic enrichment system around it.

Human check:

- Open `README.md`.
- Confirm the first section names SemantiCore.
- Confirm README does not present the repo as only a generic template.
- Open `project/SPEC.md`.
- Confirm Section 1 explains SemantiCore and TagTeam.js.

Approve if:

- A new reader can understand that this is the SemantiCore repo and not the TagTeam.js repo.

Block if:

- The repo still reads primarily as `json-ld-deterministic-service-template`.
- The reader could reasonably think SemantiCore specs belong in the TagTeam.js repo.

### 2. Published v1.0 Spec

Expected:

- `project/SPEC.md` is the SemantiCore v1.0 specification.
- The spec is edge-canonical.
- The spec defines JSON-LD as canonical.
- The spec requires deterministic execution.
- The spec defines TagTeam version pinning.
- The spec defines named graph output.

Human check:

- Open `project/SPEC.md`.
- Confirm it starts with `# SemantiCore v1.0 Specification`.
- Confirm these sections exist:
  - `2.3 Determinism Is Mandatory`
  - `5. Core Computation Interface`
  - `6. Enrichment Configuration`
  - `8. Semantic Property Path Semantics`
  - `12. Named Graph Output`
  - `23. Conformance Tests`
  - `24. Conformance Checklist`

Approve if:

- The spec is detailed enough for Phase 1 kernel work to start without inventing architecture.

Block if:

- The spec is missing required determinism, TagTeam version, JSON-LD pathing, or named graph requirements.

### 3. Roadmap and Detailed Plan

Expected:

- `project/ROADMAP.md` gives the phase overview.
- `project/detailPlan.md` gives implementation-grade work packages and acceptance criteria.
- Phase 1 begins with the pure kernel, not UI or adapters.

Human check:

- Open `project/ROADMAP.md`.
- Confirm Phase 0 exists and is about repository activation and app runway.
- Confirm Phase 1 is about the SemantiCore kernel contract.
- Open `project/detailPlan.md`.
- Confirm Phase 1 includes:
  - kernel types;
  - version policy;
  - local context resolution;
  - semantic property path resolution;
  - `enrichRecord`;
  - conformance tests.

Approve if:

- It is obvious what work starts next.

Block if:

- The next phase starts with UI, CSV adapters, IndexedDB, or real TagTeam integration before the pure kernel contract exists.

### 4. GitHub Pages App Shell

Expected:

- `app/` contains a static shell for GitHub Pages.
- It does not require a build step.
- It does not require network calls.
- It represents Phase 0 truthfully as a shell, not a complete product.

Human check:

- Open `app/index.html` locally or through GitHub Pages if deployed.
- Confirm page title says SemantiCore.
- Confirm the page says Phase 0 or equivalent.
- Confirm it does not claim functional CSV/JSON enrichment exists yet.
- Confirm no remote scripts are loaded.

Approve if:

- The shell is accurate, static, and suitable as a placeholder for the future workbench.

Block if:

- The shell misrepresents app readiness.
- The shell requires remote scripts or services.

### 5. GitHub Pages Workflow

Expected:

- `.github/workflows/pages.yml` exists.
- It deploys `app/`.
- It uses GitHub Pages Actions.
- It does not replace or weaken CI.

Human check:

- Open GitHub repository Actions tab.
- Confirm `Deploy Pages` workflow exists.
- Confirm latest run on `main` succeeds.
- Open repository Settings -> Pages.
- Confirm Pages source is GitHub Actions.
- Confirm the Pages URL loads the SemantiCore shell.

Approve if:

- GitHub Pages deploys successfully and the shell loads.

Block if:

- Pages is not enabled for GitHub Actions.
- The workflow fails.
- The deployed page is blank, missing, or old.

Note:

- The local connector did not return workflow runs for the latest commit during preparation. Human GitHub UI verification is required.

### 6. Kernel Purity and Tests

Expected:

- The template kernel is still pure.
- Existing tests pass.
- No Phase 0 work introduced kernel I/O or network behavior.

Prepared verification:

```bash
npm.cmd test
npm.cmd run test:purity
```

Observed local result:

- `npm.cmd test`: passed, 6/6 tests.
- `npm.cmd run test:purity`: passed.

Human check:

- In GitHub Actions, confirm CI passes on the latest `main`.
- Optionally run locally:

```bash
npm ci
npm test
npm run test:purity
```

Approve if:

- CI passes.
- Kernel purity check passes.

Block if:

- CI fails.
- Kernel purity fails.
- Any Phase 0 change touched `src/kernel/` without explanation.

### 7. Package Metadata

Expected:

- `package.json` identifies SemantiCore.
- `package-lock.json` root metadata matches.

Human check:

- Open `package.json`.
- Confirm:
  - `name` is `semanticore`;
  - description mentions SemantiCore purpose;
  - repository points to `Skreen5hot/SemantiCore`;
  - homepage points to GitHub Pages.
- Open `package-lock.json`.
- Confirm root package name is `semanticore`.

Approve if:

- Package metadata no longer looks like a generic starter template.

Block if:

- Package metadata still names the old template.

### 8. Architecture Decision Records

Expected:

- Decisions explain why the repo is SemantiCore.
- Decisions explain why Pages is used now.
- Decisions preserve adapter boundaries.

Human check:

- Open `project/DECISIONS.md`.
- Confirm ADR-001 has a real date.
- Confirm ADR-002 names SemantiCore.
- Confirm ADR-003 names GitHub Pages as publication target.

Approve if:

- Future agents can understand these choices without chat history.

Block if:

- Decisions are missing, vague, or contradict the spec.

## Known Non-Blocking Notes

These items do not block Phase 0 approval unless the reviewer chooses to make them blocking:

- `npm ci` reported 2 dependency audit findings in dev dependencies: 1 moderate, 1 high.
- The current app shell is static and not functional by design.
- The current kernel is still the template identity transform by design.
- GitHub workflow run discovery through the connector returned no runs, so human Actions UI review is required.

## Blocking Conditions

Do not approve Phase 0 if any of these are true:

- The deployed Pages app does not load.
- CI fails on `main`.
- Kernel purity fails.
- `project/SPEC.md` is not clearly SemantiCore v1.0.
- The repo still reads as a generic template rather than SemantiCore.
- Phase 1 scope is unclear.
- Any required server, database, or network service is introduced as core architecture.

## Approval Record

When human review is complete, record the result here or in a follow-up ADR.

### Reviewer

Name:

Date:

Commit reviewed:

### Checklist

- [ ] README identifies SemantiCore clearly.
- [ ] `project/SPEC.md` is accepted as SemantiCore v1.0.
- [ ] `project/ROADMAP.md` is accepted as the phase roadmap.
- [ ] `project/detailPlan.md` is accepted as the implementation plan.
- [ ] `project/DECISIONS.md` preserves key decisions.
- [ ] GitHub Pages workflow succeeds.
- [ ] GitHub Pages app shell loads.
- [ ] CI succeeds.
- [ ] Kernel purity succeeds.
- [ ] No required infrastructure has entered core scope.

### Decision

Choose one:

- [ ] Approved: Begin Phase 1.
- [ ] Approved with non-blocking notes: Begin Phase 1 after recording notes.
- [ ] Not approved: Address blockers and repeat Phase 0 review.

### Notes

Add review notes here:

