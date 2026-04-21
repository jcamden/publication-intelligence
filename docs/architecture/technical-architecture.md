# Technical architecture (summary)

**Goal:** PDF ingestion → extraction → index editor → exportable back-of-book index.

## Flow (current → target)

**Today:** upload (Fastify) → local `.data` storage → Gel (`Project`, `SourceDocument`) → Next.js viewer (PDF.js).

**Target:** upload → **PyMuPDF** service (`index-pdf-extractor`) → `DocumentPage` / mentions → editor → export.

## Workspace

- `apps/index-pdf-frontend` — Next.js, tRPC client  
- `apps/index-pdf-backend` — Fastify + tRPC, auth, uploads  
- `apps/index-pdf-extractor` — Python/PyMuPDF  
- `packages/core`, `events`, `pdf`, `yaboujee`, `storybook-*`, …

## Layers

- **tRPC** — main API; **REST** — multipart uploads / downloads where needed.  
- **Services** — validation + invariants; **repos** — Gel access.

## Data model (high level)

Indexing: workspace, project, source documents, pages, entries, mentions, variants, relations, detection/export/audit-related tables per schema.

Also: generic document/chunk embedding domain where present in schema.

## Pipelines

**Upload:** multipart route → service → `.data` + Gel → domain events.

**Extraction/indexing (rolling):** source doc → extractor → pages/mentions/entries (sync MVP; async later).

## Detail

PDF UI breakdown: [component-architecture.md](./component-architecture.md).
