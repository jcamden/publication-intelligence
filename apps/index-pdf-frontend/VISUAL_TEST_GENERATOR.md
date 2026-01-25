# Visual Test Generator

Automatically generates Playwright test files from your Storybook VRT stories.

## How It Works

The generator scans your codebase for `visual-regression-tests.stories.tsx` files and creates corresponding Playwright test files in `playwright/components/`.

### What Gets Generated

**Input:** `src/components/card/stories/tests/visual-regression-tests.stories.tsx`

```typescript
export const Empty: StoryObj<typeof Card> = { ... };
export const WithLowElevation: StoryObj<typeof Card> = { ... };
export const WithMediumElevation: StoryObj<typeof Card> = { ... };
// ... more stories
```

**Output:** `playwright/vrt/tests/card.visual.spec.ts`

```typescript
/**
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: src/components/card/stories/tests/visual-regression-tests.stories.tsx
 * Run: pnpm generate:visual-tests to regenerate
 */

import { test, expect } from "@playwright/test";

test.describe("Card - Visual Regression", () => {
  test("Empty", async ({ page }) => {
    await page.goto(getStorybookUrl({ storyId: "components-card-tests-visual-regression-tests--empty" }));
    await expect(page).toHaveScreenshot("card-empty.png");
  });

  test("WithLowElevation", async ({ page }) => {
    await page.goto(getStorybookUrl({ storyId: "components-card-tests-visual-regression-tests--with-low-elevation" }));
    await expect(page).toHaveScreenshot("card-with-low-elevation.png");
  });

  // ... one test per exported story
});
```

## Usage

### Generate All Tests

```bash
# From root
pnpm generate:visual-tests

# From frontend directory
cd apps/index-pdf-frontend
pnpm generate:visual-tests
```

### Workflow

1. **Create/Update VRT Stories**
   ```bash
   # Edit: src/components/button/stories/tests/visual-regression-tests.stories.tsx
   ```

2. **Generate Playwright Tests**
   ```bash
   pnpm generate:visual-tests
   ```

3. **Run Visual Tests**
   ```bash
   pnpm test:vrt
   ```

### When to Regenerate

Run `pnpm generate:visual-tests` whenever you:
- ✅ Add a new component with VRT stories
- ✅ Add/remove stories in existing `visual-regression-tests.stories.tsx` files
- ✅ Rename story exports
- ✅ Change the component structure

## What Gets Detected

The generator automatically finds:

- **Component name**: Extracted from the file path
  - `src/components/card/...` → `card`
  - `src/components/button/...` → `button`

- **Story exports**: All exported constants (except `default`)
  - `export const Empty` → Test named "Empty"
  - `export const WithProps` → Test named "WithProps"

- **Story IDs**: Auto-generated from Storybook's convention
  - Title: `"Components/Card/tests/Visual Regression Tests"`
  - Export: `Empty`
  - ID: `"components-card-tests-visual-regression-tests--empty"`

## File Structure

```
src/components/
└── card/
    └── stories/
        └── tests/
            └── visual-regression-tests.stories.tsx  ← Source

playwright/vrt/
├── generate-visual-tests.ts  ← Generator
└── tests/
    └── card.visual.spec.ts  ← Generated (AUTO-GENERATED)
```

## Generated Files Are Git-Tracked

The generated Playwright test files are:
- ✅ Committed to git
- ✅ Reviewed in PRs
- ✅ Versioned with your stories
- ⚠️  **Never edited manually** - always regenerate

## Customization

If you need custom Playwright test logic (special waits, interactions, etc.), you have two options:

### Option 1: Add to VRT Story (Recommended)
Add test-specific data attributes or setup in your VRT stories:

```typescript
export const WithAnimation: StoryObj<typeof Card> = {
  render: () => <Card data-testid="animated-card">Content</Card>,
};
```

### Option 2: Create Separate Test File
For complex test logic that can't be expressed in stories, create a separate file:

```
playwright/vrt/tests/
├── card.visual.spec.ts           # Auto-generated
└── card-custom.visual.spec.ts    # Manual, for special cases
```

## Example Output

```bash
$ pnpm generate:visual-tests

🔍 Scanning for visual regression test stories...

Found 3 VRT story file(s):

✅ card
   Stories: 12
   Output: playwright/vrt/tests/card.visual.spec.ts

✅ button
   Stories: 8
   Output: playwright/vrt/tests/button.visual.spec.ts

✅ input
   Stories: 15
   Output: playwright/vrt/tests/input.visual.spec.ts

🎉 Visual regression tests generated successfully!
```

## Benefits

1. **Single Source of Truth**: Stories define both documentation and tests
2. **No Duplication**: Don't maintain stories and tests separately
3. **Always in Sync**: Regenerate to stay current with story changes
4. **Easy to Scale**: Add new components without manual test setup
5. **Consistent Patterns**: All tests follow the same structure

## Troubleshooting

### Generator doesn't find my stories

Make sure your file is named exactly `visual-regression-tests.stories.tsx` and is under `src/components/`.

### Story IDs don't match

The generator uses Storybook's kebab-case convention. If your Storybook uses custom story IDs, you may need to adjust the generator.

### Tests are missing

Only exported story constants are converted to tests. Make sure you're exporting your stories:

```typescript
// ✅ Good - will be detected
export const MyStory: StoryObj = { ... };

// ❌ Bad - won't be detected
const MyStory: StoryObj = { ... };
```
