# Playwright Test Organization

## Overview

Playwright tests are now organized by **test type** rather than being in a single directory. This separation makes it clear what each test does and allows different configurations for each type.

## New Structure

```
apps/index-pdf-frontend/
├── playwright/
│   ├── vrt/                          # Component Visual Regression Tests
│   │   ├── vrt.config.ts             # VRT configuration
│   │   ├── generate-visual-tests.ts  # Generator script
│   │   └── tests/
│   │       ├── card.visual.spec.ts       # Auto-generated from VRT stories
│   │       └── _TEMPLATE.visual.spec.ts  # Template for custom tests
│   ├── e2e/                          # End-to-End Tests
│   │   ├── e2e.config.ts             # E2E configuration
│   │   └── tests/
│   │       └── homepage.spec.ts          # Manual E2E tests
│   └── README.md                     # Organization guide
```

## Two Test Types

### 1. Component Visual Regression Tests (`vrt/`)

**Purpose:** Test isolated components through Storybook  
**Target:** Storybook at `http://localhost:6006`  
**Generation:** Auto-generated from `visual-regression-tests.stories.tsx`  
**Config:** `vrt/vrt.config.ts`

```bash
pnpm test:vrt           # Run tests
pnpm test:vrt:ui        # Interactive mode
pnpm test:vrt:update    # Update snapshots
```

### 2. End-to-End Tests (`e2e/`)

**Purpose:** Test complete user workflows  
**Target:** Next.js app at `http://localhost:3000`  
**Generation:** Manually written  
**Config:** `e2e/e2e.config.ts`

```bash
pnpm test:e2e           # Run tests
pnpm test:e2e:ui        # Interactive mode
pnpm test:e2e:headed    # See the browser
```

## Commands Changed

| Old Command | New Command | Purpose |
|-------------|-------------|---------|
| `pnpm test:visual` | `pnpm test:vrt` | Run component VRT |
| `pnpm test:visual:ui` | `pnpm test:vrt:ui` | Interactive VRT |
| `pnpm test:visual:update` | `pnpm test:vrt:update` | Update VRT snapshots |
| N/A | `pnpm test:e2e` | Run E2E tests |
| N/A | `pnpm test:e2e:ui` | Interactive E2E |
| N/A | `pnpm test:e2e:headed` | E2E with visible browser |

## Generator Location

The visual test generator is colocated with VRT tests:

- **Location:** `playwright/vrt/generate-visual-tests.ts`
- **Command:** `pnpm generate:visual-tests`
- **Output:** `playwright/vrt/tests/*.visual.spec.ts`

## Snapshot Locations

Snapshots are organized by test type in their respective `tests/` directories:

```
playwright/
├── vrt/tests/
│   └── card.visual.spec.ts-snapshots/
│       └── chromium/
│           ├── card-empty.png
│           └── card-with-elevation.png
└── e2e/tests/
    └── homepage.spec.ts-snapshots/
        └── chromium/
            └── homepage-loaded.png
```

## Why This Organization?

### Clear Separation
- VRT tests focus on component visuals
- E2E tests focus on user workflows
- No confusion about what each test does

### Different Configs
- VRT: Single browser (Chromium), starts Storybook
- E2E: Multiple browsers, builds and starts Next.js

### Scalability
- Easy to add more E2E tests
- Auto-generated VRT tests keep growing
- Each type can evolve independently

### CI/CD Flexibility
- Run VRT quickly for component changes
- Run E2E for integration testing
- Different retry strategies and timeouts

## Migration Notes

If you had existing Playwright tests:

1. **VRT tests** (testing Storybook) → move to `vrt/`
2. **E2E tests** (testing app) → move to `e2e/`
3. Update imports and configs accordingly
4. Regenerate VRT tests: `pnpm generate:visual-tests`

## Next Steps

1. **Component changes?** → Update VRT stories → regenerate → `pnpm test:vrt`
2. **Feature changes?** → Write E2E test → `pnpm test:e2e`
3. **Both?** → Do both! They test different things

See `playwright/README.md` for detailed information on each test type.
