# Architecture Decision Records

<!--
  Log decisions here so they survive between AI sessions.
  An AI agent has no memory of yesterday. This file IS its memory.

  Format: Date | Decision | Context | Consequences
-->

## ADR-001: Use JSON-LD Deterministic Service Template

**Date:** 2026-05-12

**Decision:** Adopt the JSON-LD Deterministic Service Template as the base architecture.

**Context:** We need a service that produces deterministic, reproducible transformations on structured data. The template provides a pure kernel with spec tests, layered boundaries (kernel/composition/adapters), and zero runtime dependencies.

**Consequences:**
- All transformation logic lives in `src/kernel/transform.ts` as pure functions
- Kernel MUST NOT perform I/O, reference time, randomness, or environment state
- Infrastructure (HTTP, persistence, scheduling) lives in `src/adapters/`
- Spec tests (determinism, no-network, snapshot, purity) MUST pass before any merge

---

## ADR-002: Name the Project SemantiCore

**Date:** 2026-05-12

**Decision:** The published project name is SemantiCore; earlier `TagTeam Data Enricher` drafts are superseded.

**Context:** The workbench uses TagTeam.js, but it is not the TagTeam.js repository. TagTeam is the local semantic graph engine. SemantiCore is the app/workbench, ingestion model, state/session model, and deterministic JSON-LD enrichment contract around that engine.

**Consequences:**
- Project-facing docs, metadata, and UI use SemantiCore naming.
- `project/SPEC.md` is the authoritative SemantiCore v1.0 specification.
- TagTeam integration remains explicit and version-pinned.
- Future work must not place SemantiCore project docs in the TagTeam.js repo.

---

## ADR-003: Publish the Initial App on GitHub Pages

**Date:** 2026-05-12

**Decision:** SemantiCore's browser workbench will be published from the `app/` directory through GitHub Actions to GitHub Pages.

**Context:** The project needs an edge-canonical browser surface early, but the kernel and adapters are still under construction. GitHub Pages provides a simple static publication target without introducing a required server into the architecture.

**Consequences:**
- GitHub Pages is an adapter/publication surface, not core computation.
- The `app/` directory must not assume remote services or required network calls.
- The GitHub Pages workflow deploys static files only.
- Kernel CI remains separate from Pages publication.

---

## ADR-004: Require Human Exit Review Between Phases

**Date:** 2026-05-12

**Decision:** Each phase must have an explicit human review and approval package before the next phase begins.

**Context:** SemantiCore's architecture is intentionally strict. Phase transitions should not rely on chat memory or agent confidence. A human reviewer needs a concrete checklist that explains what to inspect, what passes, what blocks, and what approval means.

**Consequences:**
- Phase exit review documents live in `project/`.
- Phase 0 exit review is `project/PHASE0_EXIT_REVIEW.md`.
- Future phases should add their own exit review documents before asking for approval.
- No phase is considered complete until the human review decision is recorded.

---

## ADR-005: Approve Phase 0 and Begin Phase 1

**Date:** 2026-05-12

**Decision:** Phase 0 is approved. Begin Phase 1: SemantiCore Kernel Contract.

**Context:** Human review approved the repository activation and app runway. The repo now has SemantiCore identity, published spec, detailed roadmap, GitHub Pages shell, Pages workflow, and preserved kernel purity baseline.

**Consequences:**
- Phase 0 is marked complete.
- Phase 1 is marked in progress.
- Implementation work should begin with pure kernel types and fixtures, not adapters or UI.
- The Phase 1 exit review must be completed before Phase 2 begins.

---

## ADR-006: Keep Phase 1 TagTeam Runtime Injected

**Date:** 2026-05-12

**Decision:** Phase 1 implements SemantiCore's kernel against an injected `TagTeamRuntime` interface instead of importing or loading the real TagTeam.js bundle.

**Context:** The v1.0 spec requires TagTeam execution to be local and version-pinned, but the Phase 1 goal is to prove the pure computation boundary. Loading real TagTeam code belongs to the later runtime integration phase. An injected runtime lets tests prove version policy, runtime error capture, named graph attachment, and deterministic output without creating a hidden integration dependency.

**Consequences:**
- `src/kernel/enrich.ts` accepts a runtime object with `version` and `buildGraph`.
- Tests use deterministic runtime fixtures.
- Real TagTeam loading remains a Phase 5 adapter/integration task.
- The kernel can run in browser or Node without required network or bundler-specific behavior.

---

## ADR-007: Approve Phase 1 and Begin Phase 2

**Date:** 2026-05-12

**Decision:** Phase 1 is approved. Begin Phase 2: local ingestion and export adapters.

**Context:** Human review approved the pure SemantiCore kernel checkpoint at commit `5d38325`. The kernel now has typed JSON-LD structures, local context resolution, semantic property paths, injected TagTeam runtime behavior, named graph output, conformance tests, and strengthened purity checks.

**Consequences:**
- Phase 1 is marked complete.
- Phase 2 is marked in progress.
- Adapter work should live outside `src/kernel/`.
- CSV, plain JSON, JSON-LD passthrough, and export utilities may now be implemented.
- The Phase 2 exit review must be completed before Phase 3 begins.

---

## ADR-008: Implement Phase 2 as Local Text/Object Adapters

**Date:** 2026-05-12

**Decision:** Phase 2 adapters convert local text or in-memory objects into SemantiCore JSON-LD without adding required runtime infrastructure.

**Context:** The SemantiCore spec treats CSV and plain JSON as adapter formats, not canonical representations. The first adapter implementation should be enough for local browser and Node orchestration while preserving the pure kernel boundary.

**Consequences:**
- CSV and plain JSON ingestion require mapping manifests.
- Plain JSON nested array selection uses RFC 6901 JSON Pointer.
- JSON-LD passthrough validates stable non-blank record IDs.
- Exports are deterministic derived views over canonical JSON-LD state.
- Browser UI wiring remains Phase 3; persistence remains Phase 4.

---

## ADR-009: Require Visible Product Evidence Starting in Phase 3

**Date:** 2026-05-12

**Decision:** Phase 3 and later reviews must include visible browser behavior and demo steps, not only file diffs and test output.

**Context:** The PO and human reviewer approved Phase 2 but noted that reviewing invisible kernel and adapter changes risks becoming a rubber stamp. That was acceptable for early infrastructure phases, but the project now needs product evidence: something to click, inspect, and export.

**Consequences:**
- Phase 3 must make the GitHub Pages app visibly useful.
- Review packets must include demo steps and screen-level acceptance criteria.
- The app should include a built-in sample flow so review does not depend on preparing external files.
- Future approvals should answer what the PO can see, click, import, inspect, or export.

---

## ADR-010: Use a Static No-Build Browser MVP for Phase 3

**Date:** 2026-05-12

**Decision:** Phase 3 will implement the GitHub Pages MVP as static HTML, CSS, and browser JavaScript in `app/` without adding a required bundler or server.

**Context:** SemantiCore must remain edge-canonical and GitHub Pages currently publishes `app/` directly. A no-build MVP lets the PO see the workflow immediately while preserving the later option to introduce a browser bundle strategy if needed.

**Consequences:**
- The Phase 3 UI can run directly from GitHub Pages.
- Browser code may mirror Phase 1/2 behavior for demonstration until a formal build step wires shared TypeScript modules into `app/`.
- Any future bundling remains an optimization, not a core architectural requirement.

---

## ADR-011: Approve Phase 3 and Begin Phase 4

**Date:** 2026-05-13

**Decision:** Phase 3 is approved. Begin Phase 4: local state, sessions, and ontology management.

**Context:** The PO reviewed the visible GitHub Pages workbench MVP and approved it. SemantiCore now has a click-through browser workflow for sample/local input, mapping, enrichment, JSON-LD graph inspection, and export.

**Consequences:**
- Phase 3 is marked complete.
- Phase 4 is marked in progress.
- Persistence/session/ontology work must be visible in the app, not only represented by files.
- IndexedDB remains an optional browser adapter, not a core kernel dependency.

---

## ADR-012: Use IndexedDB for Browser-Local Sessions

**Date:** 2026-05-13

**Decision:** Phase 4 uses browser IndexedDB as the local session persistence adapter and exposes session, ontology, and context state as JSON-LD in the workbench.

**Context:** SemantiCore needs resumable local work without introducing a required server, database service, account, or cloud sync. IndexedDB is available in modern browsers and fits the edge-canonical browser execution model when treated as an adapter.

**Consequences:**
- Session save/restore is visible in the GitHub Pages workbench.
- Session snapshots include local source, mapping, dataset, run, ontology set, and context manifest state.
- IndexedDB remains outside the kernel.
- Cross-device sync and remote state remain out of scope.

---

## ADR-013: Approve Phase 4 and Begin Phase 5

**Date:** 2026-05-13

**Decision:** Phase 4 is approved. Begin Phase 5: real TagTeam runtime integration.

**Context:** The PO reviewed the local-state workbench and approved session save/restore, ontology management, context inspection, and the no-required-infrastructure boundary. The next visible product question is whether SemantiCore can run against an actual local TagTeam.js runtime.

**Consequences:**
- Phase 4 is marked complete.
- Phase 5 is marked in progress.
- Runtime loading and version policy behavior must be visible in the browser workbench.
- The kernel must continue to receive an injected runtime and must not import TagTeam directly.

---

## ADR-014: Load TagTeam as a Local Runtime Adapter

**Date:** 2026-05-13

**Decision:** Phase 5 supports a locally supplied TagTeam.js runtime through browser `window.TagTeam` detection or an explicit local bundle file, with a deterministic fallback runtime kept visible.

**Context:** TagTeam.js publishes a browser/Node bundle exposing `version`, `buildGraph`, and optional ontology APIs. SemantiCore cannot require a remote server, CDN, package registry, or cloud runtime, so TagTeam must be supplied as a local/static runtime object at the adapter boundary.

**Consequences:**
- GitHub Pages can run without a TagTeam bundle and still demonstrate deterministic fallback behavior.
- A reviewer can load a local `tagteam.js` bundle into the page and see runtime diagnostics before enrichment.
- Node code can adapt any TagTeam-like object without a hard runtime dependency.
- Version mismatch and ontology-support behavior are represented as JSON-LD warnings.

---

## ADR-015: Approve Phase 5 and Begin Phase 6

**Date:** 2026-05-13

**Decision:** Phase 5 is approved. Begin Phase 6: determinism and canonicalization hardening.

**Context:** The PO reviewed the deployed Phase 5 workbench and confirmed the runtime panel, fallback runtime labeling, local TagTeam bundle surface, ontology-unavailable warning, and named graph output are sufficient for the runtime integration gate.

**Consequences:**
- Phase 5 is marked complete.
- Phase 6 is marked in progress.
- Browser output should remove demo-only convenience duplicates.
- Browser and Node hashing should use canonical bytes and SHA-256 where practical.
- Full RDF dataset normalization remains explicit work; sorted-key/JCS-style envelope canonicalization is the immediate hardening target.

---

## ADR-016: Make The TagTeam Text Source Explicit

**Date:** 2026-05-13

**Decision:** The browser workbench must store and display the configured TagTeam source property path as `sc:tagTeamSourcePropertyPath`, defaulting to `sc:source / schema:text`.

**Context:** The app previously inferred the text sent to TagTeam from mapping order and a hidden preference for description-like properties. That made review confusing and encoded the wrong semantics for tweet/post/body-style text, where `schema:text` is the canonical mapped property and `schema:description` is not the intended source.

**Consequences:**
- Mapping rows still describe how input columns become JSON-LD properties.
- The TagTeam text source is a separate explicit configuration choice.
- CSV files with `Text`, `url`, `id`, and `createdAt` columns can map `Text -> schema:text` and select `schema:text` as the TagTeam input.
- Session snapshots preserve the selected TagTeam source property.

---

## ADR-017: De-Duplicate TagTeam Graph Context At The Boundary

**Date:** 2026-05-13

**Decision:** SemantiCore wraps TagTeam graph output with only SemantiCore-owned terms and shared prefixes, while TagTeam's emitted context remains authoritative for TagTeam, BFO, CCO, and ontology-match term mappings.

**Context:** TagTeam emits useful JSON-LD graph nodes and, in current browser builds, includes a context that maps terms such as `Entity`, `Process`, `Role`, `is_about`, and `is_concretized_by` to BFO/CCO IRIs. SemantiCore previously supplied local `tagteam:*` shadows for these same terms. If contexts were reordered or consolidated, those duplicate definitions could silently expand the same graph to different IRIs.

**Consequences:**
- Browser and Node graph wrappers define `tagteam:`, `inst:`, `rdfs:`, `owl:`, `bfo:`, and `cco:` without redefining TagTeam-owned bare terms.
- If a TagTeam runtime supplies its own `@context`, SemantiCore layers that runtime context after the wrapper context and avoids conflicting duplicate term definitions.
- `tagteam:` and `inst:` are aligned to the namespaces emitted by the active TagTeam serializer.
- Graph bundle exports consolidate graph contexts at the bundle root and strip repeated per-record `@context` blocks from named graph entries.
- The graph boundary remains an adapter concern; SemantiCore does not rewrite TagTeam nodes.

---

## ADR-018: Expose Ontology Passing Evidence In Graph Output

**Date:** 2026-05-13

**Decision:** Each emitted TagTeam graph includes an `sc:ontologyBridge` report that states whether SemantiCore compiled and passed ontology content to TagTeam and how many ontology matches came back.

**Context:** The workbench let users add local ontology TTL, but it was not clear whether that TTL reached TagTeam or whether TagTeam used it. TagTeam's documented integration shape is `OntologyTextTagger.fromTTL(ttl)` passed as `buildGraph(text, { ontology: tagger })`, so SemantiCore must expose that adapter boundary directly.

**Consequences:**
- Reviewers can distinguish ontology unavailable, disabled, empty, compiled-and-passed, and matched-zero cases.
- `ontologyMatch*` terms are part of the graph context for downstream JSON-LD use.
- A zero match count is not treated as an error; it is observable evidence for debugging ontology labels and TagTeam behavior.

---

<!--
  Add new decisions below. Use the format:

  ## ADR-NNN: [Decision Title]

  **Date:** YYYY-MM-DD

  **Decision:** One sentence stating the choice.

  **Context:** Why this decision was needed. What alternatives were considered.

  **Consequences:** What follows from this decision. What is now easier or harder.
-->
