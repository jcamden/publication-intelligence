# Technical Architecture & Data Model

**Project:** Publication Intelligence  
**Scope:** MVP implemented + near-term roadmap

---

## 1) Architecture Overview (Current Codebase)

**Goal:** A professional indexing workflow where PDFs are ingested, extracted, and curated into a publishable back-of-book index.

**High-Level Flow (today):**

```
PDF Upload (Fastify route)
   ↓
Local Storage (backend .data)
   ↓
Gel persistence (Project + SourceDocument)
   ↓
Viewer UI (PDF.js rendering)
```

**High-Level Flow (next):**

```
PDF Upload
   ↓
PyMuPDF Extraction Service (index-pdf-extractor)
   ↓
DocumentPage + IndexMention storage
   ↓
Index Editor UI (mentions ↔ entries)
   ↓
Exported Index
```

---

## 2) Workspace Structure

```
/apps
  /index-pdf-frontend    # Next.js UI (tRPC client)
  /index-pdf-backend     # Fastify + tRPC API
  /index-pdf-extractor   # PyMuPDF extraction service (Python)
/packages
  /core                  # Shared types/utilities
  /events                # Event definitions + helpers
  /llm                   # Prompt templates + LLM helpers (planned)
  /pdf                   # PDF helpers + parsing utilities
  /yaboujee              # Design system + PDF viewer components
  /storybook-*           # Storybook tooling + VRT
```

---

## 3) Core Components

### 3.1 Frontend (Next.js)

**Responsibilities:**
- Project selection and document browsing
- PDF viewing (PDF.js)
- Highlight rendering and annotation UX

**Key packages:**
- `@pubint/yaboujee` for UI + PDF components
- `@pubint/core` for shared types

### 3.2 Backend (Fastify + tRPC)

**Responsibilities:**
- Auth (Gel Auth)
- Project CRUD
- Source document ingestion
- Domain events (audit trail)

**Key patterns:**
- tRPC routers for CRUD and read APIs
- REST upload route for multipart PDF uploads
- Service/Repo layering for domain logic

### 3.3 Extraction Service (PyMuPDF)

**Responsibilities:**
- Canonical text extraction
- Span-level bounding boxes
- Deterministic outputs for indexing

**Status:** Implemented as a standalone Python service in `apps/index-pdf-extractor`.

---

## 4) Data Model (Gel)

### 4.1 Indexing Domain (current schema)

The schema defines the indexing workflow and audit trail:

- **Workspace**
- **Project**
- **SourceDocument**
- **DocumentPage**
- **IndexEntry** (concept)
- **IndexMention** (occurrence)
- **IndexVariant** (synonyms)
- **IndexRelation** (see / see also)
- **Event** (audit log)
- **Prompt** / **LLMRun**
- **ExportedIndex**

### 4.2 Search / Embedding Domain

The schema also includes a generic search domain:

- **Document**
- **DocumentChunk** (embeddings for semantic search)

---

## 5) Ingestion Pipeline (Implemented)

```
Client Upload
  → Fastify multipart route (/projects/:projectId/source-documents/upload)
  → SourceDocument service
  → Local file storage (.data/source-documents)
  → Gel persistence
  → Domain event emission
```

**Notes:**
- Upload validation includes MIME + PDF magic bytes.
- File storage is abstracted for eventual GCS/S3 swap.

---

## 6) Extraction + Indexing Pipeline (Planned)

```
SourceDocument (uploaded)
  → PyMuPDF extraction (text + spans)
  → DocumentPage creation
  → IndexMention creation (bbox + offsets)
  → IndexEntry + IndexVariant suggestions
```

**MVP behavior:** extraction may be synchronous; later moved to async queue.

---

## 7) API Layer Guidance

- **tRPC** for domain CRUD and data queries
- **REST** only where needed (e.g., multipart uploads, file downloads)
- **Service layer** owns validation + invariants
- **Repo layer** is Gel-only data access

---

## 8) Component Architecture Reference

For a detailed breakdown of PDF viewer and highlighting components, see:
`documents/architecture/component-architecture.md`

---

## 9) Scaling Considerations (MVP → v1)

1. **Async extraction**: offload PyMuPDF to queue workers.
2. **Event-driven workflows**: emit events for extraction + indexing steps.
3. **Streaming extraction**: page-at-a-time processing for large PDFs.
4. **LLM gating**: confidence + review workflow for IndexEntry suggestions.
5. **Exports**: deterministic index formatting from IndexEntry + IndexMention.
