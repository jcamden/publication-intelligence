# Epic 4: Export & Publishing

## Goal

Format and export index in multiple formats ready for publication.

## User Story

As an indexer, I want to export my finished index in Word/LaTeX/plain text formats, so I can deliver it to publishers in their required format.

## Dependencies

- Epic 3: Index Editor (need finalized entries)
- Epic 1: Phase 5 (need mentions for page numbers)

## Tasks

### Task 1: Format Engine ([task-1-format-engine.md](./task-1-format-engine.md))
**Status:** Not Started  
**Duration:** 3-4 days

Core formatting logic for index layout.

**Deliverables:**
- Alphabetization (respect sort keys)
- Hierarchy rendering (indent levels)
- Page number formatting (ranges, commas)
- Cross-reference rendering

### Task 2: Multi-Format Support ([task-2-multi-format.md](./task-2-multi-format.md))
**Status:** Not Started  
**Duration:** 2-3 days

Export to Word, LaTeX, plain text, CSV.

**Deliverables:**
- Word (.docx) with styles
- LaTeX with proper commands
- Plain text (indented)
- CSV for data import

### Task 3: Print-Ready Output ([task-3-print-ready.md](./task-3-print-ready.md))
**Status:** Not Started  
**Duration:** 2 days

Ensure output meets professional standards.

**Deliverables:**
- Preview before export
- Style customization (fonts, spacing)
- Validation (no empty entries, page numbers present)
- Chicago Manual of Style compliance

## Success Criteria

- ✅ Index exports to Word with formatting
- ✅ Alphabetization correct (including special chars)
- ✅ Page numbers formatted correctly (ranges: 42-45)
- ✅ Cross-references rendered
- ✅ Output meets professional standards

## Technical Notes

- Use docx library for Word generation
- LaTeX: just text generation, user compiles
- CSV: for import to InDesign or other tools
- Consider two-column layout for print preview
