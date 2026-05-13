# SemantiCore Detailed Implementation Plan

Status: Draft execution plan  
Date: 2026-05-12  
Source of truth: [SPEC.md](./SPEC.md)

## Purpose

This plan turns the SemantiCore v1.0 specification into buildable phases with clear acceptance criteria. It preserves the template architecture:

- `src/kernel/` contains pure deterministic computation only.
- `src/adapters/` contains file, browser, persistence, import/export, and remote integration code.
- `app/` contains the GitHub Pages browser workbench.
- `project/` contains project memory: spec, roadmap, decisions, and this plan.

The plan is intentionally staged so SemantiCore can become useful early without weakening the edge-canonical contract.

## Phase 0: Repository Activation and Publication Runway

**Goal:** Finish transforming the template repository into the SemantiCore project shell and make it visible on GitHub Pages.

**Status:** Complete

**Primary Outputs**
- SemantiCore-branded repository metadata.
- Published v1.0 specification.
- Static GitHub Pages app shell.
- Phase 1-ready project docs.

**Work Packages**

### 0.1 Project Identity
- Keep package metadata aligned with SemantiCore.
- Keep root README focused on SemantiCore, not the template.
- Preserve template docs as the architecture contract.

**Acceptance Criteria**
- `package.json` name is `semanticore`.
- README names SemantiCore and describes its relationship to TagTeam.js.
- `project/SPEC.md` is the SemantiCore v1.0 spec.
- `project/DECISIONS.md` records SemantiCore naming and TagTeam.js relationship.

### 0.2 GitHub Pages Shell
- Maintain `app/index.html`, `app/styles.css`, and `app/main.js`.
- Publish static app through GitHub Pages Actions.
- Keep shell static and offline-safe.

**Acceptance Criteria**
- `app/index.html` loads without a build step.
- No remote scripts are required.
- `.github/workflows/pages.yml` uploads `app/` to Pages.
- Pages workflow is independent of kernel implementation.

### 0.3 Baseline Verification
- Run template tests after setup changes.
- Keep kernel untouched except when intentionally entering Phase 1.

**Acceptance Criteria**
- `npm test` passes.
- `npm run test:purity` passes.
- CI workflow remains present.
- Any dependency audit findings are recorded, not silently fixed in unrelated commits.

**Exit Criteria**
- [x] GitHub Pages deployment completes successfully.
- [x] Phase 1 can begin without naming/spec ambiguity.
- [x] Human reviewer completes [PHASE0_EXIT_REVIEW.md](./PHASE0_EXIT_REVIEW.md) and records approval to begin Phase 1.

**Non-Goals**
- No TagTeam runtime integration.
- No CSV/JSON adapters.
- No IndexedDB.
- No functional enrichment UI.

## Phase 1: Pure SemantiCore Kernel

**Goal:** Replace the template identity transform with the pure SemantiCore record-enrichment kernel defined by the spec.

**Status:** Complete

**Primary Outputs**
- Pure `enrichRecord` computation.
- Deterministic JSON-LD output model.
- Spec-aligned warning/error resources.
- SemantiCore-specific conformance tests.

**Dependencies**
- Phase 0 complete.
- `project/SPEC.md` accepted as authoritative.

### 1.1 Define Kernel Types

Implement TypeScript interfaces for the core JSON-LD structures:

- `SemantiCoreDataset`
- `SourceRecord`
- `EnrichmentConfiguration`
- `PropertyPath`
- `ContextManifest`
- `OntologySet`
- `TagTeamRuntime`
- `TagTeamEnrichment`
- `NamedGraph`
- `WarningResource`
- `TransformResult`

**Acceptance Criteria**
- Types live under `src/kernel/`.
- Types do not import adapter code.
- Types represent JSON-LD IRIs for statuses, policies, and warning codes.
- Type definitions reflect `project/SPEC.md` sections 5-15.

### 1.2 Implement Version Policy

Implement deterministic TagTeam runtime version validation.

**Acceptance Criteria**
- `sc:requiredTagTeamVersion` is required in configuration.
- `sc:RejectOnMismatch` prevents enrichment and emits `sc:TagTeamVersionMismatch`.
- `sc:WarnAndRunOnMismatch` proceeds and emits a warning.
- `sc:AllowCompatibleMinor` follows the spec-defined major/minor rule.
- Version checks are covered by tests.

### 1.3 Implement Local Context Term Resolution

Implement minimal local context manifest support needed for examples and property path resolution.

**Acceptance Criteria**
- Core can resolve compact IRIs from local `sc:contextDocument` entries.
- Missing terms emit `sc:ContextResolutionError`.
- Error resources include `sc:pathIndex` and `sc:pathTerm` where applicable.
- No remote context fetch occurs.
- No JSON-LD external processor is required for Phase 1 unless kept inside the kernel purity contract.

### 1.4 Implement Semantic Property Path Resolution

Implement spec section 8 traversal behavior over local JSON-LD objects.

**Acceptance Criteria**
- Path resolution is independent of compacted key spelling when context maps terms.
- Multi-value terminal paths support `sc:EnrichEachValue`.
- Non-string terminal values emit `sc:NonStringSourceValue`.
- Node terminal values emit `sc:NodeSourceValue`.
- Empty strings emit `sc:EmptySourceText`.
- Language policy supports at least English and plain literal fallback.

### 1.5 Implement `enrichRecord`

Implement the normative pure function.

**Acceptance Criteria**
- Function accepts record, configuration, context manifest, ontology set, and injected TagTeam runtime.
- Function never performs I/O.
- Function never references `Date`, `Math.random`, `fetch`, `XMLHttpRequest`, filesystem, IndexedDB, environment variables, or process state.
- Recoverable TagTeam failures return `sc:TagTeamRuntimeError`.
- Successful enrichment returns enriched record plus `sc:TagTeamGraph` named graph.
- TagTeam graph is represented with top-level `@graph`, not an opaque payload.

### 1.6 Implement Deterministic Canonicalization Envelope

Harden current stable serialization to align as closely as practical with the spec while preserving template constraints.

**Acceptance Criteria**
- Output object keys are stable.
- Arrays with semantic order preserve order.
- Unordered warning/graph collections are sorted by stable identifiers before final output.
- Determinism test proves byte-identical output across repeated runs.
- Any gap from full RDFC-1.0/JCS is documented as a Phase 4 hardening item if not implemented in Phase 1.

### 1.7 Update Examples

Replace template event-normalization examples with SemantiCore fixtures.

**Acceptance Criteria**
- `examples/input.jsonld` contains a minimal SemantiCore input fixture.
- `examples/expected-output.jsonld` contains canonical expected output.
- Fixture includes configuration, context manifest, ontology set reference, and at least one source record.
- Snapshot test passes.

### 1.8 Conformance Tests

Add SemantiCore-specific tests.

**Acceptance Criteria**
- Deterministic rerun test passes.
- Offline context test passes.
- Context failure test passes.
- TagTeam version mismatch test passes.
- Named graph output test passes.
- TagTeam runtime error test passes.
- Existing no-network and purity tests pass.

**Exit Criteria**
- [x] `npm test` passes.
- [x] `npm run test:purity` passes.
- [x] Kernel implements `enrichRecord` without adapters.
- [x] Human reviewer completes [PHASE1_EXIT_REVIEW.md](./PHASE1_EXIT_REVIEW.md) and records approval to begin Phase 2.

**Non-Goals**
- No CSV parser.
- No browser file picker.
- No IndexedDB.
- No real TagTeam bundle loading; use injected runtime fixture/stub unless local TagTeam can be imported without breaking kernel purity.

## Phase 2: Ingestion and Export Adapters

**Goal:** Add local adapters that convert CSV/plain JSON into canonical SemantiCore JSON-LD and export canonical/derived outputs.

**Primary Outputs**
- CSV ingestion adapter.
- Plain JSON ingestion adapter.
- JSON-LD passthrough adapter.
- Mapping manifest handling.
- JSON-LD and CSV summary export adapters.

**Dependencies**
- Phase 1 kernel stable.

**Status:** Complete

### 2.1 CSV Adapter

Implement adapter under `src/adapters/integration/`.

**Acceptance Criteria**
- [x] Accepts CSV text and mapping manifest.
- [x] Supports `sc:hasHeaderRow`.
- [x] Preserves row order.
- [x] Emits deterministic record IDs.
- [x] Preserves cell values as strings unless mapping declares datatype conversion.
- [x] Emits canonical `sc:Dataset`.
- [x] Emits or preserves `sc:MappingManifest`.
- [x] Does not enter `src/kernel/`.

### 2.2 JSON Adapter

Implement adapter for plain JSON.

**Acceptance Criteria**
- [x] Accepts array of objects.
- [x] Accepts object containing array via RFC 6901 JSON Pointer.
- [x] Accepts single object as one record.
- [x] Emits `sc:UnsupportedInputShape` for unsupported shapes.
- [x] Uses mapping manifest when keys need semantic property mapping.

### 2.3 JSON-LD Adapter

Implement loader/validator for already-canonical JSON-LD.

**Acceptance Criteria**
- [x] Accepts `sc:Dataset` JSON-LD.
- [x] Verifies records have stable non-blank `@id`.
- [x] Verifies `@context` or local context manifest sufficiency.
- [x] Does not rewrite semantically valid input unnecessarily.

### 2.4 Export Adapters

Implement derived export utilities.

**Acceptance Criteria**
- [x] Exports canonical enriched JSON-LD.
- [x] Exports named graph bundle.
- [x] Exports CSV summary with required columns from spec section 20.
- [x] Does not embed full graphs in CSV cells.
- [x] Derived outputs are reproducible from canonical output.

### 2.5 Adapter Tests

Add adapter test coverage.

**Acceptance Criteria**
- [x] Same CSV plus same mapping manifest produces byte-stable dataset JSON-LD after canonicalization.
- [x] Missing mapping produces `sc:MappingManifestMissing`.
- [x] Ambiguous mapping produces `sc:MappingManifestAmbiguous`.
- [x] JSON Pointer selection is deterministic.

**Exit Criteria**
- [x] Local files can be converted to kernel input and exported without browser UI.
- [x] Tests pass.
- [x] Human reviewer completes [PHASE2_EXIT_REVIEW.md](./PHASE2_EXIT_REVIEW.md) and records approval to begin Phase 3.

**Non-Goals**
- No IndexedDB.
- No remote URL imports.
- No full workbench UI.

## Phase 3: Browser Workbench MVP

**Goal:** Turn the GitHub Pages shell into a usable local-first browser workbench backed by Phase 1 and Phase 2 logic.

**Primary Outputs**
- Browser import UI.
- Mapping preview/editor.
- Source property path selector.
- Enrichment run UI.
- Record result table.
- Graph viewer.
- Export controls.

**Dependencies**
- Phase 1 kernel.
- Phase 2 adapters.
- GitHub Pages workflow active.

**Status:** Complete

### 3.1 App Build Strategy

Decide and implement how TypeScript/browser code is built into `app/`.

**Acceptance Criteria**
- Build keeps GitHub Pages static.
- Browser bundle does not require a server.
- Kernel purity tests still isolate `src/kernel`.
- App build is documented in README.

### 3.2 Import UI

Implement local file import.

**Acceptance Criteria**
- User can import CSV.
- User can import plain JSON.
- User can import JSON-LD.
- Import never uploads data.
- Imported data preview is available before enrichment.

### 3.3 Mapping UI

Implement mapping manifest creation/editing.

**Acceptance Criteria**
- CSV headers can be mapped to JSON-LD properties.
- Header-row behavior is explicit.
- Mapping manifest can be viewed as JSON-LD.
- Mapping errors surface as SemantiCore warning resources.

### 3.4 Source Path Selector

Implement semantic property path selection.

**Acceptance Criteria**
- User can choose a string-bearing field.
- UI stores selection as `sc:PropertyPath`.
- Multi-value policy and language policy have initial controls.
- Path preview shows how many records resolve.

### 3.5 Enrichment Runner

Implement browser orchestration loop over records.

**Acceptance Criteria**
- Runs enrichment locally.
- Progress indicator shows processed/skipped/failed counts.
- Recoverable per-record failures do not abort the run.
- Cancellation is supported.
- Output order remains deterministic.

### 3.6 Result Review

Implement review surfaces.

**Acceptance Criteria**
- Record table shows status, entity count, act count, role count, deontic detected, warning codes.
- Selecting a row shows source text and enrichment metadata.
- Named graph viewer shows JSON-LD graph.
- Warning/error viewer displays JSON-LD warning resources.

### 3.7 Export UI

Implement browser exports.

**Acceptance Criteria**
- User can export enriched JSON-LD.
- User can export graph bundle JSON-LD.
- User can export CSV summary.
- Exported files are reproducible from current canonical state.

**Exit Criteria**
- A user can import a small CSV/JSON/JSON-LD file, select a text field, enrich with a stub or local TagTeam runtime, inspect results, and export output from GitHub Pages.
- [x] Human reviewer completes [PHASE3_EXIT_REVIEW.md](./PHASE3_EXIT_REVIEW.md) and records approval to begin Phase 4.

**Non-Goals**
- No cloud sync.
- No remote ontology resolver.
- No collaborative editing.

## Phase 4: Local State, Sessions, and Ontology Management

**Goal:** Add local persistence and ontology/session management while preserving adapter boundaries.

**Primary Outputs**
- IndexedDB persistence adapter.
- Session save/load.
- Ontology set manager.
- Context/mapping manifest persistence.

**Dependencies**
- Phase 3 browser MVP.

**Status:** Complete

### 4.1 IndexedDB State Adapter

Implement browser persistence under `src/adapters/persistence/`.

**Acceptance Criteria**
- [x] Stores datasets.
- [x] Stores mapping manifests.
- [x] Stores context manifests.
- [x] Stores ontology sets.
- [x] Stores sessions.
- [x] Stores enrichment runs.
- [x] Stores named graphs.
- [x] Uses stable `@id` keys.
- [ ] Handles write conflicts with `sc:StateWriteConflict`.

### 4.2 Session Model

Implement save/load session behavior.

**Acceptance Criteria**
- [x] Session references are hash-pinned where possible.
- [ ] Session restore detects mismatched hashes.
- [x] Snapshot export can inline referenced documents.
- [x] Session restore does not alter kernel semantics.

### 4.3 Ontology Manager

Implement local ontology workflow.

**Acceptance Criteria**
- [x] User can add local Turtle ontology content.
- [x] User can name ontology entries.
- [x] User can enable/disable ontologies in an ontology set.
- [x] Ontology set manifest is JSON-LD.
- [x] Non-CCO/BFO aligned ontology can be declared and warning surfaced.

### 4.4 Context Manifest Manager

Implement local context manifest workflow.

**Acceptance Criteria**
- [x] Default SemantiCore context manifest exists locally.
- [x] User can view context manifest JSON-LD.
- [x] Missing context terms surface as `sc:ContextResolutionError`.
- [x] No remote context fetching is required.

**Exit Criteria**
- [x] A browser user can close and reopen SemantiCore and resume a prior local session.
- [x] Human reviewer completes [PHASE4_EXIT_REVIEW.md](./PHASE4_EXIT_REVIEW.md) and records approval to begin Phase 5.

**Non-Goals**
- No remote sync.
- No multi-device state.

## Phase 5: Real TagTeam Runtime Integration

**Goal:** Integrate SemantiCore with an actual local TagTeam.js runtime in the browser and Node adapter contexts.

**Status:** Ready for Human Review

**Primary Outputs**
- Browser TagTeam runtime loading.
- Node TagTeam runtime adapter.
- Version policy enforcement against real runtime.
- Real graph output attached as named graphs.

**Dependencies**
- Phase 1 kernel injection contract.
- Phase 3 workbench.
- Phase 4 ontology manager.

### 5.1 Runtime Loading Strategy

Define how local TagTeam code is supplied.

**Acceptance Criteria**
- [x] Browser can load a local/static TagTeam bundle.
- [x] Node can receive/import a local TagTeam runtime.
- [x] Runtime object exposes `version` and `buildGraph`.
- [x] Remote TagTeam loading is not required.

### 5.2 Version Enforcement

Apply spec version policies to real runtime.

**Acceptance Criteria**
- [x] Exact match works.
- [x] Mismatch reject behavior works.
- [x] Warn-and-run behavior works.
- [x] Version mismatch warnings appear in run output.

### 5.3 Ontology Wiring

Pass active ontology sets to TagTeam according to supported TagTeam APIs.

**Acceptance Criteria**
- [x] Local ontology set can influence TagTeam options when supported.
- [x] Ontology unavailable warnings are emitted when expected.
- [x] Non-aligned ontology warnings are preserved.

### 5.4 Graph Attachment

Attach real TagTeam output to named graph resources.

**Acceptance Criteria**
- [x] Output uses `@graph`.
- [x] Source record links to named graph ID.
- [x] Combined export remains losslessly expandable.
- [x] Context collisions emit warnings.

**Exit Criteria**
- [x] SemantiCore can enrich real user data with a locally supplied TagTeam-compatible runtime.
- [x] Human reviewer completes [PHASE5_EXIT_REVIEW.md](./PHASE5_EXIT_REVIEW.md) and records approval to begin Phase 6.

## Phase 6: Determinism and Canonicalization Hardening

**Goal:** Bring canonicalization and conformance as close as practical to the published v1.0 spec.

**Status:** Ready for Human Review

**Primary Outputs**
- RDFC-1.0/JCS strategy.
- Expanded conformance corpus.
- Hashing utilities.
- Reproducible run artifacts.

**Dependencies**
- Real graph output from Phase 5.

### 6.1 Canonicalization Strategy

Implement or integrate canonicalization in a way that preserves edge execution.

**Acceptance Criteria**
- [x] RDFC-1.0 gap is documented with a future implementation path.
- [x] JCS-style sorted-key serialization is consistently applied.
- [x] Hashing uses canonical bytes.
- [x] Canonicalization can run in browser and Node.

### 6.2 Conformance Corpus

Implement the corpus from spec section 23.

**Acceptance Criteria**
- [x] Deterministic rerun test.
- [x] Offline context test.
- [x] Context failure test.
- [x] CSV mapping test.
- [x] Multi-value path test.
- [x] Language literal test.
- [x] TagTeam mismatch test.
- [x] TagTeam runtime error test.
- [x] Named graph test.
- [x] No-network test.
- [x] Purity test.
- [x] Snapshot test.

### 6.3 Golden Outputs

Create stable fixtures.

**Acceptance Criteria**
- [x] Golden outputs are canonicalized.
- [x] Test failures show meaningful diffs.
- [x] Fixture updates require intentional review.

**Exit Criteria**
- [x] SemantiCore can prove deterministic output for representative datasets.
- [x] Human reviewer completes [PHASE6_EXIT_REVIEW.md](./PHASE6_EXIT_REVIEW.md) and records approval to begin Phase 7.

## Phase 7: Production Pages Polish and Accessibility

**Goal:** Make the GitHub Pages app usable, resilient, and clear for real local workflows.

**Primary Outputs**
- Accessible UI.
- Responsive layout.
- Better graph viewer.
- Large-file guardrails.
- Documentation links.

### 7.1 Accessibility

**Acceptance Criteria**
- Keyboard navigation works for primary workflows.
- Form controls have labels.
- Status/progress updates are screen-reader friendly.
- Color contrast passes WCAG AA for core surfaces.

### 7.2 Large Dataset UX

**Acceptance Criteria**
- UI warns before loading large files into memory.
- Iterator/chunk progress is visible.
- User can cancel long runs.
- Partial outputs can be preserved where state adapter is enabled.

### 7.3 Documentation Surface

**Acceptance Criteria**
- App links to spec, roadmap, and GitHub repo.
- App explains local-only data handling.
- App describes export formats.

## Phase 8: Optional Integration Surfaces

**Goal:** Add optional integrations without making them architectural requirements.

**Candidate Integrations**
- Remote ontology resolver.
- Remote context resolver.
- Fandaws export validator.
- HIRI-addressed artifact publishing.
- Cloud session sync.

**Acceptance Criteria**
- Each integration is opt-in.
- Each integration lives outside `src/kernel`.
- Offline mode remains fully valid.
- Data egress is visible to the user.
- Core tests remain no-network.

## Cross-Phase Quality Gates

Every phase must preserve these gates:

- `npm test` passes.
- `npm run test:purity` passes.
- No required server is introduced.
- No required database is introduced.
- No network call appears in kernel code.
- Original source records remain preserved.
- New warnings/errors are JSON-LD resources.
- New statuses/policies/codes are IRIs, not string enums.

## Immediate Next Step

After Phase 0 is published and Pages is green, begin Phase 1.1 by defining SemantiCore kernel TypeScript types and replacing the template examples with a minimal SemantiCore fixture.
