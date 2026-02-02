# Task 4A: Sidebar Action Buttons

**Duration:** 1 day  
**Status:** ⚪ Not Started

## Overview

Implement "Select Text" and "Draw Region" buttons in page sidebar sections. Each index type section (subject, author, scripture) has these buttons. Clicking a button activates text selection or region drawing for ONE mention, then auto-reverts to view mode.

## Requirements

### Page Sidebar Sections (Dynamic)

One section per index type configured for the project:

- [ ] Subject section with "Select Text" and "Draw Region" buttons
- [ ] Author section with "Select Text" and "Draw Region" buttons
- [ ] Scripture section with "Select Text" and "Draw Region" buttons
- [ ] (Additional sections if user has more index types)

### Button Behavior

**Select Text:**
- [ ] Click button → Activates text selection (enable text layer pointer-events)
- [ ] User selects text → Creates draft highlight
- [ ] Draft appears → Mention creation popover opens
- [ ] User completes or cancels → Auto-revert to view mode

**Draw Region:**
- [ ] Click button → Activates region drawing (crosshair cursor)
- [ ] User click-drags → Creates draft region highlight
- [ ] Draft appears → Mention creation popover opens
- [ ] User completes or cancels → Auto-revert to view mode

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
- [ ] Default: Gray background
- [ ] Active: Blue background (only during text selection or drawing)
- [ ] Hover: Slight color change

**Cursor changes:**
- [ ] Select Text active: Text cursor (I-beam)
- [ ] Draw Region active: Crosshair cursor
- [ ] View mode: Default cursor

**Status indicator (optional):**
- Small text below buttons: "Select text to create subject mention" (when active)

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

- [ ] Click "Select Text" activates text selection
- [ ] Text selection creates draft
- [ ] Draft shows mention popover
- [ ] Completing mention reverts to view mode
- [ ] Cancelling reverts to view mode
- [ ] Escape key cancels action
- [ ] Click "Draw Region" activates drawing
- [ ] Drawing creates draft
- [ ] Multiple index types work independently
- [ ] Only one action can be active at a time

## Success Criteria

- ✅ Each page sidebar section has action buttons
- ✅ Buttons activate for one action only (transient, not persistent)
- ✅ Auto-revert to view mode after completion/cancellation
- ✅ Visual feedback shows active state
- ✅ Escape key cancels action
- ✅ Works for all index types (dynamic sections)

## Next Task

[Task 4B: Mention Creation Flow](./task-4b-mention-creation.md)
