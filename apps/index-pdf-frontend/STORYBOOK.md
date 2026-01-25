# Storybook Setup

This project uses Storybook for component development, documentation, and testing.

## Running Storybook

```bash
pnpm storybook
```

This will start Storybook at http://localhost:6006

## Building Storybook

```bash
pnpm build-storybook
```

## Story Organization

Each component follows a three-story pattern:

### 1. Documentation Stories (`component.stories.tsx`)

Main documentation and examples for the component. These stories:
- Showcase different variants and use cases
- Include component documentation
- Provide code examples
- Are visible in the docs

**Example:** `src/components/card/stories/card.stories.tsx`

### 2. Interaction Test Stories (`tests/interaction-tests.stories.tsx`)

Stories with `play` functions that test component behavior and interactions. These stories:
- Use `@storybook/test` for assertions
- Test user interactions (clicks, typing, etc.)
- Verify component state changes
- Are tagged with `interaction-test`
- Hidden from docs panel

**Example:** `src/components/card/stories/tests/interaction-tests.stories.tsx`

### 3. Visual Regression Test Stories (`tests/visual-regression-tests.stories.tsx`)

Stories designed specifically for visual regression testing with Playwright. These stories:
- Cover all visual variants
- Test different viewport sizes
- Include edge cases (long content, empty states, etc.)
- Are tagged with `visual-regression`
- Hidden from docs panel

**Example:** `src/components/card/stories/tests/visual-regression-tests.stories.tsx`

## Story Structure

Each component should follow this directory structure:

```
src/components/
└── card/
    ├── card.tsx              # Component implementation
    ├── index.ts              # Component exports
    └── stories/
        ├── card.stories.tsx  # Documentation stories
        ├── shared.tsx        # Shared fixtures and props
        └── tests/
            ├── interaction-tests.stories.tsx
            └── visual-regression-tests.stories.tsx
```

## Shared Fixtures

The `shared.tsx` file contains reusable:
- Default props
- Component variants
- Example children components
- Props maps for aggregated views

## Tags

Stories are tagged for filtering:

- `visual-regression` - Visual regression test stories (for Playwright)
- `interaction-test` - Interaction test stories (for Storybook test runner)

## Visual Regression Testing

Visual regression tests are run with Playwright against stories tagged with `visual-regression`.

### Running Visual Regression Tests

```bash
# Run all visual regression tests
pnpm test:visual

# Run with UI mode (interactive)
pnpm test:visual:ui

# Update snapshots (after intentional visual changes)
pnpm test:visual:update
```

### How It Works

1. Playwright starts Storybook automatically
2. Tests navigate to specific story URLs
3. Screenshots are captured and compared to baselines
4. Results are saved to `playwright-report/`

### Adding New Visual Tests

1. Create stories in `stories/tests/visual-regression-tests.stories.tsx`
2. Tag the meta with `visual-regression`
3. Add corresponding Playwright tests in `playwright/components/[component-name].visual.spec.ts`
4. Use story IDs in the format: `components-[component]-tests-visual-regression-tests--story-name`

### Playwright Test Organization

Tests are organized by component:

```
playwright/
└── components/
    ├── card.visual.spec.ts
    ├── button.visual.spec.ts      # Future component
    └── input.visual.spec.ts       # Future component
```

Snapshots are automatically organized:

```
playwright/
└── components/
    ├── card.visual.spec.ts-snapshots/
    │   └── chromium/
    │       ├── card-empty.png
    │       └── card-low-elevation.png
    ├── button.visual.spec.ts-snapshots/
    └── input.visual.spec.ts-snapshots/
```

## Interaction Testing

Interaction tests run automatically in Storybook using the `@storybook/addon-vitest` addon.

## Best Practices

1. **Separation of Concerns**: Keep documentation, interaction tests, and visual tests separate
2. **Shared Fixtures**: Use `shared.tsx` for reusable props and children
3. **Descriptive Names**: Use clear story names that describe what's being tested
4. **Comprehensive Coverage**: Visual regression tests should cover all variants and edge cases
5. **Accessibility**: Consider accessibility in all stories (use `@storybook/addon-a11y`)

## Example Component

See `src/components/card/` for a complete example implementing all three story types.
