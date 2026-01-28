# VRT Architecture

## Overview

This package provides centralized visual regression testing for all component libraries in the monorepo. Tests, snapshots, and reports are isolated per package to avoid conflicts.

## Directory Structure

```
packages/storybook-vrt/
├── scripts/
│   └── generate-visual-tests.ts    # Generates Playwright tests from stories
├── suites/
│   ├── yaboujee/                   # Package-specific directory
│   │   ├── tests/                  # Auto-generated tests (git-ignored)
│   │   │   ├── alert.visual.spec.ts
│   │   │   └── form-footer.visual.spec.ts
│   │   ├── __snapshots__/          # Snapshots (committed to git)
│   │   │   ├── alert.visual.spec.ts/
│   │   │   └── form-footer.visual.spec.ts/
│   │   ├── playwright-report/      # Test reports (git-ignored)
│   │   └── test-results/           # Test results (git-ignored)
│   └── index-pdf-frontend/         # Another package
│       ├── tests/                  # Auto-generated tests (git-ignored)
│       │   ├── button.visual.spec.ts
│       │   └── card.visual.spec.ts
│       ├── __snapshots__/          # Snapshots (committed to git)
│       ├── playwright-report/      # Test reports (git-ignored)
│       └── test-results/           # Test results (git-ignored)
├── playwright.config.ts             # Dynamic config based on PACKAGE
└── package.json                     # Scripts for each package
```

**Note:** Test files are auto-generated and git-ignored. Only snapshots are committed to git.

## How It Works

### 1. Test Generation

The generator scans a package for `visual-regression-tests.stories.tsx` files:

```bash
pnpm generate --package yaboujee
```

**What it does:**
- Searches `packages/yaboujee/src` and `apps/yaboujee/src`
- Finds all `visual-regression-tests.stories.tsx` files
- Parses each story and extracts:
  - Story name and ID
  - Globals (`theme`, `viewport.value`)
- Generates Playwright test files in `suites/yaboujee/tests/`

**Output:**
```typescript
// suites/yaboujee/tests/alert.visual.spec.ts
test("AllVariantsStackNarrowContainerDark", async ({ page }) => {
  await page.goto(
    getStorybookUrl({
      storyId: "components-alert--all-variants-stack-narrow-container-dark",
      globals: {"theme":"dark","viewport.value":"mobile1"}
    })
  );
  
  // Wait for Storybook to finish loading
  await page.waitForLoadState("networkidle");
  
  // Wait for all images to load
  await page.waitForFunction(() =>
    Array.from(document.images).every((img) => img.complete)
  );
  
  await expect(page).toHaveScreenshot("Alert-all-variants-stack-narrow-container-dark.png", {
    animations: "disabled",
  });
});
```

### 2. Test Execution

Running tests requires specifying which package:

```bash
pnpm test:yaboujee
# or
PACKAGE=yaboujee pnpm test:vrt
```

**What happens:**
1. Playwright config reads `PACKAGE` env var
2. Sets `testDir` to `./suites/${PACKAGE}/tests`
3. Configures snapshots to `./suites/${PACKAGE}/__snapshots__/`
4. Configures reports to `./suites/${PACKAGE}/playwright-report/`
5. Configures test results to `./suites/${PACKAGE}/test-results/`
6. Starts Storybook from the correct package location
7. Runs only tests for that package

### 3. Snapshot Storage

Snapshots are stored **alongside tests** for each package:

```
suites/yaboujee/__snapshots__/alert.visual.spec.ts/
  ├── alert-default.png
  ├── alert-dark.png
  └── alert-mobile-dark.png
```

**Benefits:**
- Easy to see which package owns which snapshots
- No conflicts between packages
- Clear organization in git diffs

## Configuration Flow

```
playwright.config.ts
  ↓
Reads PACKAGE env var (required)
  ↓
Determines package location (packages/ or apps/)
  ↓
testDir: ./suites/${PACKAGE}/tests
snapshotPathTemplate: ./suites/${PACKAGE}/__snapshots__/{testFilePath}/{arg}{ext}
reporter: ./suites/${PACKAGE}/playwright-report
outputDir: ./suites/${PACKAGE}/test-results
  ↓
webServer.command: cd ../../${location}/${PACKAGE} && pnpm storybook
```

## Adding New Packages

1. Ensure package has Storybook configured
2. Add VRT stories with `visual-regression` tag
3. Generate tests: `pnpm generate --package {name}`
4. (Optional) Add convenience scripts to `package.json`:
   ```json
   "test:mypackage": "PACKAGE=mypackage playwright test"
   ```
5. Run tests: `pnpm test:mypackage`

## URL Generation

Stories with globals are converted to URLs with query parameters:

**Story:**
```typescript
export const MobileDark: StoryObj = {
  globals: {
    theme: "dark",
    viewport: { value: "mobile1" }
  }
};
```

**Generated URL:**
```
/iframe.html?id=story-id&viewMode=story&globals=theme:dark;viewport.value:mobile1
```

This ensures Storybook applies the correct theme and viewport when Playwright captures screenshots.

## CI/CD Considerations

In CI, set `CI=true` to enable:
- Stricter retries (2 attempts)
- Single worker (no parallelization)
- No server reuse (fresh Storybook each time)

Example GitHub Actions:
```yaml
- name: Run VRT for yaboujee
  run: pnpm vrt:yaboujee
  env:
    CI: true

- name: Run VRT for frontend  
  run: pnpm vrt:frontend
  env:
    CI: true
```

## Performance Tips

1. **Parallel packages**: Run different package VRTs in parallel CI jobs
2. **Snapshot updates**: Only update when visuals intentionally change
3. **Story organization**: Group related variants to reduce test count
4. **Reuse server**: In development, keep Storybook running between test runs
