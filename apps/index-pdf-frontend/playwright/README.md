# Playwright Test Organization

This directory contains end-to-end tests for the application.

> **Note:** Component visual regression tests have moved to `packages/storybook-vrt/`.  
> See [VRT Migration Guide](../../../packages/storybook-vrt/MIGRATION.md) for details.

## Directory Structure

```
playwright/
└── e2e/                          # End-to-End Tests
    ├── e2e.config.ts             # Config for E2E (uses Next.js)
    └── tests/
        └── homepage.spec.ts          # Manual E2E tests
```

## Component Visual Regression Tests

Component VRT is now centralized in `packages/storybook-vrt/` and works for all packages.

### Quick Start
```bash
# From workspace root:
pnpm vrt:generate --package index-pdf-frontend
PACKAGE=index-pdf-frontend pnpm vrt:test
```

See the [VRT README](../../../packages/storybook-vrt/README.md) for full documentation.

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

## Configuration

### `e2e/e2e.config.ts`
- Points to `./tests` directory
- Builds and starts Next.js
- Multiple browsers supported
- Full integration testing

## Workflow

1. Implement feature
2. Write E2E test in `playwright/e2e/tests/`
3. Run `pnpm test:e2e:ui` to develop test
4. Commit test with feature

## Snapshots Location

E2E test snapshots are stored alongside tests:

```
playwright/e2e/tests/
└── homepage.spec.ts-snapshots/
    └── chromium/
        └── homepage-loaded.png
```

All snapshots are committed to git.
