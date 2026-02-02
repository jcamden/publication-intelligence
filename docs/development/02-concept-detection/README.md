# Epic 2: Concept Detection & Indexing

## Goal

Extract text from PDFs and use LLM to generate candidate index entries automatically.

## User Story

As an indexer, I want the AI to suggest index entries from my PDF, so I can start with a draft index rather than building everything manually.

## Dependencies

- Epic 1: PDF Viewer (need document upload + storage)
- Infrastructure: PyMuPDF integration for text extraction

## Tasks

### Task 1: Text Extraction ([task-1-text-extraction.md](./task-1-text-extraction.md))
**Status:** Not Started  
**Duration:** 2-3 days

Extract text from PDF with PyMuPDF, store page-level text + bboxes.

**Deliverables:**
- Python service for text extraction
- API endpoint: `POST /extract-text`
- DocumentPage schema with extracted text
- TextAtom schema for word-level bboxes

### Task 2: LLM Integration ([task-2-llm-integration.md](./task-2-llm-integration.md))
**Status:** Not Started  
**Duration:** 3-4 days

Integrate OpenAI/Anthropic for concept detection from extracted text.

**Deliverables:**
- LLM prompt templates for indexing
- Batch processing (page-by-page or chunk-by-chunk)
- Rate limiting + error handling
- Cost estimation + limits

### Task 3: Concept Clustering ([task-3-concept-clustering.md](./task-3-concept-clustering.md))
**Status:** Not Started  
**Duration:** 2-3 days

Deduplicate and merge similar concepts across pages.

**Deliverables:**
- Similarity detection (fuzzy matching + embeddings)
- Merge suggestions UI
- Concept frequency scoring
- Hierarchy inference (parent/child detection)

### Task 4: Entry Suggestions ([task-4-entry-suggestion.md](./task-4-entry-suggestion.md))
**Status:** Not Started  
**Duration:** 2 days

Present AI-generated entries to user for review/approval.

**Deliverables:**
- Suggested entries list view
- Accept/reject/modify workflow
- Bulk accept/reject
- Confidence scoring display

## Success Criteria

- ✅ PDF text extracted with word-level bboxes
- ✅ LLM generates candidate entries
- ✅ Similar concepts merged automatically
- ✅ User can review and approve suggestions
- ✅ Approved entries become IndexEntries
- ✅ Processing time < 5min for 200-page book

## Technical Notes

- Use PyMuPDF (not PDF.js) for extraction (more reliable)
- Store text at page level, not document level
- Keep TextAtoms for future robust anchoring
- Use streaming for large documents
