# Task 4C.5: Multi-Type Management Enhancement

**Duration:** 1 day  
**Status:** ✅ Complete  
**Dependencies:** Task 4C completion  
**Note:** This is an enhancement to be done after core Task 4C CRUD operations

## Overview

Add UI for managing which index types a mention belongs to, and implement visual distinction (diagonal stripes) for mentions that belong to multiple index types.

## Completed in Task 4C

- ✅ `Mention` type includes `indexTypes: string[]`
- ✅ Index type captured when creating mention (from sidebar section)
- ✅ Sidebar sections filter mentions by their index type
- ✅ Details popover displays current index types

## Implementation

### 1. "Index As" Multiselect in Details Popover

**Implemented:** Multiselect dropdown using `@pubint/yabasic` Select component

```tsx
// In MentionDetailsPopover
<Select
  multiple
  value={localIndexTypes}
  onValueChange={handleIndexTypesChange}
  items={AVAILABLE_INDEX_TYPES}
>
  <SelectTrigger size="sm" className="w-full" data-testid="index-types-select">
    <SelectValue placeholder="Select index type(s)" />
  </SelectTrigger>
  <SelectContent>
    {AVAILABLE_INDEX_TYPES.map((indexType) => (
      <SelectItem key={indexType.value} value={indexType.value}>
        {indexType.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Key Features:**
- Uses Base UI's `Select` with `multiple` prop
- Local state management in popover (saves on close)
- Allows empty selection (user can deselect all types)
- Placeholder text when no types selected

### 2. Local State with Save-on-Close Pattern

**Implemented:** Popover manages its own state, saves when closing

```tsx
// In MentionDetailsPopover
const [localIndexTypes, setLocalIndexTypes] = useState(mention.indexTypes);

// Save changes when unmounting (popover closing)
useEffect(() => {
  return () => {
    if (JSON.stringify(localIndexTypes.sort()) !== 
        JSON.stringify(mention.indexTypes.sort())) {
      onClose({ mentionId: mention.id, indexTypes: localIndexTypes });
    }
  };
}, [localIndexTypes, mention.id, mention.indexTypes, onClose]);
```

**Benefits:**
- Better performance (no re-renders while editing)
- Better UX (make changes, then commit on close)
- Simpler architecture (popover owns its state)

### 3. Editor Handler with Optimistic Update Note

```tsx
// In Editor component
const handleMentionDetailsClose = useCallback(
  async ({ mentionId, indexTypes }) => {
    // NOTE: Currently updating local state immediately.
    // Phase 5 TODO: Replace with optimistic update pattern:
    // 1. Immediately update local state (optimistic)
    // 2. Call backend API
    // 3. If API fails, revert to previous state
    // 4. If API succeeds, state is already correct

    await new Promise(resolve => setTimeout(resolve, 200));
    setMentions(prev =>
      prev.map(m => (m.id === mentionId ? { ...m, indexTypes } : m))
    );
  },
  []
);
```

### 4. Multi-Type Visual: Diagonal Stripes

**Implemented:** CSS linear gradient for diagonal stripes

```tsx
// In PdfHighlightBox component
const INDEX_TYPE_COLORS: Record<string, string> = {
  subject: '#FCD34D',  // yellow
  author: '#86EFAC',   // green
  scripture: '#93C5FD', // blue
};

const getColorForType = (indexType: string): string => {
  return INDEX_TYPE_COLORS[indexType] || '#FCD34D';
};

const getHighlightStyle = (indexTypes?: string[]) => {
  if (!indexTypes || indexTypes.length === 0) {
    return { backgroundColor: '#FCD34D' };
  }
  
  if (indexTypes.length === 1) {
    return { backgroundColor: getColorForType(indexTypes[0]) };
  }
  
  // Multi-type: diagonal stripes
  const colors = indexTypes.map(getColorForType);
  const stripeWidth = 100 / colors.length;
  
  const gradientStops = colors.map((color, i) => {
    const start = i * stripeWidth;
    const end = (i + 1) * stripeWidth;
    return `${color} ${start}%, ${color} ${end}%`;
  }).join(', ');
  
  return {
    background: `repeating-linear-gradient(45deg, ${gradientStops})`
  };
};
```

**Applied to highlights:**
```tsx
// Pass indexTypes through metadata
const mentionHighlights = mentions.map(mention => ({
  ...mention,
  metadata: { indexTypes: mention.indexTypes }
}));

// Use in PdfHighlightBox
const highlightStyle = getHighlightStyle(metadata?.indexTypes);
```

## UI Flow

### Adding to Additional Index Type

```
View Mode:
  Click highlight → Details popover
    ↓
  ┌─────────────────────────────────┐
  │ Highlight Details               │
  │                                 │
  │ Text: "...the pure concepts..." │
  │ Entry: Kant → CPR               │
  │ Index As:                       │
  │   [Subject            ▼]        │ ← Click to open dropdown
  │ Page: 42                        │
  │                                 │
  │ [Edit Entry] [Delete]           │
  └─────────────────────────────────┘
    ↓
  Open dropdown → Select "Author"
    ↓
  Close popover
    → Mention now in both Subject and Author
    → Highlight shows diagonal stripes (yellow + green)
    → Appears in both sidebar sections
```

## Testing

### Interaction Tests (MentionDetailsPopover)
- ✅ `EditButtonClick` - Edit button functionality
- ✅ `DeleteButtonClick` - Delete button functionality
- ✅ `DisplaysCorrectInformation` - Text, entry, page display
- ✅ `TruncatesLongText` - Long text truncation
- ✅ `SelectSingleIndexType` - Switch from one type to another
- ✅ `SelectMultipleIndexTypes` - Select multiple types
- ✅ `DeselectIndexType` - Remove a type from selection

### Visual Regression Tests (MentionDetailsPopover)
- ✅ `Default` - Default appearance (light mode)
- ✅ `DefaultDark` - Default appearance (dark mode)
- ✅ `ShortText` - Short text variant
- ✅ `LongText` - Long text with multiple types
- ✅ `HoverEditButton` - Edit button hover state
- ✅ `HoverDeleteButton` - Delete button hover state
- ✅ `ThreeTypesSelected` - All three types selected
- ✅ `DropdownOpen` - Multiselect dropdown in open state

### Visual Regression Tests (PdfHighlightBox)
- ✅ `SingleTypeSubject` - Solid yellow background
- ✅ `SingleTypeAuthor` - Solid green background
- ✅ `SingleTypeScripture` - Solid blue background
- ✅ `TwoTypesSubjectAuthor` - Yellow/green stripes
- ✅ `TwoTypesSubjectScripture` - Yellow/blue stripes
- ✅ `TwoTypesAuthorScripture` - Green/blue stripes
- ✅ `ThreeTypesAll` - Yellow/green/blue stripes
- ✅ `TwoTypesHover` - Hover state with stripes

## Phase 5 Integration

When implementing backend in Phase 5:

```tsx
// tRPC endpoint
mention.updateIndexTypes({
  id: string,
  indexTypes: string[]
})

// Optimistic update pattern
const updateIndexTypesMutation = trpc.mention.updateIndexTypes.useMutation({
  onMutate: async (variables) => {
    // Cancel queries
    await utils.mention.list.cancel();
    
    // Optimistically update
    const previous = utils.mention.list.getData();
    utils.mention.list.setData(undefined, (old) =>
      old?.map(m => m.id === variables.id ? { ...m, indexTypes: variables.indexTypes } : m)
    );
    
    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    utils.mention.list.setData(undefined, context.previous);
  },
});
```

## Implementation Notes

### Architecture Decisions

**Local State Pattern:**
- Popover manages its own `localIndexTypes` state
- Changes are saved when popover closes (via `onClose` callback)
- Better performance and UX than immediate updates
- Simpler testing (no wrapper component needed)

**Design System Improvements:**
- Updated yabasic `SelectContent` defaults:
  - `alignItemWithTrigger = false` (dropdown below trigger, not overlapping)
  - `align = "start"` (left-aligned)
- These defaults work better for modern dropdowns and multiselects

**Validation:**
- Allows empty selection (user can deselect all types)
- Parent component can decide how to handle empty `indexTypes`

### Files Modified

**Components:**
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/editor/editor.tsx`
  - Added `handleMentionDetailsClose` with optimistic update note
  - Passes `indexTypes` through highlight metadata
  - Passes mentions/currentPage/onMentionClick to WindowManager
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/mention-details-popover/mention-details-popover.tsx`
  - Replaced with multiselect dropdown
  - Local state management
  - Save-on-close pattern
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/_components/window-manager/window-manager.tsx`
  - Added mentions/currentPage/onMentionClick props
  - Passes to page content components
- `packages/yaboujee/src/components/pdf-highlight-layer/components/pdf-highlight-box/pdf-highlight-box.tsx`
  - Added color constants and helpers
  - Diagonal stripe styling for multi-type highlights
  - Uses opacity for hover (works with gradients)
- `packages/yabasic/src/components/ui/select.tsx`
  - Updated SelectContent defaults for better dropdown behavior

**Tests:**
- Added 4 new interaction tests for multiselect behavior
- Added 8 new VRT stories for color combinations
- Updated all existing tests with new props

## Next Task

After this, Task 4D (IndexEntry Connection UI) will add entry-based coloring, which is separate from index type colors.
