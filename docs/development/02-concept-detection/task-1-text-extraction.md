# Task 1: Text Extraction & Storage

**Status:** ⚪ Not Started  
**Dependencies:** Phase 5 (Document upload), Phase 6 (Region system)  
**Duration:** 3-4 days

## Overview

Extract text from uploaded PDFs using PyMuPDF, store at page level with word-level bounding boxes (TextAtoms), and respect exclude regions when extracting indexable text.

This task provides the foundation for LLM-based concept detection by ensuring clean, context-aware text extraction.

## Requirements

### 1. Text Extraction Service (Python/PyMuPDF)

- [ ] Create Python service using PyMuPDF (fitz)
- [ ] Extract text at page level (not document level)
- [ ] Capture word-level bounding boxes (TextAtoms)
- [ ] Store both raw text and structured text atoms
- [ ] Handle multi-column layouts
- [ ] Detect reading order (left-to-right, top-to-bottom)

### 2. Context-Aware Filtering

- [ ] Fetch exclude regions for the document/project
- [ ] Filter out text atoms that fall within exclude region bboxes
- [ ] Apply ignore logic: If text atom bbox is 100% within ignore bbox → exclude
- [ ] Preserve both "raw text" (all text) and "indexable text" (filtered)

**Why Both?**
- Raw text: For future features (OCR validation, manual review)
- Indexable text: For LLM concept detection (respects user's exclude regions)

### 3. Storage Schema

**DocumentPage Table (already exists, extend):**
```typescript
{
  id: uuid;
  documentId: uuid;
  pageNumber: integer;
  textContent: text;           // Raw extracted text (for display)
  indexableText: text;         // Filtered text (respects exclude regions)
  extractedAt: timestamp;
  textAtomsCount: integer;     // Count of word-level atoms
  dimensions: json;            // { width: number, height: number } in PDF points (for bbox conversion)
  metadata: json;              // extraction stats, warnings
}
```

**Migration:**
```sql
ALTER TABLE document_pages 
  ADD COLUMN dimensions json;
  
-- Update existing pages (if any)
-- Will be populated during text extraction
```

**TextAtom Table (new):**
```typescript
{
  id: uuid;
  pageId: uuid;
  word: text;                  // The extracted word
  bbox: json;                  // BoundingBox in PDF user space
  confidence: float;           // PyMuPDF confidence score
  fontName: text;              // Font information (useful later)
  fontSize: float;
  isIndexable: boolean;        // False if within exclude region
  sequence: integer;           // Reading order
  createdAt: timestamp;
}
```

**Why Store TextAtoms?**
- Future: Robust anchoring for mentions (word-level precision)
- Future: Reading order for better context windows
- Debugging: Verify exclude region filtering
- MVP: Not used for highlighting (we use user-drawn bboxes), but stored for later

### 4. API Endpoint

**POST `/api/trpc/document.extractText`**

**Input:**
```typescript
{
  documentId: string;
  projectId: string;
  pages?: number[];  // Optional: extract specific pages, default: all
}
```

**Output:**
```typescript
{
  success: boolean;
  pagesProcessed: number;
  totalWords: number;
  indexableWords: number;
  filteredWords: number;    // Excluded by exclude regions
  durationMs: number;
  warnings?: string[];      // e.g., "Page 5 has low confidence text"
}
```

**Behavior:**
1. Fetch document from storage
2. Fetch exclude regions for project
3. For each page:
   - Extract text with PyMuPDF
   - Get word-level bounding boxes
   - Filter words within exclude regions
   - Store DocumentPage with both raw and indexable text
   - Store TextAtoms (with isIndexable flag)
4. Return extraction summary

### 5. Processing Strategy

**User-Initiated:**
- User manually triggers extraction from project settings or document view
- Show loading indicator: "Extracting text from 200 pages..."
- Extraction runs in background (async job)
- Show completion notification when done

**Incremental Processing:**
- Process pages in chunks (e.g., 10 pages at a time)
- Store progress in database (pages_extracted field on Document)
- Allow resume if interrupted
- Show progress: "Extracting text: 45/200 pages"

**Re-extraction:**
- If exclude regions change, user can re-extract
- Warning: "Re-extracting will update indexable text. Existing suggestions may change."
- Keep raw text, regenerate indexable text only

## Technical Approach

### Python Service Architecture

**Location:** `apps/index-pdf-backend/src/services/text-extraction/`

**Files:**
```
text-extraction/
├── extractor.py           # PyMuPDF wrapper
├── context_filter.py      # Apply exclude regions
├── text_atom_builder.py   # Build TextAtom records
├── extraction_job.py      # Async job handler
└── bbox_converter.py      # PyMuPDF ↔ PDF.js coordinate conversion
```

### Coordinate System Compatibility

**Challenge:** PyMuPDF and PDF.js both use PDF user space, but with different transformations.

- **PyMuPDF**: Bottom-left origin, direct PDF coordinates `(x0, y0, x1, y1)`
- **PDF.js Viewer**: Same user space, but with viewport transformations (scale, rotation)

**Solution:** Store PyMuPDF coordinates in database, convert to PDF.js viewport coordinates when displaying.

**Why Store PyMuPDF Coordinates?**
- Canonical representation (no viewport dependency)
- Conversion is lightweight (just matrix transformation)
- Future-proof if viewer implementation changes

**Key Functions:**

```python
# extractor.py
def extract_page_text(pdf_path: str, page_num: int) -> PageTextResult:
    """Extract text and bounding boxes using PyMuPDF."""
    doc = fitz.open(pdf_path)
    page = doc[page_num]
    
    # Get word-level text blocks with bboxes
    words = page.get_text("words")  # Returns list of (x0, y0, x1, y1, word, block_no, line_no, word_no)
    
    # Get page dimensions (needed for coordinate conversion)
    page_height = page.rect.height
    page_width = page.rect.width
    
    # Convert to TextAtom format
    text_atoms = []
    for (x0, y0, x1, y1, word, *rest) in words:
        text_atoms.append({
            "word": word,
            "bbox": {
                "x": x0,
                "y": y0,
                "width": x1 - x0,
                "height": y1 - y0
            },
            "confidence": 1.0,  # PyMuPDF doesn't provide confidence, default to 1.0
        })
    
    return {
        "raw_text": page.get_text(),
        "text_atoms": text_atoms,
        "page_dimensions": {
            "width": page_width,
            "height": page_height
        }
    }
```

```python
# bbox_converter.py
"""
Coordinate conversion between PyMuPDF and PDF.js viewport coordinates.

PyMuPDF uses PDF user space with bottom-left origin.
PDF.js uses the same user space but applies viewport transformations.

Conversion is straightforward: just flip Y-axis and apply scale.
"""

from typing import TypedDict

class BBox(TypedDict):
    x: float
    y: float
    width: float
    height: float

class PageDimensions(TypedDict):
    width: float
    height: float

def pymupdf_to_pdfjs_bbox(
    pymupdf_bbox: BBox,
    page_height: float,
    scale: float = 1.0,
    rotation: int = 0
) -> BBox:
    """
    Convert PyMuPDF bbox to PDF.js viewport coordinates.
    
    Args:
        pymupdf_bbox: BBox in PyMuPDF coordinates (bottom-left origin)
        page_height: Height of the page in PDF points
        scale: Viewport scale factor (default: 1.0)
        rotation: Page rotation in degrees (0, 90, 180, 270)
    
    Returns:
        BBox in PDF.js viewport coordinates (top-left origin, scaled)
    """
    x = pymupdf_bbox["x"]
    y = pymupdf_bbox["y"]
    width = pymupdf_bbox["width"]
    height = pymupdf_bbox["height"]
    
    # Flip Y-axis (PyMuPDF: bottom-left, PDF.js: top-left)
    y_flipped = page_height - y - height
    
    # Apply rotation if needed
    if rotation == 90:
        x_rot = y_flipped
        y_rot = page_height - x - width
        width_rot = height
        height_rot = width
    elif rotation == 180:
        x_rot = page_height - x - width
        y_rot = page_height - y_flipped - height
        width_rot = width
        height_rot = height
    elif rotation == 270:
        x_rot = page_height - y_flipped - height
        y_rot = x
        width_rot = height
        height_rot = width
    else:  # rotation == 0
        x_rot = x
        y_rot = y_flipped
        width_rot = width
        height_rot = height
    
    # Apply scale
    return {
        "x": x_rot * scale,
        "y": y_rot * scale,
        "width": width_rot * scale,
        "height": height_rot * scale
    }

def pdfjs_to_pymupdf_bbox(
    pdfjs_bbox: BBox,
    page_height: float,
    scale: float = 1.0,
    rotation: int = 0
) -> BBox:
    """
    Convert PDF.js viewport bbox to PyMuPDF coordinates (inverse operation).
    
    Useful if we ever need to convert user-drawn highlights back to PyMuPDF space.
    """
    # Remove scale first
    x = pdfjs_bbox["x"] / scale
    y = pdfjs_bbox["y"] / scale
    width = pdfjs_bbox["width"] / scale
    height = pdfjs_bbox["height"] / scale
    
    # Reverse rotation
    if rotation == 90:
        x_unrot = page_height - y - height
        y_unrot = x
        width_unrot = height
        height_unrot = width
    elif rotation == 180:
        x_unrot = page_height - x - width
        y_unrot = page_height - y - height
        width_unrot = width
        height_unrot = height
    elif rotation == 270:
        x_unrot = y
        y_unrot = page_height - x - width
        width_unrot = height
        height_unrot = width
    else:  # rotation == 0
        x_unrot = x
        y_unrot = y
        width_unrot = width
        height_unrot = height
    
    # Flip Y-axis back
    y_pymupdf = page_height - y_unrot - height_unrot
    
    return {
        "x": x_unrot,
        "y": y_pymupdf,
        "width": width_unrot,
        "height": height_unrot
    }
```

```python
# context_filter.py
def filter_by_ignore_regions(
    text_atoms: List[TextAtom],
    exclude_regions: List[Context]
) -> tuple[str, List[TextAtom]]:
    """Filter text atoms that fall within exclude region bboxes."""
    indexable_atoms = []
    
    for atom in text_atoms:
        is_ignored = any(
            bbox_fully_within(atom.bbox, ctx.bbox)
            for ctx in exclude_regions
        )
        
        if not is_ignored:
            indexable_atoms.append(atom)
    
    # Reconstruct indexable text from remaining atoms
    indexable_text = " ".join(atom.word for atom in indexable_atoms)
    
    return indexable_text, indexable_atoms
```

### Database Integration

**Migration:**
- Add `text_atoms` table
- Add `indexable_text` column to `document_pages`
- Add `text_atoms_count` column to `document_pages`
- Add `extraction_status` enum to `source_documents` table

**Enums:**
```sql
CREATE TYPE extraction_status AS ENUM(
  'not_started',
  'in_progress',
  'completed',
  'failed'
);
```

### tRPC Router

**Location:** `apps/index-pdf-backend/src/modules/document/document.router.ts`

**Endpoints:**
```typescript
document: {
  extractText: // Initiate extraction job
  getExtractionStatus: // Poll extraction progress
  getPageText: // Get extracted text for specific page
  reExtractText: // Re-run extraction (e.g., after context changes)
}
```

**Implementation:**
```typescript
extractText: protectedProcedure
  .input(z.object({
    documentId: z.string().uuid(),
    projectId: z.string().uuid(),
    pages: z.array(z.number()).optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    // 1. Validate user has access to project
    const project = await ctx.db.query.projects.findFirst({
      where: eq(projects.id, input.projectId),
    });
    
    if (!project) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
    
    // 2. Fetch document and exclude regions
    const document = await ctx.db.query.sourceDocuments.findFirst({
      where: eq(sourceDocuments.id, input.documentId),
    });
    
    const ignoreContexts = await ctx.db.query.contexts.findMany({
      where: and(
        eq(regions.projectId, input.projectId),
        eq(contexts.regionType, 'exclude'),
        isNull(contexts.deletedAt),
      ),
    });
    
    // 3. Enqueue extraction job
    const jobId = await enqueueExtractionJob({
      documentId: input.documentId,
      projectId: input.projectId,
      documentPath: document.filePath,
      ignoreContexts,
      pages: input.pages,
    });
    
    // 4. Update document status
    await ctx.db.update(sourceDocuments)
      .set({ 
        extractionStatus: 'in_progress',
        extractionJobId: jobId,
      })
      .where(eq(sourceDocuments.id, input.documentId));
    
    logEvent({
      event: 'document.text_extraction_started',
      context: {
        requestId: ctx.requestId,
        userId: ctx.userId,
        documentId: input.documentId,
        projectId: input.projectId,
      },
    });
    
    return { jobId };
  }),
```

## Frontend Integration

### Coordinate Conversion Utility (Frontend)

**Location:** `packages/core/src/bbox-conversion.ts`

```typescript
/**
 * Coordinate conversion between PyMuPDF and PDF.js viewport coordinates.
 * 
 * Mirrors the Python bbox_converter.py implementation.
 */

export type BBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PageDimensions = {
  width: number;
  height: number;
};

export const convertPyMuPdfToPdfJs = ({
  bbox,
  pageHeight,
  scale = 1.0,
  rotation = 0,
}: {
  bbox: BBox;
  pageHeight: number;
  scale?: number;
  rotation?: 0 | 90 | 180 | 270;
}): BBox => {
  const { x, y, width, height } = bbox;
  
  // Flip Y-axis (PyMuPDF: bottom-left, PDF.js: top-left)
  const yFlipped = pageHeight - y - height;
  
  // Apply rotation if needed
  let xRot: number, yRot: number, widthRot: number, heightRot: number;
  
  switch (rotation) {
    case 90:
      xRot = yFlipped;
      yRot = pageHeight - x - width;
      widthRot = height;
      heightRot = width;
      break;
    case 180:
      xRot = pageHeight - x - width;
      yRot = pageHeight - yFlipped - height;
      widthRot = width;
      heightRot = height;
      break;
    case 270:
      xRot = pageHeight - yFlipped - height;
      yRot = x;
      widthRot = height;
      heightRot = width;
      break;
    default: // 0
      xRot = x;
      yRot = yFlipped;
      widthRot = width;
      heightRot = height;
  }
  
  // Apply scale
  return {
    x: xRot * scale,
    y: yRot * scale,
    width: widthRot * scale,
    height: heightRot * scale,
  };
};

export const convertPdfJsToPyMuPdf = ({
  bbox,
  pageHeight,
  scale = 1.0,
  rotation = 0,
}: {
  bbox: BBox;
  pageHeight: number;
  scale?: number;
  rotation?: 0 | 90 | 180 | 270;
}): BBox => {
  // Remove scale first
  const x = bbox.x / scale;
  const y = bbox.y / scale;
  const width = bbox.width / scale;
  const height = bbox.height / scale;
  
  // Reverse rotation
  let xUnrot: number, yUnrot: number, widthUnrot: number, heightUnrot: number;
  
  switch (rotation) {
    case 90:
      xUnrot = pageHeight - y - height;
      yUnrot = x;
      widthUnrot = height;
      heightUnrot = width;
      break;
    case 180:
      xUnrot = pageHeight - x - width;
      yUnrot = pageHeight - y - height;
      widthUnrot = width;
      heightUnrot = height;
      break;
    case 270:
      xUnrot = y;
      yUnrot = pageHeight - x - width;
      widthUnrot = height;
      heightUnrot = width;
      break;
    default: // 0
      xUnrot = x;
      yUnrot = y;
      widthUnrot = width;
      heightUnrot = height;
  }
  
  // Flip Y-axis back
  const yPyMuPdf = pageHeight - yUnrot - heightUnrot;
  
  return {
    x: xUnrot,
    y: yPyMuPdf,
    width: widthUnrot,
    height: heightUnrot,
  };
};
```

**Usage Example (for Task 3 preview):**

```typescript
// When displaying suggestion occurrences on PDF viewer
const textAtoms = await trpc.document.getTextAtomsForTerm.query({
  documentId,
  term: "divine simplicity",
  pageNumber: 5,
});

// Get current viewport state
const viewport = pdfPage.getViewport({ scale: currentScale, rotation: 0 });

// Convert PyMuPDF bboxes to PDF.js viewport coordinates
const highlightBboxes = textAtoms.map(atom => 
  convertPyMuPdfToPdfJs({
    bbox: atom.bbox,
    pageHeight: viewport.height / currentScale, // Unscaled page height
    scale: currentScale,
    rotation: 0,
  })
);

// Render highlights using existing PdfHighlightLayer
renderHighlights({ bboxes: highlightBboxes, color: "yellow" });
```

### Project Settings - Text Extraction UI

**Location:** `apps/index-pdf-frontend/src/app/projects/[projectDir]/settings/`

**Component: TextExtractionPanel**

**UI Elements:**
```
┌─────────────────────────────────────────┐
│ Text Extraction                         │
│                                         │
│ Status: ✅ Completed                    │
│ Extracted: 200 pages                    │
│ Last extracted: 2 hours ago             │
│                                         │
│ Indexable words: 45,230                 │
│ Filtered words: 3,120 (headers/footers)│
│                                         │
│ [Re-extract Text]                       │
│                                         │
│ ⚠️ Note: Re-extraction will update      │
│ indexable text based on current ignore  │
│ contexts. Existing concept suggestions  │
│ may change.                             │
└─────────────────────────────────────────┘
```

**Progress UI (during extraction):**
```
┌─────────────────────────────────────────┐
│ Extracting text...                      │
│                                         │
│ Progress: ▓▓▓▓▓▓░░░░ 45/200 pages      │
│                                         │
│ Indexable words so far: 10,234          │
│ Estimated time remaining: 2 minutes     │
│                                         │
│ [Cancel]                                │
└─────────────────────────────────────────┘
```

### Frontend Hooks

```typescript
// useTextExtraction hook
const useTextExtraction = ({ projectId, documentId }: {
  projectId: string;
  documentId: string;
}) => {
  const extractText = trpc.document.extractText.useMutation();
  const { data: status } = trpc.document.getExtractionStatus.useQuery(
    { documentId },
    { refetchInterval: 2000 } // Poll every 2 seconds while in progress
  );
  
  const startExtraction = async () => {
    await extractText.mutateAsync({ projectId, documentId });
  };
  
  return {
    status,
    startExtraction,
    isExtracting: status?.status === 'in_progress',
    progress: status?.pagesProcessed ?? 0,
    total: status?.totalPages ?? 0,
  };
};
```

## Testing Requirements

### Backend Tests

- [ ] **Unit: PyMuPDF extraction**
  - Extracts correct text from sample PDF
  - Returns word-level bounding boxes
  - Handles multi-column layouts
  
- [ ] **Unit: Context filtering**
  - Filters text atoms within ignore bboxes
  - Preserves text atoms outside exclude regions
  - Handles overlapping exclude regions
  
- [ ] **Integration: Full extraction pipeline**
  - End-to-end extraction with exclude regions
  - Stores DocumentPage with both text versions
  - Stores TextAtoms with correct flags
  - Updates extraction status correctly

### Frontend Tests

- [ ] **Interaction: Extraction UI**
  - Button triggers extraction
  - Progress updates during extraction
  - Shows completion notification
  - Re-extraction shows warning

## Success Criteria

- [x] PyMuPDF extracts text at page level
- [x] Word-level bounding boxes stored as TextAtoms
- [x] Ignore contexts filter text correctly
- [x] Both raw and indexable text stored
- [x] User can trigger extraction manually
- [x] Progress indicator shows extraction status
- [x] Extraction completes in < 5min for 200-page book
- [x] Re-extraction updates indexable text only

## Next Task

[Task 2: LLM Integration & Concept Detection](./task-2-llm-integration.md) uses the extracted indexable text to generate candidate index entries via LLM.

## Notes

**Why PyMuPDF over PDF.js?**
- More reliable text extraction (especially for complex PDFs)
- Better handling of fonts and encoding
- Built-in word-level bbox support
- Industry standard for text extraction

**Why Store TextAtoms in MVP?**
- Minimal overhead (just storing what PyMuPDF gives us)
- Enables future robust anchoring (word-level precision)
- Useful for debugging exclude region filtering
- Not used for highlighting in MVP (we use user-drawn bboxes)

**Performance Considerations:**
- 200-page book ~= 45,000 words
- PyMuPDF extraction: ~0.5s per page = 100s total
- Database writes: ~2s for 200 pages of text
- Total: ~2-3 minutes for full book extraction
