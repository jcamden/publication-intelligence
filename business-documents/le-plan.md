# Implementation Order for IndexPDF MVP

## **Phase 0: Project Setup (1–2 days)**

* Initialize monorepo (`apps` + `packages`)

  * `/apps/index-pdf-frontend` (Next.js + PDFJS)
  * `/apps/index-pdf-backend` (Fastify or NestJS API)
  * `/packages/core` (shared types/interfaces: Document, Page, Atom, Concept, ConceptSpan)
  * `/packages/pdf` (PDF parsing helpers)
  * `/packages/llm` (LLM prompt templates, candidate generation logic)
* Configure TypeScript, linting, prettier, tailwind (frontend), unit testing framework (Jest / Vitest).
* Set up basic Git workflow + branch protection.

---

## **Phase 1: PDF Upload + Storage (2–3 days)**

* Backend endpoint: `/api/documents` (upload PDF → store on disk or cloud storage).
* Database: store `Document` metadata (title, file path, upload date).
* Minimal frontend form to upload PDF and list uploaded documents.

**Goal:** You can now upload PDFs and track them in your database.

---

## **Phase 2: Text Extraction → Atoms (3–5 days)**

* **Backend:** Implement PDF parsing via PyMuPDF or PDFJS extraction (server-side).
* Create **Atom objects** with:

  * text content
  * page number
  * bounding box (`x`, `y`, `width`, `height`)
  * stable `atom_id`
* Save `Page` and `Atom` objects in database.
* **Frontend:** render PDF (PDFJS), but just for basic viewing — no interactivity yet.

**Goal:** You can upload a PDF and extract its text into a structured model of Atoms mapped to pages.

---

## **Phase 3: Candidate Index Generation (LLM) (3–5 days)**

* Backend:

  * Implement LLM interface in `/packages/llm`
  * Generate **Concepts** with page references and ConceptSpans.
  * Ensure JSON output includes `concept_id`, `label`, `parent_id`, and `atom_ids`
* Store Concepts & ConceptSpans in DB.

**Goal:** MVP can produce AI-suggested index entries with references to the text layer.

---

## **Phase 4: Basic Index Editor UI (5–7 days)**

* Frontend: **Two-pane layout**

  * Left: Concept / Index tree
  * Right: PDF viewer
* Implement highlighting: click Concept → highlight Atoms in PDF.
* Optional: click text span → show associated Concept(s).
* Implement basic **approve/reject** of suggested Concepts.

**Goal:** MVP users can visualize suggestions and interact with them.

---

## **Phase 5: Human-in-the-Loop Editing Features (3–5 days)**

* Rename concepts (`ConceptRenamed`)
* Merge concepts (`ConceptMerged`)
* Adjust hierarchy (`HierarchyChanged`)
* Add manual entries (`ConceptCreated`)
* Remove irrelevant concepts (`ConceptDeleted`)

**Implementation tip:** Use an **event/message log model** from day one to future-proof real-time collaboration.

---

## **Phase 6: Export Engine (2–3 days)**

* Backend: convert Concept tree → alphabetical, hierarchical index
* Export formats:

  * Word (.docx)
  * CSV / XML
  * Optional: LaTeX
* Ensure page numbers pulled from ConceptSpan → Atom → Page mapping.

**Goal:** Users can produce a **print-ready index** from the MVP.

---

## **Phase 7: Polish & UX (2–4 days)**

* UI improvements: drag/drop hierarchy, collapsible tree, responsive layout.
* PDF highlight animation / better color mapping.
* Error handling, edge cases (empty PDFs, invalid pages).
* Logging / debugging dashboards (basic).

---

## **Phase 8: Optional Enhancements**

* **Message/Event logging** for future real-time sync.
* Lightweight analytics: LLM usage, processing time.
* Export templates / style options for different index formats.

---

### ✅ Key Principles

1. **Bottom-up approach**: Build **stable data model** first → Atoms → Concepts → UI → Export.
2. **Human-in-the-loop first**: AI is always suggestive; user edits drive reality.
3. **Keep MVP scope tight**: No cross-document features or collaborative editing yet.
4. **Event model**: design edits as events early for future real-time.