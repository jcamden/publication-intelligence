# Task 3: Suggestion Management UI

**Status:** ⚪ Not Started  
**Dependencies:** Task 2 (LLM Integration)  
**Duration:** 3-4 days

## Overview

Build two-column interface for reviewing AI-generated concept suggestions, accepting them as index entries, and establishing parent-child relationships. This is where users refine the AI's draft into their final index.

## Requirements

### 1. Two-Column Layout

**Left Column: Suggestions** (pending review)
- List of AI-generated suggestions awaiting approval
- Grouped by index type (tabs or sections)
- Shows confidence score, page count, preview
- Multi-select support

**Right Column: Entries** (accepted)
- List of accepted index entries (same as main index tree view)
- Hierarchical tree structure
- Shows mention count, page numbers
- Drag-and-drop for hierarchy

**Between Columns: Action Buttons**
- `→` Arrow Right: Accept suggestion → create entry
- `←` Arrow Left: Demote entry → back to suggestion
- `🔗` Make Child: Link suggestion as child of selected entry

### 2. UI Mockup

```
┌──────────────────────────────────────────────────────────────┐
│ Concept Detection: Subject Index                  [Settings] │
├─────────────────────────────┬──────┬──────────────────────────┤
│                             │      │                          │
│ SUGGESTIONS (156 pending)   │      │ ENTRIES (89 accepted)    │
│                             │      │                          │
│ ┌─────────────────────────┐ │      │ ┌──────────────────────┐ │
│ │ ☐ Divine Simplicity     │ │      │ │ ▼ Christology        │ │
│ │   Overall: 89%          │ │      │ │   ▸ Incarnation      │ │
│ │   I: 90 / S: 85 / R: 92 │ │      │ │   ▸ Hypostatic Union │ │
│ │   Pages: 5, 12, 18 (+3) │ │      │ │                      │ │
│ └─────────────────────────┘ │      │ │ ▼ Soteriology        │ │
│                             │      │ │   ▸ Atonement        │ │
│ ┌─────────────────────────┐ │      │ │   ▸ Justification    │ │
│ │ ☐ Modal Realism         │ │      │ │   ▸ Sanctification   │ │
│ │   Overall: 80%          │ │      │ │                      │ │
│ │   I: 85 / S: 90 / R: 65 │ │      │ │ ▼ Trinity            │ │
│ │   Pages: 23, 45, 67     │ │      │ │   ▸ Persons          │ │
│ └─────────────────────────┘ │      │ │   ▸ Relations        │ │
│                             │  →   │ └──────────────────────┘ │
│ ┌─────────────────────────┐ │  ←   │                          │
│ │ ☑ Free Will             │ │  🔗  │ [Expand All] [Sort ▼]   │
│ │   Overall: 92%          │ │      │                          │
│ │   I: 95 / S: 88 / R: 93 │ │      │ [+ Create Entry]         │
│ │   Pages: 8, 14, 22 (+7) │ │      │                          │
│ └─────────────────────────┘ │      │ Search: [_____________]  │
│                             │      │                          │
│ [Select All] [Batch Accept]│      │                          │
│                             │      │                          │
│ Filters: [▼ Filters]        │      │                          │
│ Sort: [Overall ▼]           │      │                          │
└─────────────────────────────┴──────┴──────────────────────────┘
```

**Legend:**
- **Overall**: Average of three scores (shown as percentage)
- **I**: Indexability (would a reader look this up?)
- **S**: Specificity (concrete vs. generic?)
- **R**: Relevance (central to the text?)

### 3. Suggestion List Component

**Per Suggestion Card:**

```typescript
type SuggestionCardProps = {
  suggestion: IndexEntrySuggestion;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onMakeChild: (suggestionId: string, parentEntryId: string) => void;
};

const SuggestionCard = ({
  suggestion,
  isSelected,
  onSelect,
  onAccept,
  onReject,
}: SuggestionCardProps) => {
  return (
    <div className="suggestion-card">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onSelect(suggestion.id)}
      />
      
      <div className="suggestion-content">
        <h3>{suggestion.term}</h3>
        
        <div className="suggestion-metadata">
          <div className="confidence-scores">
            <div className="confidence-overall">
              <ConfidenceBar value={suggestion.overallConfidence} />
              <span className="confidence-value">
                {(suggestion.overallConfidence * 100).toFixed(0)}%
              </span>
            </div>
            
            <div className="confidence-breakdown" title="Indexability / Specificity / Relevance">
              <span className="score-label">I:</span>
              <span className="score-value">{(suggestion.indexability * 100).toFixed(0)}</span>
              <span className="score-separator">/</span>
              <span className="score-label">S:</span>
              <span className="score-value">{(suggestion.specificity * 100).toFixed(0)}</span>
              <span className="score-separator">/</span>
              <span className="score-label">R:</span>
              <span className="score-value">{(suggestion.relevance * 100).toFixed(0)}</span>
            </div>
          </div>
        </div>
        
        <div className="suggestion-pages">
          <PageNumbers 
            pages={suggestion.pageNumbers.slice(0, 3)} 
            totalCount={suggestion.pageNumbers.length}
          />
        </div>
        
        <div className="suggestion-actions">
          <button onClick={() => onAccept(suggestion.id)}>
            Accept
          </button>
          <button onClick={() => onReject(suggestion.id)}>
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};
```

**Features:**
- Checkbox for multi-select
- Confidence bar (visual + percentage)
- Page numbers (show first 3, "+ N more")
- Quick actions: Accept, Reject
- Click term to preview in PDF

### 4. Action Buttons (Between Columns)

**Accept (Arrow Right) Button:**
```typescript
const AcceptButton = ({
  selectedSuggestions,
  onAccept,
}: {
  selectedSuggestions: string[];
  onAccept: (suggestionIds: string[]) => void;
}) => {
  return (
    <button
      onClick={() => onAccept(selectedSuggestions)}
      disabled={selectedSuggestions.length === 0}
      className="action-button accept-button"
      title="Accept selected suggestions as entries"
    >
      <ArrowRight size={24} />
      <span className="button-label">Accept</span>
    </button>
  );
};
```

**Behavior:**
- Accepts selected suggestion(s)
- Creates new IndexEntry for each
- Moves to Entries column (right)
- Removes from Suggestions column (left)
- Updates suggestion status to "accepted"
- Optimistic update for smooth UX

**Demote (Arrow Left) Button:**
```typescript
const DemoteButton = ({
  selectedEntries,
  onDemote,
}: {
  selectedEntries: string[];
  onDemote: (entryIds: string[]) => void;
}) => {
  return (
    <button
      onClick={() => onDemote(selectedEntries)}
      disabled={selectedEntries.length === 0}
      className="action-button demote-button"
      title="Move entries back to suggestions"
    >
      <ArrowLeft size={24} />
      <span className="button-label">Demote</span>
    </button>
  );
};
```

**Behavior:**
- Moves entry back to suggestions
- **Warning if entry has mentions:**
  ```
  ⚠️ This entry has 5 linked mentions.
  
  Moving it back to suggestions will unlink these mentions.
  They will remain as highlights, but won't be connected to any entry.
  
  [Cancel] [Demote Anyway]
  ```
- Creates new suggestion from entry
- Soft deletes original entry
- Updates suggestion status to "pending"

**Make Child Button:**
```typescript
const MakeChildButton = ({
  selectedSuggestion,
  selectedEntry,
  onMakeChild,
}: {
  selectedSuggestion: string | null;
  selectedEntry: string | null;
  onMakeChild: (suggestionId: string, parentId: string) => void;
}) => {
  const isDisabled = !selectedSuggestion || !selectedEntry;
  
  return (
    <button
      onClick={() => onMakeChild(selectedSuggestion!, selectedEntry!)}
      disabled={isDisabled}
      className="action-button make-child-button"
      title="Accept suggestion as child of selected entry"
    >
      <TextQuote size={24} /> {/* Lucide icon */}
      <span className="button-label">Make Child</span>
    </button>
  );
};
```

**Behavior:**
- Requires: 1 suggestion selected (left) + 1 entry selected (right)
- Creates new entry from suggestion
- Sets `parentId` to selected entry
- Appears as child in tree view
- Removes from suggestions

### 5. Filtering & Sorting

**Suggestion Filters:**
```typescript
type SuggestionFilters = {
  indexType?: IndexType;           // Filter by index type
  
  // Three-dimensional confidence filters
  minOverallConfidence?: number;   // Overall average (default: 0.6)
  minIndexability?: number;        // Indexability threshold (default: 0.6)
  minSpecificity?: number;         // Specificity threshold (default: 0.6)
  minRelevance?: number;           // Relevance threshold (default: 0.5)
  
  status?: SuggestionStatus;       // pending, accepted, rejected
  hasPages?: number[];             // Filter by specific pages
  searchQuery?: string;            // Text search in term
};

const SuggestionFiltersPanel = ({
  filters,
  onChange,
}: {
  filters: SuggestionFilters;
  onChange: (filters: SuggestionFilters) => void;
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  return (
    <div className="filters-panel">
      {/* Quick Filters */}
      <div className="quick-filters">
        <select
          value={filters.status ?? 'pending'}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
        >
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
        
        <input
          type="text"
          placeholder="Search suggestions..."
          value={filters.searchQuery ?? ''}
          onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
        />
      </div>
      
      {/* Overall Confidence Filter */}
      <div className="confidence-filter">
        <label>Overall Confidence: {filters.minOverallConfidence ?? 0.6}</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={filters.minOverallConfidence ?? 0.6}
          onChange={(e) => onChange({ ...filters, minOverallConfidence: +e.target.value })}
        />
        <span className="range-labels">
          <span>0%</span>
          <span>100%</span>
        </span>
      </div>
      
      {/* Advanced Filters (Collapsible) */}
      <button
        className="toggle-advanced"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? '▼' : '▶'} Advanced Filters
      </button>
      
      {showAdvanced && (
        <div className="advanced-filters">
          <div className="dimension-filter">
            <label>Indexability: {filters.minIndexability ?? 0.6}</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={filters.minIndexability ?? 0.6}
              onChange={(e) => onChange({ ...filters, minIndexability: +e.target.value })}
            />
            <span className="filter-description">
              Would a reader look this up?
            </span>
          </div>
          
          <div className="dimension-filter">
            <label>Specificity: {filters.minSpecificity ?? 0.6}</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={filters.minSpecificity ?? 0.6}
              onChange={(e) => onChange({ ...filters, minSpecificity: +e.target.value })}
            />
            <span className="filter-description">
              Concrete vs. generic?
            </span>
          </div>
          
          <div className="dimension-filter">
            <label>Relevance: {filters.minRelevance ?? 0.5}</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={filters.minRelevance ?? 0.5}
              onChange={(e) => onChange({ ...filters, minRelevance: +e.target.value })}
            />
            <span className="filter-description">
              Central to the text?
            </span>
          </div>
          
          <button
            className="reset-filters"
            onClick={() => onChange({
              ...filters,
              minOverallConfidence: 0.6,
              minIndexability: 0.6,
              minSpecificity: 0.6,
              minRelevance: 0.5,
            })}
          >
            Reset to Defaults
          </button>
        </div>
      )}
    </div>
  );
};
```

**Sorting Options:**
- Overall Confidence (high to low) - Default
- Overall Confidence (low to high)
- Indexability (high to low)
- Specificity (high to low)
- Relevance (high to low)
- Alphabetical (A-Z)
- Alphabetical (Z-A)
- Page count (most to least)
- Recently added

### 6. Batch Operations

**Batch Accept:**
```typescript
const batchAcceptSuggestions = async ({
  suggestionIds,
  projectId,
  projectIndexTypeId,
}: {
  suggestionIds: string[];
  projectId: string;
  projectIndexTypeId: string;
}) => {
  // Create entries in parallel (with batching for large sets)
  const BATCH_SIZE = 10;
  const batches = chunk(suggestionIds, BATCH_SIZE);
  
  for (const batch of batches) {
    await Promise.all(
      batch.map(suggestionId =>
        createEntryFromSuggestion({
          suggestionId,
          projectId,
          projectIndexTypeId,
        })
      )
    );
  }
  
  // Update suggestion statuses
  await updateSuggestionStatus({
    suggestionIds,
    status: 'accepted',
  });
};
```

**Batch Reject:**
```typescript
const batchRejectSuggestions = async ({
  suggestionIds,
}: {
  suggestionIds: string[];
}) => {
  await updateSuggestionStatus({
    suggestionIds,
    status: 'rejected',
  });
};
```

**UI Controls:**
```
[Select All] [Deselect All]
[Accept Selected (23)] [Reject Selected (23)]
```

### 7. Preview & Context

**Click Suggestion → Show Context:**

When user clicks a suggestion term, show:
1. PDF viewer jumps to first occurrence page
2. Highlight all occurrences on that page using TextAtoms (yellow flash)
3. Show context excerpt in sidebar

**Implementation: Highlighting from TextAtoms**

Since we stored PyMuPDF bboxes during text extraction, we can now display them on the PDF.js viewer:

```typescript
const highlightSuggestionOccurrences = async ({
  suggestion,
  pageNumber,
  currentScale,
}: {
  suggestion: IndexEntrySuggestion;
  pageNumber: number;
  currentScale: number;
}) => {
  // 1. Fetch TextAtoms for this term on this page
  const textAtoms = await trpc.document.getTextAtomsForTerm.query({
    documentId: suggestion.documentId,
    term: suggestion.term,
    pageNumber,
  });
  
  // 2. Get page dimensions (from PDF.js page)
  const pdfPage = await pdfDocument.getPage(pageNumber);
  const viewport = pdfPage.getViewport({ scale: 1.0 });
  const pageHeight = viewport.height;
  
  // 3. Convert PyMuPDF bboxes to PDF.js viewport coordinates
  const highlightBboxes = textAtoms.map(atom => 
    convertPyMuPdfToPdfJs({
      bbox: atom.bbox,
      pageHeight,
      scale: currentScale,
      rotation: 0, // Add rotation support if needed
    })
  );
  
  // 4. Render highlights using existing PdfHighlightLayer
  renderTemporaryHighlights({
    bboxes: highlightBboxes,
    color: "rgba(255, 255, 0, 0.3)", // Yellow, semi-transparent
    duration: 2000, // Flash for 2 seconds
  });
};
```

**Why This Works:**
- TextAtoms stored during extraction (Task 1) have PyMuPDF coordinates
- Conversion utility (from Task 1) transforms to PDF.js viewport space
- Existing `PdfHighlightLayer` renders the highlights
- No need to re-parse text or guess positions

**Alternative Approach (If TextAtoms Not Available):**

If we haven't extracted TextAtoms yet, fall back to text search:

```typescript
// Fallback: search for term in PDF.js text content
const textContent = await pdfPage.getTextContent();
const matches = findTextMatches(textContent, suggestion.term);
// Use PDF.js-native bboxes (already in correct coordinate space)
```

But TextAtoms approach is preferred (more precise, consistent with extraction).

**Context Display:**

```
┌─────────────────────────────────────────┐
│ "Divine Simplicity"                     │
│                                         │
│ Confidence: 85%                         │
│ Occurrences: 6 times                    │
│                                         │
│ Context from page 5:                    │
│ "...the doctrine of divine simplicity   │
│ argues that God is not composed of      │
│ parts but is utterly simple..."         │
│                                         │
│ Also appears on:                        │
│ • Page 12: "...divine simplicity and..." │
│ • Page 18: "...critics of divine..."    │
│                                         │
│ [Accept] [Reject] [Show All Occurrences]│
└─────────────────────────────────────────┘
```

**Benefits:**
- User sees context before accepting
- Verifies AI didn't misidentify term
- Can spot generic vs. substantive uses

### 8. tRPC Endpoints

**Router: `suggestion`**

```typescript
suggestion: {
  list: // Get suggestions for project + index type
  accept: // Accept suggestion → create entry
  acceptBatch: // Accept multiple suggestions
  reject: // Mark suggestion as rejected
  rejectBatch: // Reject multiple suggestions
  acceptAsChild: // Accept suggestion as child of entry
  demoteEntry: // Convert entry back to suggestion
  updateConfidenceThreshold: // Filter by confidence
  getContextExcerpts: // Get text excerpts for suggestion
  getTextAtomsForPreview: // Get TextAtoms for highlighting (NEW)
}
```

**Router: `document` (extend existing)**

```typescript
document: {
  // ... existing endpoints ...
  getTextAtomsForTerm: // Get TextAtoms matching a term for preview
}
```

**Key Endpoint: `getTextAtomsForTerm`**

```typescript
getTextAtomsForTerm: protectedProcedure
  .input(z.object({
    documentId: z.string().uuid(),
    term: z.string(),
    pageNumber: z.number(),
  }))
  .query(async ({ input, ctx }) => {
    // 1. Get DocumentPage
    const page = await ctx.db.query.documentPages.findFirst({
      where: and(
        eq(documentPages.documentId, input.documentId),
        eq(documentPages.pageNumber, input.pageNumber)
      ),
    });
    
    if (!page) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
    
    // 2. Query TextAtoms matching the term
    const textAtoms = await ctx.db.query.textAtoms.findMany({
      where: and(
        eq(textAtoms.pageId, page.id),
        ilike(textAtoms.word, input.term) // Case-insensitive match
      ),
      orderBy: asc(textAtoms.sequence),
    });
    
    // 3. Return with page dimensions for conversion
    return {
      textAtoms,
      pageDimensions: page.dimensions, // { width, height } in PDF points
    };
  }),
```

**Key Endpoint: `accept`**

```typescript
accept: protectedProcedure
  .input(z.object({
    suggestionId: z.string().uuid(),
    parentEntryId: z.string().uuid().optional(), // For parent-child relationships
  }))
  .mutation(async ({ input, ctx }) => {
    // 1. Fetch suggestion
    const suggestion = await ctx.db.query.indexEntrySuggestions.findFirst({
      where: eq(indexEntrySuggestions.id, input.suggestionId),
    });
    
    if (!suggestion) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
    
    // 2. Create index entry from suggestion
    const entry = await ctx.db.insert(indexEntries).values({
      projectId: suggestion.projectId,
      projectIndexTypeId: suggestion.projectIndexTypeId,
      slug: slugify(suggestion.term),
      label: suggestion.term,
      parentId: input.parentEntryId,
      status: 'active',
    }).returning();
    
    // 3. Update suggestion status
    await ctx.db.update(indexEntrySuggestions)
      .set({
        status: 'accepted',
        acceptedAsEntryId: entry.id,
        reviewedAt: new Date(),
      })
      .where(eq(indexEntrySuggestions.id, input.suggestionId));
    
    // 4. Log event
    logEvent({
      event: 'suggestion.accepted',
      context: {
        requestId: ctx.requestId,
        userId: ctx.userId,
        suggestionId: input.suggestionId,
        entryId: entry.id,
        metadata: {
          term: suggestion.term,
          confidence: suggestion.confidence,
          parentEntryId: input.parentEntryId,
        },
      },
    });
    
    return { entry };
  }),
```

**Key Endpoint: `demoteEntry`**

```typescript
demoteEntry: protectedProcedure
  .input(z.object({
    entryId: z.string().uuid(),
  }))
  .mutation(async ({ input, ctx }) => {
    // 1. Fetch entry
    const entry = await ctx.db.query.indexEntries.findFirst({
      where: eq(indexEntries.id, input.entryId),
      with: {
        mentions: true, // Check if entry has mentions
      },
    });
    
    if (!entry) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
    
    // 2. Check for mentions (warn user in frontend before calling this)
    if (entry.mentions.length > 0) {
      // Unlink mentions (set entryId to null)
      await ctx.db.update(indexMentions)
        .set({ entryId: null })
        .where(eq(indexMentions.entryId, input.entryId));
    }
    
    // 3. Find original suggestion (if exists)
    const originalSuggestion = await ctx.db.query.indexEntrySuggestions.findFirst({
      where: eq(indexEntrySuggestions.acceptedAsEntryId, input.entryId),
    });
    
    if (originalSuggestion) {
      // Reset original suggestion to pending
      await ctx.db.update(indexEntrySuggestions)
        .set({
          status: 'pending',
          acceptedAsEntryId: null,
          reviewedAt: null,
        })
        .where(eq(indexEntrySuggestions.id, originalSuggestion.id));
      
      return { suggestion: originalSuggestion };
    } else {
      // Create new suggestion from entry
      const suggestion = await ctx.db.insert(indexEntrySuggestions).values({
        projectId: entry.projectId,
        projectIndexTypeId: entry.projectIndexTypeId,
        term: entry.label,
        confidence: 0.5, // Default confidence for manually demoted entries
        occurrences: 0, // Unknown for manually created entries
        pageNumbers: [],
        status: 'pending',
        detectionJobId: null, // Not from LLM
      }).returning();
      
      // Soft delete entry
      await ctx.db.update(indexEntries)
        .set({ deletedAt: new Date() })
        .where(eq(indexEntries.id, input.entryId));
      
      return { suggestion };
    }
  }),
```

## Frontend State Management

**Jotai Atoms:**

```typescript
// Selected suggestions (for batch operations)
export const selectedSuggestionsAtom = atom<string[]>([]);

// Selected entries (for parent-child linking)
export const selectedEntriesAtom = atom<string[]>([]);

// Current filters
export const suggestionFiltersAtom = atom<SuggestionFilters>({
  status: 'pending',
  minConfidence: 0.6,
  searchQuery: '',
});

// Current sort
export const suggestionSortAtom = atom<SuggestionSort>({
  field: 'confidence',
  direction: 'desc',
});

// Filtered and sorted suggestions (derived atom)
export const filteredSuggestionsAtom = atom((get) => {
  const suggestions = get(suggestionsAtom);
  const filters = get(suggestionFiltersAtom);
  const sort = get(suggestionSortAtom);
  
  return suggestions
    .filter(s => matchesFilters(s, filters))
    .sort((a, b) => compareBySort(a, b, sort));
});
```

## Testing Requirements

### Frontend Tests

**Interaction Tests:**

- [ ] **Suggestion list renders**
  - Shows confidence scores
  - Shows page numbers
  - Multi-select checkboxes work

- [ ] **Accept suggestion**
  - Click Accept button
  - Suggestion moves to entries
  - Entry appears in tree
  - Optimistic update works

- [ ] **Batch accept**
  - Select multiple suggestions
  - Click Batch Accept
  - All move to entries

- [ ] **Make child relationship**
  - Select 1 suggestion + 1 entry
  - Click Make Child button
  - Entry appears as child in tree

- [ ] **Demote entry (with mentions)**
  - Click Demote on entry with mentions
  - Warning modal appears
  - Confirm demotion
  - Entry moves back to suggestions
  - Mentions unlinked

- [ ] **Filtering**
  - Filter by confidence threshold
  - Filter by search query
  - Counts update correctly

- [ ] **Sorting**
  - Sort by confidence
  - Sort alphabetically
  - Sort by page count

**Visual Regression Tests:**

- [ ] Suggestion card (normal state)
- [ ] Suggestion card (selected)
- [ ] Suggestion card (low confidence)
- [ ] Action buttons (enabled/disabled)
- [ ] Empty states (no suggestions, no entries)

### Backend Tests

- [ ] **Accept suggestion**
  - Creates entry correctly
  - Updates suggestion status
  - Links suggestion to entry

- [ ] **Batch accept**
  - Creates multiple entries
  - Updates all statuses
  - Handles errors gracefully

- [ ] **Demote entry**
  - Creates/restores suggestion
  - Unlinks mentions
  - Soft deletes entry

- [ ] **Make child relationship**
  - Creates entry with parentId
  - Validates parent exists
  - Prevents circular references

## Success Criteria

- [x] Two-column layout displays suggestions and entries
- [x] Arrow buttons accept/demote between columns
- [x] Make Child button establishes parent-child relationships
- [x] Multi-select batch operations work
- [x] Filtering by confidence threshold works
- [x] Sorting by confidence, alpha, page count works
- [x] Preview shows context in PDF
- [x] Optimistic updates smooth UX
- [x] Warning shown before demoting entry with mentions
- [x] Keyboard shortcuts supported (Enter to accept, Del to reject)

## Next Task

[Task 4: Post-Processing & Refinement](./task-4-post-processing.md) (optional) handles deduplication, merging similar concepts, and hierarchy inference.

## Notes

**Keyboard Shortcuts:**
- `Enter`: Accept selected suggestion(s)
- `Delete`/`Backspace`: Reject selected suggestion(s)
- `Ctrl+A`: Select all suggestions
- `Ctrl+Shift+A`: Deselect all
- `Arrow Up/Down`: Navigate suggestions
- `Space`: Toggle selection

**Drag-and-Drop (Future Enhancement):**
- Drag suggestion onto entry → make child
- Drag suggestion to right column → accept
- Drag entry to left column → demote

**Empty States:**
- No suggestions: "No suggestions to review. Run concept detection to generate suggestions."
- No entries: "No entries yet. Accept suggestions to build your index."
- All reviewed: "All suggestions reviewed! ✅"

**Performance:**
- Virtual scrolling for large suggestion lists (1000+ items)
- Debounced search input (300ms)
- Optimistic updates prevent lag
