# Playwright Test Organization

This directory contains two types of Playwright tests with separate configurations.

## Directory Structure

```
playwright/
├── vrt/                          # Component Visual Regression Tests
│   ├── vrt.config.ts             # Config for VRT (uses Storybook)
│   ├── generate-visual-tests.ts  # Generator script
│   └── tests/
│       ├── card.visual.spec.ts       # Auto-generated from VRT stories
│       ├── button.visual.spec.ts     # Auto-generated
│       └── _TEMPLATE.visual.spec.ts  # Template for custom tests
└── e2e/                          # End-to-End Tests
    ├── e2e.config.ts             # Config for E2E (uses Next.js)
    └── tests/
        └── homepage.spec.ts          # Manual E2E tests
```

## Component Visual Regression Tests (`vrt/`)

### Purpose
Test **isolated components** through Storybook stories to catch visual regressions.

### Target
Runs against **Storybook** (`http://localhost:6006`)

### Test Generation
**Auto-generated** from `visual-regression-tests.stories.tsx` files:

```bash
pnpm generate:visual-tests
```

### Running
```bash
pnpm test:vrt           # Run all VRT tests
pnpm test:vrt:ui        # Interactive mode
pnpm test:vrt:update    # Update snapshots
```

### When to Use
- Testing component variants (props, states)
- Visual regression on UI components
- Testing design system components
- Catching styling issues

### Example
```typescript
// playwright/vrt/tests/card.visual.spec.ts (AUTO-GENERATED)
test("Card with elevation", async ({ page }) => {
  await page.goto("/iframe.html?id=components-card--with-elevation");
  await expect(page).toHaveScreenshot("card-with-elevation.png");
});
```

## End-to-End Tests (`e2e/`)

### Purpose
Test **complete user workflows** in the actual Next.js application.

### Target
Runs against **Next.js app** (`http://localhost:3000`)

### Test Generation
**Manually written** - these are your application integration tests.

### Running
```bash
pnpm test:e2e          # Run all E2E tests
pnpm test:e2e:ui       # Interactive mode
pnpm test:e2e:headed   # See the browser
```

### When to Use
- Testing full user journeys
- Testing page navigation
- Testing form submissions
- Testing API integrations
- Testing authentication flows

### Example
```typescript
// playwright/e2e/tests/upload-flow.spec.ts (MANUAL)
test("User can upload and search PDF", async ({ page }) => {
  await page.goto("/");
  await page.click('button:has-text("Upload")');
  await page.setInputFiles('input[type="file"]', 'test.pdf');
  await expect(page.locator('.success-message')).toBeVisible();
});
```

## Key Differences

| Aspect | Component VRT | E2E Tests |
|--------|---------------|-----------|
| **Target** | Storybook stories | Next.js app |
| **Port** | 6006 | 3000 |
| **Generation** | Auto-generated | Manual |
| **Focus** | Component visuals | User workflows |
| **Speed** | Fast (isolated) | Slower (full app) |
| **Browsers** | Chromium only | Chrome, Firefox, Safari |

## Configuration Files

### `vrt/vrt.config.ts`
- Points to `./tests` directory
- Starts Storybook server
- Single browser (Chromium)
- Optimized for component snapshots

### `e2e/e2e.config.ts`
- Points to `./tests` directory
- Builds and starts Next.js
- Multiple browsers
- Full integration testing

## Workflow Summary

### For Component Changes
1. Update component code
2. Update VRT stories
3. Run `pnpm generate:visual-tests`
4. Run `pnpm test:vrt:ui` to review changes
5. Update snapshots if intentional: `pnpm test:vrt:update`

### For Feature Changes
1. Implement feature
2. Write E2E test in `playwright/e2e/`
3. Run `pnpm test:e2e:headed` to develop test
4. Commit test with feature

## Snapshots Location

Snapshots are automatically organized by test type:

```
playwright/
├── vrt/tests/
│   └── card.visual.spec.ts-snapshots/
│       └── chromium/
│           └── card-empty.png
└── e2e/tests/
    └── homepage.spec.ts-snapshots/
        └── chromium/
            └── homepage-loaded.png
```

All snapshots are committed to git.
