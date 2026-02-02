# Task 4A: Sidebar Action Buttons

**Duration:** 1 day  
**Status:** ✅ Complete  
**Completed:** 2026-02-02

## Overview

Implement "Select Text" and "Draw Region" buttons in page sidebar sections. Each index type section (subject, author, scripture) has these buttons. Clicking a button activates text selection or region drawing for ONE mention, then auto-reverts to view mode.

## Requirements

### Page Sidebar Sections (Dynamic)

One section per index type configured for the project:

- [x] Subject section with "Select Text" and "Draw Region" buttons
- [x] Author section with "Select Text" and "Draw Region" buttons
- [x] Scripture section with "Select Text" and "Draw Region" buttons
- [x] (Additional sections if user has more index types)

### Button Behavior

**Select Text:**
- [x] Click button → Activates text selection (enable text layer pointer-events)
- [x] User selects text → Creates draft highlight
- [ ] Draft appears → Mention creation popover opens (Task 4B)
- [x] User completes or cancels → Auto-revert to view mode

**Draw Region:**
- [x] Click button → Activates region drawing (crosshair cursor)
- [x] User click-drags → Creates draft region highlight
- [ ] Draft appears → Mention creation popover opens (Task 4B)
- [x] User completes or cancels → Auto-revert to view mode

### Transient Activation (Not Persistent Modes)

**Key difference from old approach:**
- No "mode toggle" buttons that stay active
- Each button activates for ONE action only
- Automatically reverts after draft creation or cancellation

**Implementation:**
```tsx
const [activeAction, setActiveAction] = useState<{
  type: 'select-text' | 'draw-region' | null;
  indexType: string | null;
}>({ type: null, indexType: null });

const handleSelectTextClick = (indexType: string) => {
  setActiveAction({ type: 'select-text', indexType });
  // Enable text layer pointer-events
  // Listen for selection
};

const handleDraftCreated = () => {
  // Show popover
  // After user completes/cancels:
  setActiveAction({ type: null, indexType: null });
  // Revert to view mode
};
```

### Visual Feedback

**Button states:**
- [x] Default: Gray background
- [x] Active: Blue background (only during text selection or drawing)
- [x] Hover: Slight color change

**Cursor changes:**
- [x] Select Text active: Text cursor (I-beam)
- [x] Draw Region active: Crosshair cursor
- [x] View mode: Default cursor

**Status indicator (optional):**
- [ ] Small text below buttons: "Select text to create subject mention" (when active) - Deferred

## UI Mockup

```
┌─────────────────────────────────┐
│ Subject                         │
│                                 │
│ [Select Text] [Draw Region]    │ ← Buttons
│                                 │
│ Mentions on this page (3):      │
│ • "Kant, Immanuel" (p. 42)     │
│ • "Categorical imperative"      │
│ • "Pure reason"                 │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Author                          │
│                                 │
│ [Select Text] [Draw Region]    │
│                                 │
│ Mentions on this page (1):      │
│ • "Kant, Immanuel" (p. 42)     │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Scripture                       │
│                                 │
│ [Select Text] [Draw Region]    │
│                                 │
│ Mentions on this page (0)       │
└─────────────────────────────────┘
```

## Implementation

### Button Component

```tsx
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/page-sidebar/components/mention-action-buttons.tsx
type MentionActionButtonsProps = {
  indexType: string;
  activeAction: { type: string | null; indexType: string | null };
  onSelectText: (indexType: string) => void;
  onDrawRegion: (indexType: string) => void;
};

export const MentionActionButtons = ({ 
  indexType, 
  activeAction, 
  onSelectText, 
  onDrawRegion 
}: MentionActionButtonsProps) => {
  const isSelectTextActive = 
    activeAction.type === 'select-text' && activeAction.indexType === indexType;
  const isDrawRegionActive = 
    activeAction.type === 'draw-region' && activeAction.indexType === indexType;

  return (
    <div className="flex gap-2">
      <button
        onClick={() => onSelectText(indexType)}
        className={cn(
          "px-3 py-1 rounded",
          isSelectTextActive ? "bg-blue-500 text-white" : "bg-gray-200"
        )}
      >
        Select Text
      </button>
      <button
        onClick={() => onDrawRegion(indexType)}
        className={cn(
          "px-3 py-1 rounded",
          isDrawRegionActive ? "bg-blue-500 text-white" : "bg-gray-200"
        )}
      >
        Draw Region
      </button>
    </div>
  );
};
```

### Integration with PdfViewer

```tsx
// In editor.tsx
const [activeAction, setActiveAction] = useState<{
  type: 'select-text' | 'draw-region' | null;
  indexType: string | null;
}>({ type: null, indexType: null });

// Pass to PdfViewer
<PdfViewer
  // ... other props
  textLayerInteractive={activeAction.type === 'select-text'}
  regionDrawingActive={activeAction.type === 'draw-region'}
  onDraftCreated={(draft) => {
    setDraftMention({ ...draft, indexType: activeAction.indexType });
    setShowMentionPopover(true);
  }}
  onDraftCancelled={() => {
    setActiveAction({ type: null, indexType: null });
  }}
/>

// Pass to page sidebar sections
<PageSubjectContent
  mentions={subjectMentions}
  activeAction={activeAction}
  onSelectText={handleSelectText}
  onDrawRegion={handleDrawRegion}
/>
```

### Escape Key Handling

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Clear draft
      setDraftMention(null);
      // Cancel active action
      setActiveAction({ type: null, indexType: null });
      // Clear text selection
      window.getSelection()?.removeAllRanges();
    }
  };
  
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

## Testing

- [x] Click "Select Text" activates text selection
- [x] Text selection creates draft
- [ ] Draft shows mention popover (Task 4B)
- [x] Completing mention reverts to view mode
- [x] Cancelling reverts to view mode
- [x] Escape key cancels action
- [x] Click "Draw Region" activates drawing
- [x] Drawing creates draft
- [x] Multiple index types work independently
- [x] Only one action can be active at a time

## Success Criteria

- ✅ Each page sidebar section has action buttons
- ✅ Buttons activate for one action only (transient, not persistent)
- ✅ Auto-revert to view mode after completion/cancellation
- ✅ Visual feedback shows active state
- ✅ Escape key cancels action
- ✅ Works for all index types (dynamic sections)

## Completion Summary

### Implemented Features

1. **MentionActionButtons Component** (`apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/page-sidebar/components/mention-action-buttons.tsx`)
   - "Select Text" and "Draw Region" buttons with active state styling
   - Visual feedback (blue when active, gray when inactive)
   - Hover states with dark mode support

2. **Editor State Management** (`editor.tsx`)
   - `activeAction` state tracking current action type and index type
   - `handleSelectText` and `handleDrawRegion` callbacks
   - `handleDraftCancelled` to reset active action
   - Auto-revert behavior after draft creation/cancellation

3. **PdfViewer Props Refactoring** (`packages/yaboujee`)
   - Removed `annotationMode` enum in favor of boolean props
   - Added `textLayerInteractive?: boolean` prop
   - Added `regionDrawingActive?: boolean` prop
   - Renamed `onModeExit` to `onDraftCancelled`
   - Dynamic z-index layering to fix highlight clickability when text layer is present

4. **Page Sidebar Integration**
   - Updated `PageSubjectContent`, `PageAuthorContent`, `PageScriptureContent` to accept action props
   - Action buttons passed to all page-level index sections
   - Window manager updated to pass props to popped-out windows

5. **Tests & Documentation**
   - Added interaction test for clicking highlights overlaid by text layer
   - Updated all VRT tests to use new boolean props
   - Added VRT tests for text selection with programmatic selection
   - All tests passing with TypeScript type checking

### Technical Decisions

- **Transient activation** instead of persistent modes - each button activates for one action only
- **Z-index strategy** for layer management:
  - Highlights: `z-index: 10`
  - Text layer (interactive): `z-index: 20`
  - Text layer (non-interactive): `z-index: 5`
  - Region preview: `z-index: 30`
- **Boolean props** over enum for better composability and clarity
- **Per-index-type activation** - each section tracks its own active state

### Deferred Items

- Mention creation popover (Task 4B)
- Status indicator text below buttons (optional UX enhancement)

## Next Task

[Task 4B: Mention Creation Flow](./task-4b-mention-creation.md)
