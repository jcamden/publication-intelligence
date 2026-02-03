# Task 4C.5: Multi-Type Management Enhancement

**Duration:** 1 day  
**Status:** ⚪ Not Started  
**Dependencies:** Task 4C completion  
**Note:** This is an enhancement to be done after core Task 4C CRUD operations

## Overview

Add UI for managing which index types a mention belongs to, and implement visual distinction (diagonal stripes) for mentions that belong to multiple index types.

## Completed in Task 4C

- ✅ `Mention` type includes `indexTypes: string[]`
- ✅ Index type captured when creating mention (from sidebar section)
- ✅ Sidebar sections filter mentions by their index type
- ✅ Details popover displays current index types

## Requirements

### 1. "Index As" Checklist in Details Popover

Add UI to change which index types a mention belongs to:

```tsx
// In MentionDetailsPopover
<div>
  <span className="text-neutral-600 dark:text-neutral-400">
    Index As:
  </span>
  <div className="flex flex-col gap-1 mt-1">
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={mention.indexTypes.includes('subject')}
        onChange={() => toggleIndexType('subject')}
      />
      <span className="text-sm">Subject</span>
    </label>
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={mention.indexTypes.includes('author')}
        onChange={() => toggleIndexType('author')}
      />
      <span className="text-sm">Author</span>
    </label>
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={mention.indexTypes.includes('scripture')}
        onChange={() => toggleIndexType('scripture')}
      />
      <span className="text-sm">Scripture</span>
    </label>
  </div>
</div>
```

### 2. Update Handler

```tsx
const handleUpdateIndexTypes = useCallback(
  async ({ mentionId, indexTypes }: { mentionId: string; indexTypes: string[] }) => {
    // Phase 5 TODO: Replace with tRPC mutation
    // await updateMentionIndexTypesMutation.mutateAsync({ id: mentionId, indexTypes });

    // Simulated API call
    await new Promise(resolve => setTimeout(resolve, 200));

    // Update local state
    setMentions(prev =>
      prev.map(m => (m.id === mentionId ? { ...m, indexTypes } : m))
    );
  },
  []
);
```

### 3. Multi-Type Visual: Diagonal Stripes

Mentions belonging to multiple index types should display with diagonal stripes combining the colors of all their types.

**Default Index Type Colors:**
- Subject: `#FCD34D` (yellow)
- Author: `#86EFAC` (green)  
- Scripture: `#93C5FD` (blue)

**Implementation Options:**

**Option A: CSS Linear Gradient (Recommended)**
```tsx
// In PdfHighlightBox component
const getHighlightStyle = (indexTypes: string[]) => {
  if (indexTypes.length === 1) {
    // Single type: solid color
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
    background: `repeating-linear-gradient(
      45deg,
      ${gradientStops}
    )`
  };
};
```

**Option B: SVG Pattern**
More complex, better for print/export, but overkill for MVP.

### 4. Color Mapping Helper

```tsx
const INDEX_TYPE_COLORS: Record<string, string> = {
  subject: '#FCD34D',
  author: '#86EFAC',
  scripture: '#93C5FD',
};

const getColorForType = (indexType: string): string => {
  return INDEX_TYPE_COLORS[indexType] || '#FCD34D'; // Default to yellow
};
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
  │   [✓] Subject                   │ ← Currently checked
  │   [ ] Author                    │ ← Click to add
  │   [ ] Scripture                 │
  │ Page: 42                        │
  │                                 │
  │ [Edit Entry] [Delete]           │
  └─────────────────────────────────┘
    ↓
  Check "Author"
    → Mention now in both Subject and Author
    → Highlight shows diagonal stripes (yellow + green)
    → Appears in both sidebar sections
```

## Testing

- [ ] Can add mention to additional index types via checklist
- [ ] Can remove mention from index type via checklist
- [ ] Cannot uncheck all types (must belong to at least one)
- [ ] Mention appears in all relevant sidebar sections
- [ ] Single-type mentions show solid color
- [ ] Multi-type mentions show diagonal stripes
- [ ] Stripe colors match index type colors
- [ ] Three-type mentions show all three colors in stripes

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

## Notes

- This enhances Task 4C, but is optional for Phase 4 completion
- Can be deferred to Phase 5 if time is limited
- The core functionality (capturing and displaying index type) is already done
- This task adds the UI for changing types after creation

## Next Task

After this, Task 4D (IndexEntry Connection UI) will add entry-based coloring, which is separate from index type colors.
