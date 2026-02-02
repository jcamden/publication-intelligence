# MVP Definition

**Project:** IndexPDF / Publication Intelligence
**Goal:** Enable professional indexers, editors, and publishers to generate high-quality, publishable indices **2–5× faster** than manual indexing.

---

## 1) Core Hypothesis

> Indexers and authors want to produce professional indices more efficiently, and AI-assisted indexing can reduce repetitive cognitive work while preserving human judgment.

---

## 2) Target User Persona

### Primary User

* Freelance professional indexers
* Academic authors indexing their own books
* Small publishers and editors

**Pain Points**

* Manual indexing is slow, error-prone, and repetitive.
* Tracking page numbers, synonyms, and hierarchies is tedious.
* Existing tools focus on formatting, not concept discovery.

**Success Definition**

* The user can generate a fully reviewed, formatted index in hours instead of days.
* Index quality meets professional standards.

---

## 3) MVP Use Case: AI-Assisted Index Generation

### Workflow

1. **Upload Manuscript / PDF**
   User uploads a PDF of the book or manuscript.

2. **Generate Candidate Index Entries**
   AI produces suggested entries:

   * Subject headings
   * Subentries
   * Synonym clusters
   * Page references

3. **Interactive Review & Editing**
   User edits entries:

   * Rename, merge, or split concepts
   * Adjust hierarchy
   * Remove irrelevant suggestions
   * Inspect source text via PDF highlights

4. **Export Index**
   Output to:

   * Print-ready formats (Word, LaTeX, InDesign-friendly)
   * CSV or XML for digital use

---

## 4) MVP Feature Scope

### ✅ Must-Have Features

#### A. Candidate Index Generator

* Detect concepts/topics in text
* Map occurrences to page numbers
* Cluster related terms
* Suggest hierarchy (entry → subentry)

#### B. Index Editor Interface

* Two-pane layout:

  * **Left:** Index tree (entries & hierarchy)
  * **Right:** PDF viewer with highlights
* Interaction:

  * Click concept → highlight corresponding text spans
  * Click span → show candidate concepts

#### C. Human-in-the-Loop Controls

* Approve/reject suggestions
* Rename and merge terms
* Adjust hierarchy
* Add manual entries
* Remove noise

#### D. Export Engine

* Print-ready index output
* Basic formatting (alphabetical sorting, indentation)
* Multiple formats (plain text, Word, LaTeX-compatible)

---

### ❌ Explicitly Out of Scope

* Cross-book or cross-document indexing
* Collaborative editing
* Multi-format ingestion (DOCX, EPUB, HTML)
* Full ontology management
* Enterprise authentication / role management
* Advanced knowledge graphs
* OCR pipelines (unless absolutely required)
* Real-time concept suggestion updates

> Focus: only what is required to **prove the AI-assisted indexer workflow creates real, measurable time savings**.

---

## 5) Minimal Data Model

### Document

```json
Document {
  id,
  title,
  file_path
}
```

### Page

```json
Page {
  id,
  document_id,
  page_number
}
```

### Atom (Text Primitive)

```json
Atom {
  id,
  page_id,
  text,
  bbox
}
```

### Concept (Candidate Index Entry)

```json
Concept {
  id,
  document_id,
  label,
  parent_id  // for hierarchy
}
```

### ConceptSpan

```json
ConceptSpan {
  concept_id,
  atom_id
}
```

**Notes**

* Concept → span mapping drives PDF highlighting.
* Concept hierarchy drives index formatting.
* Atoms are the atomic text units for reference, not semantics themselves.

---

## 6) Success Criteria

The MVP is successful if:

### User-Level Signals

* Indexers can generate a usable index faster than manually.
* Users say:

  > “This would have taken me days manually.”
* Users feel empowered to edit AI suggestions, not overwhelmed.

### Technical Signals

* Concept → page span mapping works reliably.
* Supports 200–500 page PDFs.
* Latency acceptable (async processing for large books is fine).

### Business Signals

* ≥ 3 real indexers or publishers complete a book with AI-assist.
* Users provide feedback asking for continued use.

---

## 7) MVP Architecture (Minimal, Index-Focused)

```
PDF Upload → Text Extraction (Atoms) → Candidate Index Generation (LLM/ML) → Index Editor UI → Export
```

* Extraction: PDFJS or PyMuPDF
* Candidate generation: LLM or lightweight heuristic
* Data storage: DB for atoms, concepts, spans
* UI: Two-pane editor (PDF + index)
* Export: formatting engine for print-ready index

> Focus: functional, reliable, minimally elegant. Not perfect, not universal.

---

## 8) MVP Timeline (Aggressive but Realistic)

| Week | Milestone                                            |
| ---- | ---------------------------------------------------- |
| 1    | PDF upload + text extraction per page                |
| 2    | Candidate index generation + mapping to page numbers |
| 3    | Index editor UI (two-pane, highlight linking)        |
| 4    | Basic export functionality + first user testing      |
| 5    | Iterate on LLM prompts / heuristics, UI polish       |
| 6    | MVP demo with 3–5 real indexers                      |

---

## 9) MVP Philosophy

* Semantic indexing is **infrastructure**, invisible to the user.
* The product is about **saving indexers time while preserving control**.
* Minimal features are acceptable as long as the index is usable.
* Avoid fancy explorations; focus on **core indexing loop**.
