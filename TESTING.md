# Testing Setup

This monorepo uses different testing strategies for different package types.

## Backend Packages & Core Libraries

Testing with **Vitest** for unit and integration tests.

### Packages with Vitest

- `@pubint/core` - Core types and utilities
- `@pubint/llm` - LLM integration
- `@pubint/pdf` - PDF processing
- `@pubint/index-pdf-backend` - Backend API

### Running Tests

```bash
# Run all tests across all packages
pnpm test

# Run tests in a specific package
cd packages/core
pnpm test

# Run tests in watch mode (for development)
cd packages/core
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# View interactive test UI (from root)
pnpm test:ui
```

### Test File Location

Test files are co-located with source files:
```
packages/core/src/
├── index.ts
└── index.test.ts
```

### Writing Tests

Tests use Vitest's API:

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "./index";

describe("myFunction", () => {
  it("should do something", () => {
    const result = myFunction({ input: "test" });
    expect(result).toBe("expected");
  });
});
```

## Frontend Package

Testing with **Storybook** for component development and documentation, plus **Playwright** for visual regression testing.

### Package

- `@pubint/index-pdf-frontend` - Next.js frontend

### Running Storybook

```bash
# From root (recommended)
pnpm storybook
pnpm build-storybook

# Or from the frontend directory
cd apps/index-pdf-frontend
pnpm storybook
pnpm build-storybook
```

### Story Types

Each component has three types of stories:

#### 1. Documentation Stories (`component.stories.tsx`)
Main component showcase and documentation

#### 2. Interaction Test Stories (`tests/interaction-tests.stories.tsx`)
Stories with `play` functions testing component behavior
- Tagged with `interaction-test`
- Uses `@storybook/test` for assertions

#### 3. Visual Regression Test Stories (`tests/visual-regression-tests.stories.tsx`)
Stories specifically for Playwright visual testing
- Tagged with `visual-regression`
- Tests all visual variants and edge cases

### Component Visual Regression Tests (Storybook)

Playwright test files are **auto-generated** from VRT stories:

```bash
# Generate Playwright tests from VRT stories
pnpm generate:visual-tests
```

This scans all `visual-regression-tests.stories.tsx` files and creates corresponding `playwright/vrt/*.visual.spec.ts` files.

**Workflow:**
1. Create/update VRT stories in Storybook
2. Run `pnpm generate:visual-tests` to generate Playwright tests
3. Run `pnpm test:vrt` to execute the tests

See [VISUAL_TEST_GENERATOR.md](./apps/index-pdf-frontend/VISUAL_TEST_GENERATOR.md) for details.

### Running Component VRT Tests

```bash
# From root (recommended)
pnpm test:vrt
pnpm test:vrt:ui
pnpm test:vrt:update

# Or from the frontend directory
cd apps/index-pdf-frontend
pnpm test:vrt
pnpm test:vrt:ui
pnpm test:vrt:update
```

### End-to-End Tests (Next.js App)

E2E tests run against your actual Next.js application:

```bash
# From root (recommended)
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:headed

# Or from the frontend directory
cd apps/index-pdf-frontend
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:headed
```

### Component Structure

```
src/components/card/
├── card.tsx              # Component implementation
├── index.ts              # Exports
└── stories/
    ├── card.stories.tsx  # Documentation stories
    ├── shared.tsx        # Shared fixtures
    └── tests/
        ├── interaction-tests.stories.tsx
        └── visual-regression-tests.stories.tsx
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory at both:
- Root level (aggregated)
- Individual package level

Coverage directories are git-ignored.

## CI/CD Recommendations

```yaml
# Run all backend tests
- pnpm test

# Run with coverage
- pnpm test:coverage

# Build Storybook
- pnpm build-storybook

# Run component visual regression tests
- pnpm test:vrt

# Run E2E tests
- pnpm test:e2e
```

## Test Configuration Files

- `vitest.config.ts` - Vitest configuration at root
- `apps/index-pdf-frontend/playwright.config.ts` - Playwright configuration
- `apps/index-pdf-frontend/.storybook/` - Storybook configuration

## Best Practices

### Vitest (Backend)
1. Co-locate tests with source files
2. Use descriptive test names
3. Test edge cases and error handling
4. Aim for high coverage on critical paths
5. Use single object parameters for functions

### Storybook (Frontend)
1. Separate documentation, interaction, and visual tests
2. Use shared fixtures in `shared.tsx`
3. Tag stories appropriately
4. Cover all component variants
5. Test accessibility with `@storybook/addon-a11y`

### Playwright (Visual Regression)
1. Only test stories tagged with `visual-regression`
2. Test different viewports and themes
3. Update snapshots intentionally
4. Review visual diffs carefully
5. Keep tests deterministic

## Further Reading

- [Vitest Documentation](https://vitest.dev/)
- [Storybook Documentation](https://storybook.js.org/)
- [Playwright Documentation](https://playwright.dev/)
- Frontend-specific docs: `apps/index-pdf-frontend/STORYBOOK.md`
