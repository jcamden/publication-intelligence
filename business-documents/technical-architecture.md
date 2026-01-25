# Technical Architecture & Data Model

**Project:** IndexPDF / Publication Intelligence
**Scope:** MVP (AI-assisted professional indexing of PDFs)

---

## 1) Architecture Overview

**Goal:** Enable professional indexers to generate, review, and export a high-quality index with minimal manual effort.

**High-Level Flow:**

```
PDF Upload
   ↓
Text Extraction → Atoms
   ↓
Candidate Index Generation (LLM / ML)
   ↓
Index Editor UI
   ↕
Human Review / Edit
   ↓
Export (Print-ready Index)
```

**Core Principles:**

* **Decoupled Layers:** Text extraction, concept generation, UI interaction, and export are independent.
* **Immutable References:** Each text atom and concept has a stable ID for highlighting, editing, and export.
* **Human-in-the-Loop:** AI suggestions augment, but do not replace, professional judgment.

---

## 2) Core Components

### 2.1 PDF & Text Extraction Layer

**Responsibilities:**

* Load and parse PDFs.
* Extract text along with page and geometric coordinates.
* Normalize text into “Atoms” for later linking.

**Implementation Options:**

| Layer          | Tool Options                          |
| -------------- | ------------------------------------- |
| Viewer         | PDFJS (frontend)                      |
| Extraction     | PyMuPDF (backend) or PDFJS text layer |
| OCR (optional) | Tesseract, if scanned PDFs            |

**Output:** `Atom` objects:

```json
Atom {
  id: "atom-uuid",
  page_id: 42,
  text: "Divine providence is central to...",
  bbox: {x: 50, y: 120, width: 200, height: 14}
}
```

**Notes:**

* BBox allows PDF highlights and interactivity.
* One page = many atoms.

---

### 2.2 Candidate Index Generator (Concept Layer)

**Responsibilities:**

* Suggest indexable entries (Concepts) from text.
* Map concepts to Atoms (spans).
* Cluster synonyms and generate hierarchy/subentries.

**Implementation Options:**

* LLM calls per page, e.g.:

```
Prompt: "List indexable concepts on this page and the supporting text spans."
Output: JSON with concept labels and atom IDs
```

* Optional fallback: heuristic term frequency + noun phrase extraction.

**Output Schema:**

```json
Concept {
  id: "concept-uuid",
  document_id: "doc-uuid",
  label: "Divine Providence",
  parent_id: null
}

ConceptSpan {
  concept_id: "concept-uuid",
  atom_id: "atom-uuid"
}
```

**Notes:**

* Concept → ConceptSpan mapping drives UI highlighting.
* Parent/child IDs support hierarchical subentries.

---

### 2.3 Index Editor UI

**Responsibilities:**

* Display PDF and text highlights.
* Display candidate index tree with hierarchy.
* Allow:

  * Approve/reject concepts
  * Merge/split concepts
  * Rename concepts
  * Adjust hierarchy
  * Add/remove concepts

**Architecture:**

* **Two-Pane Layout:**

  * Left: Index tree (Concepts)
  * Right: PDF viewer (Atoms)
* **Interactions:**

  * Click concept → highlight atoms
  * Click atom → show associated concepts

**Tech Choices:**

* Frontend: Next.js + React
* PDF layer: PDFJS
* State: local state + API
* Styling: Tailwind / component library

---

### 2.4 Export Engine

**Responsibilities:**

* Generate print-ready indices.
* Support:

  * Alphabetical ordering
  * Hierarchy formatting
  * Page numbers
* Output formats:

  * Word (.docx)
  * CSV / XML
  * LaTeX-compatible text

**Implementation Notes:**

* Flatten Concept → ConceptSpan → Page → Document mapping.
* Formatting rules apply during export, not stored in DB.

---

## 3) Data Model

### 3.1 Entity Definitions

#### Document

```json
Document {
  id: "doc-uuid",
  title: "Book Title",
  file_path: "/uploads/book.pdf"
}
```

#### Page

```json
Page {
  id: "page-uuid",
  document_id: "doc-uuid",
  page_number: 42
}
```

#### Atom (Text Primitive)

```json
Atom {
  id: "atom-uuid",
  page_id: "page-uuid",
  text: "Text content...",
  bbox: {x, y, width, height}
}
```

#### Concept (Candidate Index Entry)

```json
Concept {
  id: "concept-uuid",
  document_id: "doc-uuid",
  label: "Divine Providence",
  parent_id: null  // optional for subentries
}
```

#### ConceptSpan

```json
ConceptSpan {
  concept_id: "concept-uuid",
  atom_id: "atom-uuid"
}
```

**Relationships:**

* Document → Page → Atom
* Document → Concept → ConceptSpan → Atom
* Concept → Concept (parent/child hierarchy)

---

### 3.2 Optional Extensions (Future-Proof)

* Multi-document concept linking
* Synonym groups across books
* Versioned concepts for iterative edits
* Audit trail of human corrections
* Embedding storage for advanced search

---

## 4) Technology Stack (MVP)

| Layer         | Technology                            |
| ------------- | ------------------------------------- |
| Frontend      | Next.js, React, Tailwind              |
| PDF Rendering | PDFJS                                 |
| Backend       | Next.js API routes (Node/trpc)        |
| Storage       | Gel DB                                |
| AI / LLM      | OpenAI API (BYO keys)                 |
| Deployment    | GCP (App Engine or Cloud Run)         |
| Queue / Async | Cloud Tasks / simple in-process queue |

**Notes:**

* Minimal backend for MVP.
* All heavy computation (LLM) offloaded to external APIs.

---

## 5) Architectural Principles

1. **Pluggable Text Extraction:** Support multiple PDF parsers (PDFJS, PyMuPDF, OCR).
2. **Immutable Atom IDs:** Anchors for concept spans, UI highlights, and export.
3. **Concept Layer Abstraction:** Separates AI-generated knowledge from UI logic.
4. **Human-in-the-Loop First:** AI assists; humans validate.
5. **Future-Proof Export:** Export formats defined by mapping from Concept → ConceptSpan → Page → Document.
6. **Async Processing:** LLM operations handled asynchronously to avoid UI blocking.
7. **Scalable Data Model:** Allows multiple PDFs, multiple books, multiple projects.

---

## 6) MVP Constraints

* Maximum document size: 500 pages (scaling later)
* Concept extraction per page (batched or async)
* No real-time multi-user collaboration yet (see below)
* Limited to PDF uploads
* LLM hallucinations are acceptable at MVP stage — human validation required

---

## 7) Real-time Considerations and Roadmap



### 1) Message-Based / Event-Sourcing Model For MVP

**Idea:**
Instead of full real-time, design all index modifications as **discrete events/messages**:

* `ConceptCreated`, `ConceptRenamed`, `ConceptMerged`, `SpanLinked`, `SpanUnlinked`, etc.
* Each event includes timestamp, actor ID, and payload.
* Store them in an **append-only log** (or just a table).

**Benefits:**

* MVP can be purely request-response; users save/edit via normal HTTP API.
* No real-time synchronization needed yet.
* Later, you can **stream these events over WebSockets** or a message bus to multiple clients for real-time collaboration.
* You already have **stable IDs** for Atoms & Concepts → mapping events to objects is straightforward.

**Implementation cost for MVP:**

* Minimal extra overhead: 1–2 days to design event model + update backend API to accept events.
* Frontend remains simple — events can be batched if necessary.
* Future-proof: real-time is a **feature toggle**, not a redesign.

**Example Event Schema:**

```json
{
  "event_id": "uuid",
  "type": "ConceptRenamed",
  "actor_id": "user-uuid",
  "timestamp": "2026-01-25T14:23:00Z",
  "payload": {
    "concept_id": "concept-uuid",
    "new_label": "Divine Providence"
  }
}
```

**Flow for Future Real-Time Upgrade:**

* Each client subscribes to a WebSocket channel.
* Events are broadcasted and applied locally.
* CRDT or simple last-write-wins resolution applied if needed.

> Verdict: Strongly recommended for MVP. It allows you to move toward real-time without paying the full cost upfront.

---

### 2) PDF Highlighting Considerations

Whether full real-time or message-based:

* You’ll need **stable Atom IDs** mapped to the document.
* Spans may change if the user edits the index tree.
* Mapping events to spans works cleanly with the **Atom → Concept → ConceptSpan model**.

**Message-based approach:** You just send `SpanLinked`/`SpanUnlinked` events. Later, when multiple users are connected, these events can propagate over WebSockets.

---
## 7) Next Steps

1. Implement **Atom extraction** + PDF viewer highlighting.
2. Build **Concept generation backend** with LLM prompt templates.
3. Build **Index Editor UI** with two-pane interaction.
4. Implement **Export Engine** (Word / CSV).
5. Integrate **user feedback loop** for human validation.
