# Quick Start Guide

## Initial Setup

1. **Install dependencies** (from workspace root):
   ```bash
   pnpm install
   ```

2. **Install Playwright browsers**:
   ```bash
   cd packages/storybook-vrt
   pnpm exec playwright install chromium
   ```

## Running VRT for the First Time

### For `yaboujee` components:

```bash
# From workspace root - one command does it all!
pnpm vrt:yaboujee:update
```

This will:
1. Generate Playwright tests from Storybook stories
2. Start Storybook automatically
3. Capture initial snapshots

### For `index-pdf-frontend` components:

```bash
# From workspace root
pnpm vrt:frontend:update
```

## Daily Workflow

### After adding/modifying VRT stories:

```bash
# Generate tests + run VRT (one command!)
pnpm vrt:yaboujee

# Or use interactive UI mode to review changes
pnpm vrt:yaboujee:ui
```

### Update snapshots after intentional visual changes:

```bash
pnpm vrt:yaboujee:update
# or
pnpm vrt:frontend:update
```

## Available Commands

From workspace root:

- `pnpm vrt:yaboujee` - Generate + run tests
- `pnpm vrt:yaboujee:ui` - Generate + run with UI
- `pnpm vrt:yaboujee:update` - Generate + update snapshots
- `pnpm vrt:frontend` - Generate + run frontend tests
- `pnpm vrt:frontend:ui` - Generate + run frontend with UI
- `pnpm vrt:frontend:update` - Generate + update frontend snapshots

## Directory Structure

After running, you'll see:

```
packages/storybook-vrt/
└── suites/
    ├── yaboujee/
    │   ├── tests/                          # Git-ignored, auto-generated
    │   │   ├── alert.visual.spec.ts
    │   │   ├── form-footer.visual.spec.ts
    │   │   └── landing-navbar.visual.spec.ts
    │   ├── __snapshots__/                  # Committed to git
    │   │   └── alert.visual.spec.ts/
    │   │       ├── alert-default.png
    │   │       └── alert-dark.png
    │   ├── playwright-report/              # Git-ignored
    │   └── test-results/                   # Git-ignored
    └── index-pdf-frontend/
        ├── tests/                          # Git-ignored, auto-generated
        │   ├── button.visual.spec.ts
        │   └── card.visual.spec.ts
        ├── __snapshots__/                  # Committed to git
        │   └── button.visual.spec.ts/
        │       └── button-primary.png
        ├── playwright-report/              # Git-ignored
        └── test-results/                   # Git-ignored
```

**Note**: Test files are auto-generated and git-ignored. Snapshots are committed to the repository.

## Tips

- **Run in CI**: Set `CI=true` environment variable for stricter retries
- **Parallel execution**: Tests run in parallel by default for speed
- **Custom port**: Set `PORT=6007` if default 6006 is occupied
- **Debug failures**: Use `pnpm vrt:ui` for interactive debugging
