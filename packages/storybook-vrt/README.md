# @pubint/storybook-vrt

Component visual regression testing against Storybook.

## Overview

This package provides centralized visual regression testing for all component libraries in the monorepo. It:
- Scans Storybook VRT stories from any workspace
- Auto-generates Playwright tests
- Stores snapshots organized by package
- Runs tests against a local Storybook instance

## Usage

### All-in-One Commands (Recommended)

Generate tests and run them in a single command:

```bash
# From workspace root
pnpm vrt:yaboujee          # Generate + run yaboujee VRT
pnpm vrt:yaboujee:ui       # Generate + interactive UI mode
pnpm vrt:yaboujee:update   # Generate + update snapshots

pnpm vrt:frontend          # Generate + run frontend VRT
pnpm vrt:frontend:ui       # Generate + interactive UI mode
pnpm vrt:frontend:update   # Generate + update snapshots
```

### Separate Generate and Test

If you need to run steps separately:

```bash
# From storybook-vrt directory
pnpm generate:yaboujee     # Only generate tests
pnpm test:yaboujee         # Only run tests
pnpm test:yaboujee:ui      # Only run in UI mode
```

## Configuration

The generator looks for `visual-regression-tests.stories.tsx` files in:
- `packages/{packageName}/src/components/**/stories/tests/`
- `apps/{packageName}/src/components/**/stories/tests/`

Generated files are organized by package:
- `suites/{packageName}/tests/` - Generated test files (git-ignored)
- `suites/{packageName}/__snapshots__/` - Snapshots organized by component
- `suites/{packageName}/playwright-report/` - Test reports (git-ignored)
- `suites/{packageName}/test-results/` - Test results (git-ignored)

## How It Works

1. **Story Definition**: Create VRT stories with the `visual-regression` tag
2. **Generation**: Script scans stories and generates Playwright tests
3. **Execution**: Playwright navigates to each story's Storybook URL
4. **Loading Detection**: Tests wait for Storybook to fully load:
   - Network idle (no pending requests, loading spinner gone)
   - All images loaded
   - Animations disabled for consistency
5. **Comparison**: Screenshots are compared against stored snapshots

### URL Format

Generated URLs include story-specific globals for proper rendering:

```
/iframe.html?id=story-id&viewMode=story&globals=theme:dark;viewport.value:mobile1
```

This ensures dark mode, viewport settings, and other globals are applied correctly.

## Adding New Stories

1. Create a `visual-regression-tests.stories.tsx` file in your component
2. Export stories with the `visual-regression` tag
3. Run `pnpm generate --package {your-package}`
4. Run `pnpm test:vrt` to capture initial snapshots

Example story:

```typescript
import { visualRegressionTestConfig } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { MyComponent } from "../../MyComponent";

export default {
  title: "Components/MyComponent/tests/Visual Regression Tests",
  component: MyComponent,
  tags: ["visual-regression"],
  parameters: {
    ...visualRegressionTestConfig,
  },
} satisfies Meta<typeof MyComponent>;

export const Default: StoryObj<typeof MyComponent> = {
  args: { variant: "primary" },
};

export const DarkMode: StoryObj<typeof MyComponent> = {
  parameters: { backgrounds: { default: "dark" } },
  globals: { theme: "dark" },
  args: { variant: "primary" },
};
```
