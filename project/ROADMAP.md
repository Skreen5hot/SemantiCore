# SemantiCore Roadmap

This roadmap is the working plan for building SemantiCore on top of the JSON-LD Deterministic Service Template.

The template's `docs/` directory defines the architecture contract. The `project/` directory defines SemantiCore's domain, sequencing, and implementation boundaries.

## Phase 0: Repository Activation and App Runway

**Goal:** Convert the template repository into the SemantiCore project shell without violating the edge-canonical kernel contract.

**Status:** Complete

### 0.1 Publish the SemantiCore v1.0 Spec

**Status:** Complete | **Priority:** Critical

Replace the template placeholder spec with the hardened SemantiCore v1.0 specification.

**Acceptance Criteria:**
- [x] `project/SPEC.md` names SemantiCore as the project.
- [x] Spec distinguishes SemantiCore from TagTeam.js.
- [x] Spec requires edge-canonical browser / `node index.js` execution.
- [x] Spec defines JSON-LD canonical inputs, outputs, manifests, sessions, warnings, and named graphs.
- [x] Spec defines TagTeam version pinning and deterministic canonicalization requirements.

### 0.2 Rebrand Template Metadata

**Status:** Complete | **Priority:** High

Update repository-facing metadata so install/build/test outputs identify the project as SemantiCore rather than the starter template.

**Acceptance Criteria:**
- [x] `package.json` package name, description, repository, homepage, and keywords are SemantiCore-specific.
- [x] Root `README.md` explains SemantiCore's purpose and preserves the template contract.
- [x] `project/README.md` describes the project workspace for future agents.

### 0.3 Create GitHub Pages App Shell

**Status:** Complete | **Priority:** High

Create the initial static browser app shell that GitHub Pages can publish before the full workbench exists.

**Acceptance Criteria:**
- [x] `app/index.html` exists and loads without a build step.
- [x] App shell communicates SemantiCore's current state: spec published, implementation next.
- [x] App shell has placeholders for import, ontology/session, enrichment, and export surfaces.
- [x] No remote scripts or required network calls are introduced.

### 0.4 Add GitHub Pages Deployment Workflow

**Status:** Complete | **Priority:** High

Add a GitHub Actions workflow that publishes the static app shell to Pages.

**Acceptance Criteria:**
- [x] Workflow uses GitHub Pages Actions.
- [x] Workflow runs on pushes to `main`.
- [x] Workflow uploads the `app/` directory as the Pages artifact.
- [x] Existing CI remains responsible for kernel build/tests.

### 0.5 Record Project Decisions

**Status:** Complete | **Priority:** Medium

Persist the decisions that future agents need before they touch code.

**Acceptance Criteria:**
- [x] `project/DECISIONS.md` records SemantiCore naming and TagTeam relationship.
- [x] `project/DECISIONS.md` records GitHub Pages as the Phase 0 publication target.
- [x] Decisions preserve the core/adapters separation.

**Phase 0 Exit Criteria:**
- [x] CI passes on `main`.
- [x] GitHub Pages workflow publishes the static app shell.
- [x] A future agent can read `README.md`, `project/SPEC.md`, and this roadmap and know what to build next.
- [x] Human reviewer completes [PHASE0_EXIT_REVIEW.md](./PHASE0_EXIT_REVIEW.md) and approves Phase 1 start.

---

## Phase 1: SemantiCore Kernel Contract

**Goal:** Replace the template identity transform with SemantiCore's pure JSON-LD enrichment kernel surface.

**Status:** Ready for Human Review

### 1.1 Define Minimal Kernel Input/Output Fixtures

**Status:** Complete | **Priority:** Critical

Create representative JSON-LD fixtures for the smallest conforming SemantiCore enrichment run.

**Acceptance Criteria:**
- [x] `examples/input.jsonld` contains a SemantiCore dataset/config/context/ontology fixture or a documented fixture envelope.
- [x] `examples/expected-output.jsonld` contains canonical enriched records and named graph placeholders.
- [x] Fixtures exercise semantic property path resolution.
- [x] Fixtures avoid network-dependent contexts.

### 1.2 Implement Pure `enrichRecord` Semantics

**Status:** Complete | **Priority:** Critical

Implement the pure record-oriented kernel from `project/SPEC.md`.

**Acceptance Criteria:**
- [x] Core code performs no I/O, network, time, randomness, IndexedDB, or environment access.
- [x] Core validates TagTeam version policy through an injected runtime object.
- [x] Core resolves semantic property paths over local context information.
- [x] Core creates JSON-LD warning/error resources instead of throwing for recoverable failures.
- [x] `npm test` and `npm run test:purity` pass.

### 1.3 Add SemantiCore Conformance Tests

**Status:** Complete | **Priority:** High

Extend the template tests with SemantiCore-specific conformance cases.

**Acceptance Criteria:**
- [x] Deterministic rerun test covers SemantiCore output.
- [x] Offline context test covers local context manifests.
- [x] TagTeam version mismatch test exists.
- [x] Named graph output test exists.
- [x] Semantic path failure test emits `sc:ContextResolutionError`.

**NOT in scope for Phase 1:**
- CSV parser implementation.
- IndexedDB persistence.
- Full browser workbench.
- Remote ontology/context resolvers.

---

## Phase 2: Edge Adapters and Browser Workbench

**Goal:** Add local-first adapters around the pure kernel.

**Status:** Not Started

Planned adapter surfaces:
- CSV ingestion with mapping manifest.
- Plain JSON ingestion with JSON Pointer selection.
- Browser file import/export.
- IndexedDB session, ontology, dataset, run, and named graph storage.
- Static browser UI backed by local adapters.

**NOT in scope:**
- Required servers.
- Required databases.
- Required cloud sync.

---

## Phase 3: TagTeam Integration and Ontology UX

**Goal:** Wire the browser app to a local TagTeam runtime and ontology/session management workflow.

**Status:** Not Started

Planned surfaces:
- Local TagTeam bundle loading.
- TagTeam version policy enforcement.
- Ontology upload and set management.
- Record-level graph viewing.
- Enriched JSON-LD and CSV summary export.

---

## Phase 4: Production Hardening

**Goal:** Make SemantiCore robust enough for repeated local use and downstream graph consumers.

**Status:** Not Started

Planned surfaces:
- Larger conformance corpus.
- Deterministic canonicalization hardening.
- Accessibility pass.
- GitHub Pages polish.
- Fandaws/FNSR export validation hooks.
