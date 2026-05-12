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

<!--
  Add new decisions below. Use the format:

  ## ADR-NNN: [Decision Title]

  **Date:** YYYY-MM-DD

  **Decision:** One sentence stating the choice.

  **Context:** Why this decision was needed. What alternatives were considered.

  **Consequences:** What follows from this decision. What is now easier or harder.
-->
