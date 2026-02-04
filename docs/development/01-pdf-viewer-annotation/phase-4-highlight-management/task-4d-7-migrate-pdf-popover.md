# Task 4D-7: Migrate PDF Annotation Popover to shadcn

**Duration:** 2 hours  
**Status:** ⚪ Not Started  
**Dependencies:** Task 4D-5 completion (color configuration using shadcn popovers)

## Goal

Replace the custom `PdfAnnotationPopover` implementation with the shadcn `Popover` component from `@pubint/yabasic` to ensure consistent popover behavior across the codebase.

## Current State

### Custom Implementation

```typescript
// packages/yaboujee/src/components/pdf/components/pdf-annotation-popover/pdf-annotation-popover.tsx
export const PdfAnnotationPopover = ({
  anchorElement,
  isOpen,
  onCancel,
  children,
}: PdfAnnotationPopoverProps) => {
  // Custom positioning logic: right → left → edge fallback
  // Custom scroll/resize handlers
  // Special click-outside handling for nested portals:
  if (
    target.closest('[role="listbox"]') ||
    target.closest('[role="menu"]') ||
    target.closest("[data-radix-popper-content-wrapper]") ||
    target.closest("[data-radix-select-content]")
  ) {
    return; // Don't close popover when clicking nested portal elements
  }
  // Custom Escape key handling
};
```

### Usage Pattern

```typescript
// packages/yaboujee/src/components/pdf/components/pdf-viewer/pdf-viewer.tsx
const [draftPopoverAnchor, setDraftPopoverAnchor] = useState<HTMLElement | null>(null);

// Find draft highlight element for popover positioning
useEffect(() => {
  if (!draftHighlight) {
    setDraftPopoverAnchor(null);
    return;
  }
  
  const timer = setTimeout(() => {
    const element = document.querySelector('[data-testid="highlight-draft"]');
    setDraftPopoverAnchor(element as HTMLElement | null);
  }, 50);
  
  return () => clearTimeout(timer);
}, [draftHighlight]);

// Render popover
<PdfAnnotationPopover
  anchorElement={draftPopoverAnchor}
  isOpen={!!draftPopoverAnchor}
  onCancel={handleDraftCancel}
>
  {renderDraftPopover({...})}
</PdfAnnotationPopover>
```

## Migration Strategy

### Phase 1: Verify shadcn Popover Capabilities

**Test if Base UI's Popover handles nested portal clicks correctly:**

The critical requirement is that clicking nested Select dropdowns (which render in portals) should NOT close the parent popover. Base UI's Popover is sophisticated and may handle this automatically, but we need to verify.

**Test case:**
1. Create a test story with shadcn Popover containing a Select dropdown
2. Open the popover
3. Click the Select to open its dropdown
4. Verify the parent popover stays open
5. Click a Select option
6. Verify the parent popover stays open

```typescript
// Test story location
// packages/yaboujee/src/components/pdf/components/pdf-annotation-popover/stories/tests/migration-test.stories.tsx

export const NestedSelectTest: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Open popover', async () => {
      const trigger = canvas.getByRole('button', { name: /open/i });
      await userEvent.click(trigger);
      const popover = within(document.body).getByRole('dialog');
      await expect(popover).toBeInTheDocument();
    });
    
    await step('Open nested Select dropdown', async () => {
      const select = within(document.body).getByRole('combobox');
      await userEvent.click(select);
      const listbox = within(document.body).getByRole('listbox');
      await expect(listbox).toBeInTheDocument();
      
      // Critical: Verify popover is still open
      const popover = within(document.body).getByRole('dialog');
      await expect(popover).toBeInTheDocument();
    });
    
    await step('Select an option', async () => {
      const option = within(document.body).getByRole('option', { name: /kant/i });
      await userEvent.click(option);
      
      // Critical: Verify popover is still open
      const popover = within(document.body).getByRole('dialog');
      await expect(popover).toBeInTheDocument();
    });
  },
};
```

### Phase 2: Implement shadcn Popover Wrapper (if needed)

**If Base UI handles nested portals correctly:**
- Create a thin wrapper around shadcn Popover with our API
- Minimal abstraction, just for convenience

**If Base UI does NOT handle nested portals correctly:**
- Enhance shadcn Popover with custom click-outside logic
- Override the default `onOpenChange` behavior
- Keep the special portal detection logic

```typescript
// packages/yabasic/src/components/ui/pdf-popover.tsx (if needed)

import * as React from "react";
import { Popover, PopoverTrigger, PopoverPortal, PopoverContent } from "./popover";

type PdfPopoverProps = {
  anchor: React.RefObject<HTMLElement>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export const PdfPopover = ({
  anchor,
  open,
  onOpenChange,
  children,
}: PdfPopoverProps) => {
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    // If closing, check if click target was in a nested portal
    if (!newOpen && document.activeElement) {
      const target = document.activeElement;
      if (
        target.closest('[role="listbox"]') ||
        target.closest('[role="menu"]') ||
        target.closest("[data-radix-popper-content-wrapper]") ||
        target.closest("[data-radix-select-content]")
      ) {
        return; // Don't close
      }
    }
    onOpenChange(newOpen);
  }, [onOpenChange]);
  
  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger ref={anchor} style={{ display: 'none' }} />
      <PopoverPortal>
        <PopoverContent>
          {children}
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
};
```

### Phase 3: Update pdf-viewer.tsx

**Replace state management:**

```typescript
// ❌ OLD
const [draftPopoverAnchor, setDraftPopoverAnchor] = useState<HTMLElement | null>(null);

useEffect(() => {
  if (!draftHighlight) {
    setDraftPopoverAnchor(null);
    return;
  }
  
  const timer = setTimeout(() => {
    const element = document.querySelector('[data-testid="highlight-draft"]');
    setDraftPopoverAnchor(element as HTMLElement | null);
  }, 50);
  
  return () => clearTimeout(timer);
}, [draftHighlight]);

// ✅ NEW
const draftPopoverAnchorRef = useRef<HTMLElement | null>(null);

useEffect(() => {
  if (!draftHighlight) {
    draftPopoverAnchorRef.current = null;
    return;
  }
  
  const timer = setTimeout(() => {
    const element = document.querySelector('[data-testid="highlight-draft"]');
    draftPopoverAnchorRef.current = element as HTMLElement | null;
  }, 50);
  
  return () => clearTimeout(timer);
}, [draftHighlight]);
```

**Replace render:**

```typescript
// ❌ OLD
<PdfAnnotationPopover
  anchorElement={draftPopoverAnchor}
  isOpen={!!draftPopoverAnchor}
  onCancel={handleDraftCancel}
>
  {renderDraftPopover({...})}
</PdfAnnotationPopover>

// ✅ NEW
<Popover.Root
  open={!!draftHighlight}
  onOpenChange={(open) => {
    if (!open) handleDraftCancel();
  }}
>
  {draftPopoverAnchorRef.current && (
    <Popover.Anchor ref={draftPopoverAnchorRef} />
  )}
  <Popover.Portal>
    <Popover.Content>
      {renderDraftPopover({...})}
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
```

### Phase 4: Update Existing Tests

Update all interaction tests that use `PdfAnnotationPopover`:

```typescript
// Find all usage with:
// grep -r "PdfAnnotationPopover" apps/ packages/ --include="*.tsx"

// Update each test to work with new shadcn Popover API
```

### Phase 5: Remove Custom Implementation

Once migration is complete and all tests pass:

```bash
# Delete custom implementation
rm -rf packages/yaboujee/src/components/pdf/components/pdf-annotation-popover/
```

## Critical Questions to Answer

### 1. Does Base UI Popover handle nested portal clicks?

**Test:** Create the `NestedSelectTest` story above.

**Outcome A:** ✅ Yes → Simple migration, minimal wrapper needed  
**Outcome B:** ❌ No → Need custom click-outside enhancement

### 2. Can we use ref-based anchoring with shadcn Popover?

The shadcn Popover uses Base UI which supports `<Popover.Anchor>`, but this is not well documented in shadcn's API.

**Test:** Verify we can anchor to dynamically found elements.

```typescript
const anchorRef = useRef<HTMLElement | null>(null);

useEffect(() => {
  const element = document.querySelector('[data-testid="target"]');
  anchorRef.current = element as HTMLElement | null;
}, []);

<Popover.Anchor ref={anchorRef} />
```

### 3. Are collision detection defaults appropriate?

Base UI provides collision detection out of the box. Does it work well for PDF annotation popovers?

**Test:** Position highlights near viewport edges and verify popover flips correctly.

## Success Criteria

- ✅ Phase 1 test story created and passing
- ✅ Nested Select clicks do NOT close parent popover
- ✅ Ref-based anchoring works for dynamic elements
- ✅ Popover positions correctly near viewport edges
- ✅ All existing PDF annotation popover tests updated and passing
- ✅ Custom `PdfAnnotationPopover` deleted
- ✅ No visual or behavioral regressions

## Rollback Plan

If migration proves too complex or introduces regressions:

1. Keep custom `PdfAnnotationPopover` implementation
2. Document why shadcn Popover is not suitable
3. Ensure consistency in our custom implementation across future updates

The custom implementation is **pragmatic and working**. Only migrate if it improves maintainability without adding complexity.

## Files to Update

### To Create:
- `packages/yaboujee/src/components/pdf/components/pdf-annotation-popover/stories/tests/migration-test.stories.tsx`
- `packages/yabasic/src/components/ui/pdf-popover.tsx` (if needed)

### To Update:
- `packages/yaboujee/src/components/pdf/components/pdf-viewer/pdf-viewer.tsx`
- All test files using `PdfAnnotationPopover`

### To Delete (after successful migration):
- `packages/yaboujee/src/components/pdf/components/pdf-annotation-popover/` (entire directory)

## Next Steps

After this task completes, evaluate whether the migration was successful:

**If successful:** Document the pattern for future PDF-related popovers  
**If not successful:** Document the requirements that shadcn Popover cannot fulfill and maintain custom implementation

## Related Tasks

- [Task 4D-5: Color Configuration](./task-4d-5-color-configuration.md) - Uses shadcn Popover successfully
- [Task 4D-2: Entry Creation Modal](./task-4d-2-entry-creation-modal.md) - Uses shadcn Dialog
- [Task 4D-3: Entry Picker](./task-4d-3-entry-picker.md) - Uses shadcn Select (nested portal case)
