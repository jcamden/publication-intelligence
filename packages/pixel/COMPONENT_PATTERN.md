# Component Development Pattern

This document outlines the established patterns for creating new components in the Pixel design system.

## Directory Structure

```
src/components/ComponentName/
├── ComponentName.tsx           # Main component file
├── index.ts                    # Public exports
└── stories/
    ├── ComponentName.stories.tsx          # Main stories
    └── tests/
        └── interaction-tests.stories.tsx  # Interaction tests
```

## Component File Pattern

```tsx
// ComponentName.tsx
import { ComponentName as BaseComponentName } from "@base-ui/react/component-name";
import type { ReactNode } from "react";

export type ComponentNameVariant = "primary" | "secondary";
export type ComponentNameSize = "sm" | "md" | "lg";

export type ComponentNameProps = {
  children?: ReactNode;
  variant?: ComponentNameVariant;
  size?: ComponentNameSize;
  disabled?: boolean;
  className?: string;
  // ... other props
};

const variantClasses: Record<ComponentNameVariant, string> = {
  primary: "styles using CSS var tokens",
  secondary: "more styles",
};

const sizeClasses: Record<ComponentNameSize, string> = {
  sm: "sizing classes",
  md: "sizing classes",
  lg: "sizing classes",
};

export const ComponentName = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
}: ComponentNameProps) => {
  const baseClasses = "shared base styles";
  const variantClass = variantClasses[variant];
  const sizeClass = sizeClasses[size];
  const classes = `${baseClasses} ${variantClass} ${sizeClass} ${className}`.trim();

  return (
    <BaseComponentName className={classes} disabled={disabled}>
      {children}
    </BaseComponentName>
  );
};
```

## Key Principles

### 1. Use CSS Custom Properties

Always reference design tokens via CSS variables:

```tsx
// ✅ GOOD
"bg-[hsl(var(--color-primary))]"
"text-[hsl(var(--color-text))]"

// ❌ BAD
"bg-blue-600"
"text-gray-900"
```

### 2. Single Object Parameter

Functions always use a single object parameter with named props:

```tsx
// ✅ GOOD
export const Component = ({ variant, size, children }: Props) => { ... }

// ❌ BAD
export const Component = (variant: string, size: string, children: ReactNode) => { ... }
```

### 3. Wrap BaseUI Components

Always wrap BaseUI components, never expose them directly:

```tsx
import { Button as BaseButton } from "@base-ui/react/button";

export const Button = ({ ...props }: ButtonProps) => {
  return <BaseButton className={classes} {...props} />;
};
```

### 4. Export Types

Always export component types alongside the component:

```tsx
// index.ts
export { ComponentName } from "./ComponentName";
export type { 
  ComponentNameProps, 
  ComponentNameVariant, 
  ComponentNameSize 
} from "./ComponentName";
```

## Stories Pattern

### Main Stories File

```tsx
// ComponentName.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { ComponentName } from "../ComponentName";

const codeBlock = `import { ComponentName } from "@pubint/pixel";

const MyComponent = () => {
  return <ComponentName variant="primary">Content</ComponentName>;
};
`;

const additionalMarkdownDescription = `
## Use cases
When to use this component...

## Variants
Description of variants...

## Accessibility
Accessibility features...
`;

export default {
  component: ComponentName,
  title: "Components/ComponentName",
  args: {
    // default args
  },
  argTypes: {
    // control configurations
  },
  parameters: {
    docs: {
      description: {
        component: \`Description...

\${additionalMarkdownDescription}

## Example Usage

\\\`\\\`\\\`tsx
\${codeBlock}
\\\`\\\`\\\`\`,
      },
    },
  },
} satisfies Meta<typeof ComponentName>;

export const Default: StoryObj<typeof ComponentName> = {
  args: {},
};

export const AllVariants: StoryObj<typeof ComponentName> = {
  render: () => (
    <div className="flex gap-4">
      {/* Show all variants */}
    </div>
  ),
};
```

### Interaction Tests Pattern

```tsx
// tests/interaction-tests.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { ComponentName } from "../../ComponentName";

export default {
  title: "Components/ComponentName/tests/Interaction Tests",
  component: ComponentName,
  tags: ["interaction-test"],
  parameters: {
    previewTabs: { "storybook/docs/panel": { hidden: true } },
    controls: {
      exclude: ["children", "variant", "size", "disabled"],
    },
  },
} satisfies Meta<typeof ComponentName>;

export const TestName: StoryObj<typeof ComponentName> = {
  render: () => <ComponentName data-testid="component">Test</ComponentName>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const element = canvas.getByTestId("component");

    await expect(element).toBeTruthy();
    await expect(element).toBeVisible();
  },
};
```

## Styling Guidelines

### CSS Cascade Layers

All styles are organized in layers:

```css
@layer reset, base, tokens, components, utilities, overrides;
```

### Theme Support

Components must work in both light and dark themes:

```tsx
// Use theme-aware CSS variables
"bg-[hsl(var(--color-background))]"  // auto-switches with theme
"border-[hsl(var(--color-border))]"
```

### Tailwind Classes

Prefer Tailwind utilities over custom CSS:

```tsx
// ✅ GOOD
"rounded-lg px-4 py-2 transition-colors"

// ❌ BAD
<style>{`
  .button {
    border-radius: 8px;
    padding: 8px 16px;
  }
`}</style>
```

## Testing Requirements

Every component must have:

1. **Main stories** - Demonstrating all variants and states
2. **Interaction tests** - Testing user interactions
3. **Visual variants story** - Showing all variants together
4. **Size variants story** - Showing all sizes together

## Accessibility Requirements

- ✅ Use semantic HTML
- ✅ Include proper ARIA attributes (via BaseUI)
- ✅ Support keyboard navigation
- ✅ Ensure color contrast meets WCAG AA
- ✅ Test with a11y addon in Storybook

## Changeset Workflow

When adding or modifying components:

```bash
# 1. Make changes
# 2. Create a changeset
pnpm changeset

# 3. Follow prompts to describe changes
# 4. Commit changeset file with your changes
```

## Adding New Components Checklist

- [ ] Create component directory structure
- [ ] Implement component wrapping BaseUI
- [ ] Use CSS variables for theming
- [ ] Export types
- [ ] Create main stories file
- [ ] Create interaction tests
- [ ] Add to `src/components/index.ts`
- [ ] Test in both light and dark themes
- [ ] Run Storybook and verify
- [ ] Create changeset
- [ ] Update main README if needed

## Example: Adding a Toast Component

```bash
# 1. Create directory
mkdir -p src/components/Toast/stories/tests

# 2. Create files
touch src/components/Toast/Toast.tsx
touch src/components/Toast/index.ts
touch src/components/Toast/stories/Toast.stories.tsx
touch src/components/Toast/stories/tests/interaction-tests.stories.tsx

# 3. Implement following the patterns above

# 4. Export in src/components/index.ts
export { Toast } from "./Toast";
export type { ToastProps, ToastVariant } from "./Toast";

# 5. Test
pnpm storybook

# 6. Create changeset
pnpm changeset
```

## Resources

- [Base UI Documentation](https://base-ui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Storybook Documentation](https://storybook.js.org/)
- [Changesets Documentation](https://github.com/changesets/changesets)
