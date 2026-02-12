# Component Architecture

## Index Type System

Users can subscribe to multiple index types. Default is "subject", but users can add custom types (author, scripture, geography, chemical, etc.).

**User Model:**
- `subscribed_index_types: ['subject', 'author', 'scripture']`

**Project Configuration:**
- Each project defines active index types
- Each type has: name, color, ordinal (for defaults), visibility toggle
- Colors configurable in project sidebar sections

**Index Types:**
- Subject (default for all users)
- Author (subscription required)
- Scripture (subscription required)
- Custom types (user-defined)

## Multi-Type Mentions

An IndexMention can belong to multiple index types simultaneously.

**Example:**
- User highlights "Kant, Immanuel"
- "Index As" checklist: ☑ Subject, ☑ Author
- Mention appears in both subject and author indices

**Visual Representation:**
- Single-type: Solid color (e.g., yellow for subject)
- Multi-type: Diagonal stripes (e.g., yellow + green for subject + author)

**UI Pattern:**
- Click highlight → "Index As" button → Checklist of available index types
- Page sidebar shows mention in all relevant sections (subject AND author)

## Highlight Types

### 1. Index Mentions (text or region)
- Created via "Select Text" or "Draw Region" in page sidebar sections
- Linked to IndexEntry of matching type
- Can belong to multiple index types
- User-configurable color per index type
- Visibility toggled per type in project sidebar

### 2. Contexts (region only)

#### Exclude Region
- Marks regions to exclude from text extraction
- If text atom bbox is 100% within exclude region bbox → ignore it
- Use case: Headers, footers, captions, page numbers (if not indexing them)

#### Page Number Region
- Marks region containing page number
- Auto-extracts text to establish canonical page number
- Use case: Roman numerals in preface, alternating corners, custom pagination

**Region Properties:**
- Type: 'exclude' | 'page-number'
- Page config: 'this-page' | 'all-pages' | 'range' | 'custom' | 'every-other'
- Color (per region)
- Visibility toggle
- Managed at project level, created from page or project sidebar

## Page Numbering System

**Four Layers (in precedence order):**

1. **Document page number** (always present)
   - Sequential: 1, 2, 3... (PDF page order)

2. **Region-derived page number** (from page number regions)
   - Extracted from context bbox
   - Example: "i, ii, iii, iv, 1, 2, 3..."
   - Pages in brackets [1-3] are non-indexable

3. **Project-level override** (editable in project sidebar)
   - User can override entire page number sequence
   - Example: "[1-3] i-xxxii, 1-130, a-m"
   - Validated for correctness and count

4. **Page-level override** (editable in page sidebar)
   - Single-page manual override
   - Displayed with distinct styling in final string
   - Example: "i-xxxii, 1-100, *i-v*, 106-130"

**Final (Canonical) Page Numbers:**
- Computed from layers above
- Used for indexing mentions
- Displayed in index export with proper formatting

## Sidebar Architecture

### Page Sidebar (current page context)

Sections by index type (dynamic based on user subscriptions):
- **Subject** (`page-subject-content`) - Subject mentions on this page
- **Author** (`page-author-content`) - Author mentions on this page
- **Scripture** (`page-scripture-content`) - Scripture mentions on this page
- **Regions** (`page-regions-content`) - Regions that apply to this page
- **Page Info** (`page-info-content`) - Page numbering display/override

**Actions:**
- Select Text / Draw Region (per index type section)
- Create context (in contexts section)
- Remove this page from context
- Override page number (in page info section)

### Project Sidebar (project-wide settings)

Sections by index type:
- **Subject** (`project-subject-content`) - Subject index config (color, visibility)
- **Author** (`project-author-content`) - Author index config
- **Scripture** (`project-scripture-content`) - Scripture index config
- **Regions** (`project-regions-content`) - All contexts (create, edit, delete)
- **Pages** (`project-pages-content`) - Page numbering display/override (project-level)

**Contexts Management:**
- View all regions
- Edit region (page config, color, visibility)
- Delete context
- Apply to pages configuration

**Page Numbering Display:**
```
Document pages: 1-200
Region-derived: [1-3] i-xxxii, 1-140
Project overrides: [1-3] i-xxxii, 1-130, a-m
Final: [1-3] i-xxxii, 1-100, *i-v*, 106-130, a-m
```
- Brackets [1-3] = non-indexable
- Asterisks *i-v* = page-level overrides
- Different color-coding per layer

## PDF Viewer Stack

**Location:** `packages/yaboujee`

**Components:**
- `PdfViewer` - PDF.js renderer + interaction surface
- `PdfHighlightLayer` - Overlay for mentions and contexts
- `PdfHighlightBox` - Individual highlight (supports multi-color stripes)

**Types:** `packages/yaboujee/src/types/pdf-highlight.ts`

## Text Selection & Region Drawing

**Activation:** Triggered from page sidebar action buttons (per index type section)

**Select Text:**
- Click "Select Text" in sidebar section → enable text layer pointer-events
- User selects text → create draft highlight
- Draft complete/cancelled → auto-revert to view mode

**Draw Region:**
- Click "Draw Region" in sidebar section → enable drawing mode
- User click-drags rectangle → create draft region highlight
- Draft complete/cancelled → auto-revert to view mode

**View Mode** (default):
- Highlight clicks enabled (show details popover)
- Text selection disabled
- Region drawing disabled

## Coordinate Systems

**Backend (PyMuPDF):** Bottom-left origin, PDF user space, points  
**Frontend (PDF.js):** Top-left origin, DOM viewport, pixels

**Conversions:**
- `convertBboxToViewport` (PDF → DOM)
- `convertDomRectToPdf` (DOM → PDF)
- `convertSelectionToPdfBbox` (multi-rect → single bbox)

**Storage:** Store highlights in PDF user space (DB-friendly), convert to DOM only at render.

## Index Export

**Location:** `/projects/[projectDir]/index` page

**Tabs per index type:**
- Subject Index
- Author Index  
- Scripture Index
- (Others based on user subscriptions)

**MVP Export:**
- HTML display
- Copy/paste functionality
- Preserves formatting (indentation, hierarchy)

**Post-MVP:**
- Rich text WYSIWYG editor
- Word/LaTeX export
- Multiple formats

## Default Colors

**Ordinal-based** (not type-based, since types are user-configurable):
- 1st index type: Yellow (#FCD34D)
- 2nd index type: Green (#86EFAC)
- 3rd index type: Blue (#93C5FD)
- 4th index type: Purple (#C4B5FD)
- 5th index type: Pink (#F9A8D4)

**Region defaults:**
- Ignore context: Red (#FCA5A5)
- Page number context: Purple (#C4B5FD)

User can customize all colors in project sidebar.

## MVP Assumptions

- Single bbox per mention (multi-bbox for line wrapping is post-MVP)
- Page rotation = 0
- Rectangular highlights only
- Manual context drawing (auto-detection post-MVP)
- HTML export only (Word/LaTeX post-MVP)