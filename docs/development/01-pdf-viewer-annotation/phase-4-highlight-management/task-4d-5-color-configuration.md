# Task 4D-5: Index Type Color Configuration

**Duration:** 1.5 hours  
**Status:** ⚪ Not Started  
**Dependencies:** Task 4D-1 completion

## Goal

Make highlight colors configurable per index type, replacing hardcoded colors in `PdfHighlightBox` with dynamic values from IndexType configuration.

## Current State

**Hardcoded colors in PdfHighlightBox:**

```typescript
// packages/yaboujee/src/components/pdf-highlight-layer/components/pdf-highlight-box/pdf-highlight-box.tsx
const INDEX_TYPE_COLORS: Record<string, string> = {
  subject: "#FCD34D",  // Yellow
  author: "#86EFAC",   // Green
  scripture: "#93C5FD", // Blue
};
```

**Task 4C multi-type stripes already implemented** using `repeating-linear-gradient`.

## Color System Design

### Default Color Assignment

```typescript
const DEFAULT_COLORS = ['#FCD34D', '#93C5FD', '#86EFAC', '#FCA5A5'];
// Yellow, Blue, Green, Red

const assignDefaultColor = ({ ordinal }: { ordinal: number }): string => {
  if (ordinal < DEFAULT_COLORS.length) {
    return DEFAULT_COLORS[ordinal];
  }
  // Generate color for additional index types using golden angle distribution
  const hue = (ordinal * 137) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};
```

**Mapping:**
- Subject (ordinal: 0) → Yellow (#FCD34D)
- Author (ordinal: 1) → Blue (#93C5FD)
- Scripture (ordinal: 2) → Green (#86EFAC)
- Context (ordinal: 3) → Red (#FCA5A5)
- Additional types → Generated colors

### Color Flow

```
IndexType configs → Mention.indexTypes → Highlight.metadata.colors → PdfHighlightBox styles
```

**Implementation:**
1. IndexType has `color` field
2. When creating highlight from mention, map `indexTypes` to colors
3. Pass colors array in `highlight.metadata.colors`
4. PdfHighlightBox uses colors array (already supports multi-color stripes)

## Update PdfHighlightBox

### Remove Hardcoded Colors

```typescript
// packages/yaboujee/src/components/pdf-highlight-layer/components/pdf-highlight-box/pdf-highlight-box.tsx

// ❌ REMOVE
const INDEX_TYPE_COLORS: Record<string, string> = {
  subject: "#FCD34D",
  author: "#86EFAC",
  scripture: "#93C5FD",
};

const getColorForType = (type: string): string => {
  return INDEX_TYPE_COLORS[type] || "#FCD34D";
};
```

### Use Dynamic Colors from Metadata

```typescript
// ✅ NEW APPROACH
const getHighlightStyle = ({
  colors,
  isDraft = false,
}: {
  colors?: string[]; // From highlight.metadata.colors
  isDraft?: boolean;
}): React.CSSProperties => {
  if (isDraft) {
    return {
      backgroundColor: 'transparent',
      border: '2px dashed #3b82f6',
    };
  }
  
  if (!colors || colors.length === 0) {
    // Fallback to yellow if no colors provided
    return { backgroundColor: '#FCD34D' };
  }
  
  if (colors.length === 1) {
    // Single color: solid background
    return { backgroundColor: colors[0] };
  }
  
  // Multiple colors: diagonal stripes
  const stripeWidth = 100 / colors.length;
  const gradientStops = colors.flatMap((color, i) => {
    const start = i * stripeWidth;
    const end = (i + 1) * stripeWidth;
    return [
      `${color} ${start}%`,
      `${color} ${end}%`,
    ];
  });
  
  return {
    backgroundImage: `repeating-linear-gradient(
      45deg,
      ${gradientStops.join(', ')}
    )`,
  };
};
```

### Updated Component

```typescript
export const PdfHighlightBox = ({
  highlight,
  isDraft = false,
  ...props
}: PdfHighlightBoxProps) => {
  const colors = highlight.metadata?.colors as string[] | undefined;
  
  const style = getHighlightStyle({ colors, isDraft });
  
  return (
    <div
      className={cn(
        "absolute pointer-events-auto cursor-pointer",
        isDraft ? "opacity-50" : "opacity-30 hover:opacity-50",
        "transition-opacity duration-200"
      )}
      style={style}
      {...props}
    >
      {/* Highlight content */}
    </div>
  );
};
```

## Update Editor Highlight Mapping

### Map IndexTypes to Colors

```typescript
// apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/editor.tsx

const mentionHighlights: PdfHighlight[] = mentions.map((mention) => {
  // Map mention.indexTypes to colors from IndexType configs
  const colors = mention.indexTypes
    .map((typeName) => {
      const indexType = indexTypes.find(t => t.name === typeName);
      return indexType?.color;
    })
    .filter((color): color is string => color !== undefined);
  
  return {
    id: mention.id,
    pageNumber: mention.pageNumber,
    bboxes: mention.bboxes,
    label: mention.entryLabel,
    text: mention.text,
    metadata: {
      entryId: mention.entryId,
      indexTypes: mention.indexTypes,
      colors: colors.length > 0 ? colors : ['#FCD34D'], // Fallback to yellow
    },
  };
});
```

## ColorConfigModal Component (Optional for Now)

**Scope for Task 4D-5:** Focus on making colors dynamic, not building full config UI.

**Defer to future task:** Color customization UI in project settings.

**For now:**
- Use default colors from IndexType mock data
- Colors can be edited directly in mock data for testing
- Full UI can be added later when needed

## Testing Changes

### Update Existing Stories

Update `PdfHighlightBox` stories to use new `colors` metadata format:

```typescript
// packages/yaboujee/src/components/pdf-highlight-layer/components/pdf-highlight-box/stories/pdf-highlight-box.stories.tsx

export const SingleType: Story = {
  args: {
    highlight: {
      id: '1',
      pageNumber: 1,
      bboxes: [{ x: 100, y: 100, width: 200, height: 20 }],
      label: 'Philosophy',
      metadata: {
        colors: ['#FCD34D'], // Yellow
      },
    },
  },
};

export const MultipleTypes: Story = {
  args: {
    highlight: {
      id: '2',
      pageNumber: 1,
      bboxes: [{ x: 100, y: 150, width: 200, height: 20 }],
      label: 'Kant, Immanuel',
      metadata: {
        colors: ['#FCD34D', '#93C5FD'], // Yellow + Blue stripes
      },
    },
  },
};

export const ThreeTypes: Story = {
  args: {
    highlight: {
      id: '3',
      pageNumber: 1,
      bboxes: [{ x: 100, y: 200, width: 200, height: 20 }],
      label: 'Multi-Index',
      metadata: {
        colors: ['#FCD34D', '#93C5FD', '#86EFAC'], // Yellow + Blue + Green
      },
    },
  },
};
```

### Test Color Mapping in Editor

```typescript
// In editor stories, verify colors flow correctly
export const HighlightsWithColors: Story = {
  play: async ({ canvasElement, step }) => {
    // Create mention with multiple index types
    // Verify highlight renders with correct striped colors
  },
};
```

## Files to Update

- `packages/yaboujee/src/components/pdf-highlight-layer/components/pdf-highlight-box/pdf-highlight-box.tsx`
- `packages/yaboujee/src/components/pdf-highlight-layer/components/pdf-highlight-box/stories/pdf-highlight-box.stories.tsx`
- `apps/index-pdf-frontend/src/app/projects/[projectDir]/editor/editor.tsx`

## Success Criteria

- ✅ Hardcoded colors removed from PdfHighlightBox
- ✅ Colors passed via `highlight.metadata.colors` array
- ✅ Single-type highlights use solid color
- ✅ Multi-type highlights use diagonal stripes with correct colors
- ✅ Fallback to yellow if no colors provided
- ✅ Editor maps IndexType colors correctly
- ✅ All existing tests updated and passing

## Future Enhancement

**ColorConfigModal Component (deferred):**
- UI to customize IndexType colors
- Color picker integration
- Preview of highlight colors
- Reset to default colors

This can be added when users need to customize colors. For now, colors are configured in mock data.

## Next Task

[Task 4D-6: Smart Autocomplete Integration](./task-4d-6-smart-autocomplete.md)
