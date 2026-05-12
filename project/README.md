# SemantiCore Project Space

This directory is SemantiCore's durable project memory.

- `SPEC.md` defines the published SemantiCore v1.0 technical contract.
- `ROADMAP.md` defines the current phase plan and scope boundaries.
- `DECISIONS.md` records architecture decisions that future sessions must preserve.

The template's `docs/` directory describes the generic JSON-LD deterministic service architecture. This `project/` directory describes the actual product being built: SemantiCore.

Before changing implementation code, read:

1. [SPEC.md](./SPEC.md)
2. [ROADMAP.md](./ROADMAP.md)
3. [DECISIONS.md](./DECISIONS.md)

SemantiCore's core remains edge-canonical: browser or local Node.js, JSON-LD in, deterministic JSON-LD out, with infrastructure isolated behind adapters.
