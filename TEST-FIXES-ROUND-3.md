# Test Fixes - Round 3

**Date:** February 3, 2026  
**Issue:** Tests still failing after Round 2 fixes  
**Root Cause Identified:** Smart autocomplete interference + stories not rendering

---

## Critical Fix: Smart Autocomplete Conflict

### Problem

The **"Create New Entry"** test was using `mockDraft` which has `text: "Kant, Immanuel"`:

```typescript
export const mockDraft: MentionDraft = {
  text: "Kant, Immanuel", // Exact match!
  // ...
};
```

The smart autocomplete feature (Task 4D-6) detects this exact match and **pre-fills** the entry picker with "Kant, Immanuel". When the test tries to create "Heidegger", it actually has "Kant, Immanuel" already selected, so clicking Attach attaches that instead of creating the new entry.

**Error seen:**
```
Expected: Attached: Heidegger
Received: Attached: Kant, Immanuel (entry-subject-3)
```

### Solution

Created a new mock draft without any matching text:

```typescript
// Added to shared.tsx
export const mockDraftNoMatch: MentionDraft = {
  pageNumber: 1,
  text: "Some other text", // No exact match
  bboxes: [{ x: 100, y: 200, width: 300, height: 40 }],
  type: "text",
};
```

Updated "Create New Entry" test to use `mockDraftNoMatch` instead of `mockDraft`.

---

## Stories Not Rendering Issue

### Symptoms

Most failed tests show identical HTML output:
- `<div class="sb-preparing-story sb-wrapper">`
- `<div class="sb-loader" />`
- Only Storybook scaffolding, no actual component content

This indicates the stories aren't rendering at all, suggesting:
1. JavaScript errors preventing execution
2. Missing context/providers
3. Syntax errors in test files

### Investigation Needed

If tests still fail after this round:

1. **Check browser console** for JavaScript errors:
   ```bash
   # Run Storybook in dev mode and check browser console
   pnpm storybook:frontend
   ```

2. **Verify decorators are applied** - Check if EntryPicker and EntryCreationModal tests need TestDecorator (though they don't use Jotai directly, they pass entries as props)

3. **Check for import errors** - Ensure all imports resolve correctly

4. **Incremental test fixing**:
   ```bash
   # Run a single story to isolate issues
   pnpm test:storybook-interaction --stories="**/entry-picker**/interaction-tests.stories.tsx"
   ```

---

## Files Modified

### 1. `mention-creation-popover/stories/shared.tsx`
- Added `mockDraftNoMatch` for tests that need non-matching text

### 2. `mention-creation-popover/stories/tests/interaction-tests.stories.tsx`
- Imported `mockDraftNoMatch`
- Updated "Create New Entry" story to use `mockDraftNoMatch`

---

## Test Logic for "Create New Entry"

With `mockDraftNoMatch` (no smart autocomplete):

```typescript
1. Click input → opens dropdown
2. Type "Heidegger" → no matches, "Create new entry" prompt appears
3. Press Enter → triggers onCreateNew
4. EntryCreationModal opens with "Heidegger" pre-filled
5. Click "Create" button
6. Modal calls onCreate → new entry created and auto-selected
7. Modal closes automatically (line 79 in entry-creation-modal.tsx)
8. Input now shows "Heidegger" (auto-selected by lines 274-277 in mention-creation-popover.tsx)
9. Click "Attach" button
10. Result: "Attached: Heidegger" ✅
```

---

## Key Learning: Test Data Matters!

**Always consider how mock data interacts with feature logic:**

- Smart autocomplete looks for exact matches in `draft.text`
- Mock data with `text: "Kant, Immanuel"` triggers autocomplete
- Tests for "create new" flow need mock data with no matches
- Tests for "select existing" flow can use matching mock data

**Pattern to follow:**

```typescript
// For autocomplete tests
const mockDraftWithMatch = { text: "Kant, Immanuel" };

// For creation tests
const mockDraftNoMatch = { text: "Some other text" };

// For specific scenarios
const mockDraftPartialMatch = { text: "Kant" };
```

---

## Expected State After Round 3

**Fixed:**
- ✅ MentionCreationPopover - "Create New Entry" (smart autocomplete conflict resolved)

**Still investigating:**
- ❓ EntryCreationModal - "Validate Unique Label" (timing or rendering)
- ❓ EntryPicker - "Search Entries" (not rendering)
- ❓ EntryPicker - "Search By Alias" (not rendering)
- ❓ MentionCreationPopover - "Select Existing Entry" (no options found)
- ❓ MentionCreationPopover - "Select Nested Entry" (no options found)
- ❓ MentionCreationPopover - "Create Region Mention" (no options found)

**Next Steps:**
1. Re-run tests to verify "Create New Entry" fix
2. Check browser console for errors on failing tests
3. Consider if EntryPicker/EntryCreationModal tests need Jotai TestDecorator
4. Verify all imports are correct

---

## Compilation Status

```bash
✅ pnpm format   # Passed
✅ pnpm typecheck # Passed
```

---

## Summary

**Root cause identified:** Smart autocomplete feature was interfering with "Create New Entry" test by pre-selecting an entry based on mock draft text.

**Solution:** Created separate mock data (`mockDraftNoMatch`) for creation tests that don't have matching text.

**Remaining issues:** Some stories appear to not be rendering at all (showing only loading screens), which suggests a different class of problems (JavaScript errors, missing providers, etc.) that need browser console investigation.

---

**Confidence Level:** High for the smart autocomplete fix; Medium for remaining issues (need more diagnostic info)
