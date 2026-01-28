# @pubint/storybook-config

Shared Storybook configurations, decorators, and utilities for the publication-intelligence monorepo.

## Installation

This package is internal to the monorepo and should be added as a workspace dependency:

```bash
pnpm add @pubint/storybook-config --workspace
```

## Usage

### Test Story Configurations

Use these pre-configured parameters for interaction and visual regression tests:

```typescript
import { 
  interactionTestConfig, 
  visualRegressionTestConfig 
} from "@pubint/storybook-config/configs";

// Interaction tests
export default {
  title: "Components/MyComponent/tests/Interaction Tests",
  component: MyComponent,
  tags: ["interaction-test"],
  parameters: {
    ...interactionTestConfig,
  },
} satisfies Meta<typeof MyComponent>;

// Visual regression tests
export default {
  title: "Components/MyComponent/tests/Visual Regression Tests",
  component: MyComponent,
  tags: ["visual-regression"],
  parameters: {
    ...visualRegressionTestConfig,
  },
} satisfies Meta<typeof MyComponent>;
```

### Dark Mode & Viewport

Use Storybook globals for dark mode and viewport settings (Storybook 10+ syntax):

```typescript
// Dark mode only
export const DarkMode: StoryObj<typeof MyComponent> = {
  parameters: {
    backgrounds: { default: "dark" },
  },
  globals: {
    theme: "dark",
  },
  args: { variant: "primary" },
};

// Mobile viewport only
export const MobileViewport: StoryObj<typeof MyComponent> = {
  globals: {
    viewport: { value: "mobile1" },
  },
  args: { variant: "primary" },
};

// Combined: mobile viewport + dark mode
export const MobileViewportDark: StoryObj<typeof MyComponent> = {
  parameters: {
    backgrounds: { default: "dark" },
  },
  globals: {
    theme: "dark",
    viewport: { value: "mobile1" },
  },
  args: { variant: "primary" },
};
```

**Why globals?**
- Works with Storybook's toolbar controls
- Integrates with VRT URL generation  
- Respects your `preview.tsx` global decorator
- Consistent across all stories

## Available Viewports

Common viewport values you can use:

- `mobile1` - 375px (iPhone SE)
- `mobile2` - 414px (iPhone 11 Pro Max)
- `tablet` - 768px (iPad)
- `desktop` - 1280px (Desktop)

See [Storybook's default viewports](https://storybook.js.org/docs/essentials/viewport) for more options.

## Features

- **Test Configurations**: Pre-configured parameters for interaction and visual regression tests
- **Globals-based**: Uses Storybook 10+ globals API for theme and viewport
- **Type-safe**: Full TypeScript support with proper types from Storybook
- **VRT Integration**: Globals are automatically included in Playwright VRT URLs

## Package Structure

```
src/
├── configs/
│   ├── test-configs.ts    # Test story configurations
│   └── index.ts
└── index.ts               # Main entry point
```
