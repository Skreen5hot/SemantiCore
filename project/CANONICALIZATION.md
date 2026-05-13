# SemantiCore Canonicalization Strategy

Status: Phase 6 implementation note  
Date: 2026-05-13

## Current Contract

SemantiCore currently applies deterministic envelope canonicalization:

- recursively sort JSON object keys lexicographically;
- preserve array order when array order is semantically meaningful;
- serialize canonical JSON without insignificant whitespace for hashing;
- compute `sha256` over UTF-8 canonical bytes.

This strategy runs unchanged in browser and Node and requires no network, server, database, or package registry.

## Implemented Helpers

Kernel helpers:

- `canonicalizeJson(value)`
- `stableStringify(value, pretty)`
- `canonicalBytes(value)`
- `canonicalContentHash(value)`
- `sha256Hex(bytes)`

Browser workbench helpers mirror the same envelope and hash behavior for visible session and output hashes.

## Known Gap

This is not full RDF dataset normalization. It does not yet implement RDFC-1.0 / URDNA2015 blank-node canonicalization.

The current SemantiCore fixtures avoid blank-node output and require stable non-blank record IDs. That keeps Phase 6 deterministic for the present browser and Node surfaces, but a future implementation must add or vendor a local RDFC-1.0 implementation before claiming full spec-level RDF dataset normalization.

## Required Future Work

Before production-grade semantic graph interchange:

- add an edge-runnable RDFC-1.0 implementation or approved local adapter;
- normalize expanded RDF datasets before final graph comparison;
- hash graph-level canonical RDF bytes where graph semantics, not JSON envelope shape, are the contract;
- add golden fixtures containing blank nodes and prefix/context variation.

## Review Guidance

Phase 6 should be accepted if the current app:

- removes demo-only duplicate output properties;
- exposes canonical hash reports;
- uses SHA-256 over canonical bytes for local hashes;
- keeps output deterministic across repeated runs;
- documents the RDFC-1.0 gap plainly.

Phase 6 should not be interpreted as full RDF canonicalization completion.
