# Phase 1: Text Extraction

**Duration:** 2-3 days  
**Priority:** P0 (Critical path)  
**Status:** Not Started

## Overview

Extract text from PDF using PyMuPDF, create TextAtoms in memory, filter by exclude regions, and prepare for LLM processing. TextAtoms are ephemeral (not persisted) but enable deterministic re-extraction for Stage B mention detection.

## Goals

1. Extract word-level text with bounding boxes from PDF
2. Filter text based on exclude regions (headers, footers, ignored pages)
3. Store only `indexable_text` per page (for re-filtering and Stage B re-extraction)
4. Store page dimensions for bbox conversion (PyMuPDF ↔ PDF.js)
5. Compute `extraction_version` for detecting changes
6. Provide progress tracking for extraction jobs

## Key Architectural Decisions

### TextAtoms Are Extraction-Time Only

**Decision:** Extract TextAtoms in memory during detection, don't persist to database.

**Rationale:**
- TextAtoms only needed during detection (Stage B mapping)
- Re-extraction is fast (~50-100ms per page) and deterministic
- Saves 45k+ database rows per 200-page book
- Simpler schema

**How It Works:**
```
Extraction → Store indexable_text → Discard TextAtoms
  ↓
Detection Stage B → Re-extract TextAtoms for primary page → Map char_range → bbox
  ↓
Store IndexMention with bbox → Discard TextAtoms again
```

### Extraction Versioning

**Decision:** Compute hash of all `indexable_text` to detect changes.

**Rationale:**
- Ignore contexts may change after detection
- Need to validate existing mentions against new extraction
- `extraction_version` enables comparison without re-processing

**Implementation:**
```typescript
const computeExtractionVersion = async ({ projectId }) => {
  const pages = await db.documentPages.findMany({
    where: { project: { id: projectId } },
    orderBy: { pageNumber: 'asc' }
  });
  
  const concatenated = pages.map(p => p.indexableText ?? '').join('\n');
  return crypto.createHash('sha256').update(concatenated).digest('hex').slice(0, 16);
};
```

### Two-Stage Ignore Context Filtering

**Decision:** Filter at two stages: pre-extraction and post-acceptance.

**Stage 1 - Pre-extraction:**
- Mark TextAtoms `isIndexable=false` if within exclude region bbox
- Don't send non-indexable text to LLM
- Skip ignored pages entirely

**Stage 2 - Post-acceptance:**
- Warn if accepted mention overlaps exclude region
- User can configure auto-action (warn | auto-reject | auto-suppress)

## Database Schema Changes

### Extend `document_pages` (2 new columns)

```sql
ALTER TABLE document_pages
  ADD COLUMN indexable_text text,                -- Filtered text (for re-filtering + Stage B)
  ADD COLUMN dimensions json;                    -- {width, height} for bbox conversion

-- Example dimensions:
-- {"width": 612.0, "height": 792.0}  -- US Letter in PDF points
```

### Extend `projects` (1 new column)

```sql
ALTER TABLE projects
  ADD COLUMN extraction_status text DEFAULT 'not_started';
  
-- Values: 'not_started' | 'in_progress' | 'completed' | 'failed'
```

## TextAtom Structure (In-Memory Only)

```typescript
type TextAtom = {
  id: string;              // Temporary ID for LLM response (e.g., "atom_1234")
  word: string;            // The word text
  bbox: BBox;              // PyMuPDF coordinates {x0, y0, x1, y1}
  charStart: number;       // Character offset in indexableText
  charEnd: number;         // Character offset in indexableText
  pageNumber: number;      // Which page
  sequence: number;        // Reading order within page
  isIndexable: boolean;    // False if within exclude region
  confidence?: number;     // OCR confidence (if applicable)
  fontName?: string;       // Font metadata
  fontSize?: number;       // Font size
};

// NOT PERSISTED - created on demand, discarded after use
```

## Bbox Conversion Utilities

### PyMuPDF → PDF.js Conversion

**Problem:** PyMuPDF uses bottom-left origin, PDF.js uses top-left origin.

**Solution:** Transform coordinates considering page height, rotation, and scale.

```python
# backend/services/pdf/bbox_converter.py

def pymupdf_to_pdfjs_bbox(
    pymupdf_bbox: dict,
    page_height: float,
    scale: float = 1.0,
    rotation: int = 0
) -> dict:
    """Convert PyMuPDF bbox to PDF.js viewport coordinates."""
    x0, y0, x1, y1 = pymupdf_bbox['x0'], pymupdf_bbox['y0'], pymupdf_bbox['x1'], pymupdf_bbox['y1']
    
    # Step 1: Flip Y-axis (PyMuPDF uses bottom-left origin)
    y0_flipped = page_height - y1
    y1_flipped = page_height - y0
    
    # Step 2: Apply rotation (0, 90, 180, 270 degrees)
    if rotation == 0:
        x_final, y_final = x0, y0_flipped
        width_final, height_final = x1 - x0, y1 - y0
    elif rotation == 90:
        x_final, y_final = y0_flipped, page_height - x1
        width_final, height_final = y1 - y0, x1 - x0
    elif rotation == 180:
        x_final, y_final = page_height - x1, page_height - y1_flipped
        width_final, height_final = x1 - x0, y1 - y0
    elif rotation == 270:
        x_final, y_final = page_height - y1_flipped, x0
        width_final, height_final = y1 - y0, x1 - x0
    
    # Step 3: Apply scale
    return {
        'x0': x_final * scale,
        'y0': y_final * scale,
        'x1': (x_final + width_final) * scale,
        'y1': (y_final + height_final) * scale
    }
```

```typescript
// packages/core/src/bbox-conversion.ts

export const convertPyMuPdfToPdfJs = ({
  bbox,
  pageHeight,
  scale = 1.0,
  rotation = 0,
}: {
  bbox: { x0: number; y0: number; x1: number; y1: number };
  pageHeight: number;
  scale?: number;
  rotation?: 0 | 90 | 180 | 270;
}): { x0: number; y0: number; x1: number; y1: number } => {
  const { x0, y0, x1, y1 } = bbox;
  
  // Step 1: Flip Y-axis
  const y0Flipped = pageHeight - y1;
  const y1Flipped = pageHeight - y0;
  
  // Step 2: Apply rotation
  let xFinal: number, yFinal: number, widthFinal: number, heightFinal: number;
  
  switch (rotation) {
    case 0:
      xFinal = x0;
      yFinal = y0Flipped;
      widthFinal = x1 - x0;
      heightFinal = y1 - y0;
      break;
    case 90:
      xFinal = y0Flipped;
      yFinal = pageHeight - x1;
      widthFinal = y1 - y0;
      heightFinal = x1 - x0;
      break;
    case 180:
      xFinal = pageHeight - x1;
      yFinal = pageHeight - y1Flipped;
      widthFinal = x1 - x0;
      heightFinal = y1 - y0;
      break;
    case 270:
      xFinal = pageHeight - y1Flipped;
      yFinal = x0;
      widthFinal = y1 - y0;
      heightFinal = x1 - x0;
      break;
  }
  
  // Step 3: Apply scale
  return {
    x0: xFinal * scale,
    y0: yFinal * scale,
    x1: (xFinal + widthFinal) * scale,
    y1: (yFinal + heightFinal) * scale,
  };
};
```

## tRPC Endpoints (Extend `document` router)

```typescript
// apps/index-pdf-backend/src/routers/document.ts

export const documentRouter = router({
  // ... existing endpoints
  
  extractText: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      pages: z.array(z.number()).optional(), // Optional: extract specific pages only
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Update project.extraction_status = 'in_progress'
      // 2. Queue extraction job (or run synchronously if small)
      // 3. For each page:
      //    - Extract text with PyMuPDF
      //    - Get page dimensions
      //    - Create TextAtoms in memory
      //    - Filter by exclude regions → mark isIndexable
      //    - Store indexable_text + dimensions
      // 4. Compute extraction_version
      // 5. Update project.extraction_status = 'completed'
      return { jobId, extraction_version };
    }),
  
  getExtractionStatus: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      const project = await ctx.db.projects.findUnique({
        where: { id: input.projectId }
      });
      
      return {
        status: project.extraction_status,
        extraction_version: project.extraction_version,
        pages_extracted: await ctx.db.documentPages.count({
          where: { document: { projectId: input.projectId } }
        })
      };
    }),
  
  reExtractText: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Re-run extraction (e.g., after exclude regions changed)
      // This will update indexable_text and extraction_version
      return { jobId };
    }),
});
```

## UI Components

### Extraction Trigger (Project Settings)

```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/settings/_components/text-extraction-panel.tsx

export const TextExtractionPanel = () => {
  const { projectId } = useProject();
  const { data: status } = trpc.document.getExtractionStatus.useQuery({ projectId });
  const extractMutation = trpc.document.extractText.useMutation();
  
  const handleExtract = async () => {
    await extractMutation.mutateAsync({ projectId });
  };
  
  return (
    <div className="extraction-panel">
      <h3>Text Extraction</h3>
      
      {status?.status === 'not_started' && (
        <Button onClick={handleExtract}>
          Extract Text
        </Button>
      )}
      
      {status?.status === 'in_progress' && (
        <div className="progress">
          <Spinner />
          <p>Extracting text... {status.pages_extracted} pages</p>
        </div>
      )}
      
      {status?.status === 'completed' && (
        <div className="completed">
          <CheckIcon />
          <p>Extracted {status.pages_extracted} pages</p>
          <Button variant="secondary" onClick={handleExtract}>
            Re-extract
          </Button>
        </div>
      )}
      
      {status?.status === 'failed' && (
        <Alert variant="error">
          <p>Extraction failed. Please try again.</p>
          <Button onClick={handleExtract}>Retry</Button>
        </Alert>
      )}
    </div>
  );
};
```

## Success Criteria

- [ ] PyMuPDF extracts TextAtoms in memory (word, bbox, sequence, page)
- [ ] TextAtom extraction is deterministic (same `indexableText` → same atoms)
- [ ] Ignore contexts filter TextAtoms (`isIndexable=false` if within ignore bbox)
- [ ] Ignored pages skipped entirely (not included in TextAtoms)
- [ ] Only `indexableText` persisted per page (for re-filtering + Stage B re-extraction)
- [ ] Page dimensions stored in `document_pages.dimensions`
- [ ] `extraction_version` computed as hash of all `indexableText`
- [ ] User can trigger extraction manually with progress indicator
- [ ] Extraction completes in < 3min for 200-page book
- [ ] Bbox conversion utilities created (PyMuPDF ↔ PDF.js)
- [ ] TextAtom re-extraction for single page takes < 100ms

## Dependencies

- Epic 1: PDF Viewer (document upload + storage)
- Epic 1: Phase 6 (Region system for exclude regions)
- PyMuPDF library

## Next Steps

After Phase 1 is complete:
1. **Test extraction**: Verify TextAtoms are created correctly with ignore filtering
2. **Test re-extraction**: Verify deterministic behavior (same input → same output)
3. **Test bbox conversion**: Verify highlights render correctly in PDF.js viewer
4. **Move to Phase 2**: Mention Detection with two-stage approach
