# SemantiCore

SemantiCore is an edge-canonical semantic enrichment workbench for structured data. It converts CSV, JSON, and JSON-LD records into canonical JSON-LD, runs a pinned local TagTeam.js runtime over selected string fields, and emits enriched JSON-LD records plus TagTeam named graphs.

The project is built on the JSON-LD Deterministic Service Template. The template's core rule still governs SemantiCore:

> JSON-LD in, deterministic JSON-LD out. No required infrastructure in the kernel.

## Current Status

SemantiCore is in Phase 0: repository activation and app runway.

- Published spec: [project/SPEC.md](project/SPEC.md)
- Roadmap: [project/ROADMAP.md](project/ROADMAP.md)
- Decisions: [project/DECISIONS.md](project/DECISIONS.md)
- Static app shell: [app/index.html](app/index.html)

The GitHub Pages app is intentionally a shell for now. The pure kernel, adapters, and full workbench will be built in later phases.

## Canonical Execution Model

SemantiCore core behavior must run unmodified in:

- a browser; or
- local Node.js via `node index.js`.

Servers, databases, queues, background workers, cloud storage, and remote resolvers are optional adapters, never core requirements.

## Template Structure

```text
src/kernel/              Pure deterministic JSON-LD transform code
src/adapters/            Optional I/O, persistence, orchestration adapters
src/composition/         Optional higher-level composition patterns
tests/                   Determinism, no-network, snapshot, and purity tests
docs/                    Template architecture contract
project/                 SemantiCore spec, roadmap, and decisions
app/                     Static browser app published to GitHub Pages
```

## Development

Prerequisites: Node.js >= 22.

```bash
npm install
npm run build
npm test
npm run test:purity
```

Run the current template kernel:

```bash
node dist/kernel/index.js examples/input.jsonld
```

## GitHub Pages

The `app/` directory is deployed by GitHub Actions to GitHub Pages. Pages is a publication adapter for the browser workbench; it is not part of the SemantiCore kernel.

## License

[MIT](LICENSE)
