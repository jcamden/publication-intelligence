# Migration Guide

## Migrating from `index-pdf-frontend/playwright/vrt` to `@pubint/storybook-vrt`

This guide helps you transition from the old per-app VRT setup to the centralized package.

### What Changed?

**Before:**
- VRT tests lived in `apps/index-pdf-frontend/playwright/vrt/`
- Each app had its own generate script and config
- Snapshots mixed with test files

**After:**
- Centralized VRT in `packages/storybook-vrt/`
- Single generate script works for any package
- Snapshots organized by package in `suites/{package}/__snapshots__/`
- Test files auto-generated in `suites/{package}/tests/` (git-ignored)
- Reports and results in package-specific directories (git-ignored)
- Clean separation: e2e stays in apps, component VRT is shared

### Step-by-Step Migration

#### 1. Install Dependencies (Workspace Root)

```bash
pnpm install
cd packages/storybook-vrt
pnpm exec playwright install chromium
```

#### 2. Generate Tests and Capture Snapshots

One command does it all!

```bash
# For yaboujee:
pnpm vrt:yaboujee:update

# For index-pdf-frontend:
pnpm vrt:frontend:update
```

This will:
- Generate Playwright tests from your VRT stories
- Start Storybook automatically
- Capture initial snapshots

#### 3. Update Your Workflow

**Old commands:**
```bash
cd apps/index-pdf-frontend
pnpm generate:visual-tests
pnpm test:vrt
```

**New commands:**
```bash
# From workspace root - single command!
pnpm vrt:frontend          # Generate + run tests
pnpm vrt:frontend:ui       # Generate + UI mode
pnpm vrt:frontend:update   # Generate + update snapshots
```

No need to manually generate first - it's automatic!

#### 5. (Optional) Clean Up Old Files

Once you've verified the new setup works:

```bash
# Keep e2e tests, remove old VRT
rm -rf apps/index-pdf-frontend/playwright/vrt/
```

Keep:
- `apps/index-pdf-frontend/playwright/e2e/` - these are real e2e tests
- `apps/index-pdf-frontend/playwright/e2e.config.ts` - for e2e config

### Script Changes

Update your `package.json` scripts:

**Old:**
```json
{
  "scripts": {
    "generate:visual-tests": "tsx playwright/vrt/generate-visual-tests.ts",
    "test:vrt": "playwright test -c playwright/vrt/vrt.config.ts"
  }
}
```

**New:**
```json
{
  "scripts": {
    "test:e2e": "playwright test -c playwright/e2e/e2e.config.ts"
  }
}
```

VRT now runs from the centralized package!

### Benefits

✅ **One source of truth** for component VRT  
✅ **Easier to maintain** - update one script, benefits all packages  
✅ **Clear separation** - e2e vs component testing  
✅ **Better organization** - snapshots grouped by package  
✅ **Reusable** - add new packages without duplicating setup

### Troubleshooting

**"No stories found"**
- Check your package name matches: `packages/{name}` or `apps/{name}`
- Ensure stories are named `visual-regression-tests.stories.tsx`

**"Storybook not starting"**
- Verify the package has Storybook configured
- Check port 6006 is available (or set `PORT=6007`)

**"Snapshots don't match"**
- Run `pnpm vrt:{package}:ui` to see diffs (e.g., `pnpm vrt:yaboujee:ui`)
- Update intentional changes with `pnpm vrt:{package}:update`

**"PACKAGE environment variable is required"**
- Use convenience scripts: `pnpm vrt:yaboujee` or `pnpm vrt:frontend`
- Or set PACKAGE explicitly: `PACKAGE=yaboujee pnpm test:vrt`
