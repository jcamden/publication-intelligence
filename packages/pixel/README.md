# Pixel Design System

**P**ublication **I**ntelligence **X** **E**lement **L**ibrary

A comprehensive design system built with React, Tailwind CSS, Base UI, and Storybook.

## Installation

```bash
pnpm add @pubint/pixel
```

## Usage

```tsx
import { Button, Input, Modal } from "@pubint/pixel";
import "@pubint/pixel/styles";

function App() {
  return (
    <div>
      <Button variant="primary" size="md">
        Click me
      </Button>
      <Input placeholder="Enter text..." />
    </div>
  );
}
```

## Architecture

### Styling Stack

```
Tokens → CSS vars
  ↓
Tailwind config
  ↓
Utilities + layouts
  ↓
BaseUI components
  ↓
Pixel wrappers
```

### CSS Cascade Layers

The design system uses CSS cascade layers for predictable styling:

```css
@layer reset, base, tokens, components, utilities, overrides;
```

- **reset**: CSS resets
- **base**: Base element styles
- **tokens**: CSS custom properties (design tokens)
- **components**: Component-specific styles
- **utilities**: Tailwind utilities
- **overrides**: User overrides

## Design Tokens

All design tokens are defined as CSS custom properties and TypeScript constants:

### Colors

```tsx
import { colors } from "@pubint/pixel";

// Usage in code
const primary = colors.primary.DEFAULT; // "220 90% 56%"

// Usage in CSS
.element {
  background: hsl(var(--color-primary));
}
```

### Spacing

```tsx
import { spacing } from "@pubint/pixel";

// Values: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32
```

### Border Radius

```tsx
import { radius } from "@pubint/pixel";

// Values: none, sm, md, lg, xl, 2xl, full
```

### Typography

```tsx
import { typography } from "@pubint/pixel";

// fontFamily, fontSize, fontWeight
```

## Theming

The design system supports light and dark themes out of the box.

### Switching Themes

```tsx
// Use data-theme attribute
<div data-theme="dark">
  <Button>Dark mode button</Button>
</div>

<div data-theme="light">
  <Button>Light mode button</Button>
</div>
```

### BaseUI Theme

```tsx
import { baseuiTheme } from "@pubint/pixel";

// Access theme values
const primaryColor = baseuiTheme.colors.primary;
```

## Components

### Button

```tsx
<Button variant="primary" size="md" onClick={() => console.log("clicked")}>
  Click me
</Button>
```

**Variants**: primary, secondary, outline, ghost, danger  
**Sizes**: sm, md, lg

### Input

```tsx
<Input
  value={value}
  onChange={setValue}
  placeholder="Enter text..."
  variant="default"
  size="md"
/>
```

**Variants**: default, success, error, warning  
**Sizes**: sm, md, lg

### Modal

```tsx
<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md"
  footer={
    <>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary">Confirm</Button>
    </>
  }
>
  <p>Modal content</p>
</Modal>
```

**Sizes**: sm, md, lg, xl, full

## Development

### Install Dependencies

```bash
pnpm install
```

### Run Storybook

```bash
pnpm storybook
```

### Run Tests

```bash
pnpm test
```

### Build

```bash
pnpm build
```

## Accessibility

All components are built with accessibility in mind:

- ✅ Proper ARIA attributes
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ Color contrast compliance
- ✅ Screen reader support

Storybook includes the a11y addon for automated accessibility testing.

## Versioning

This package uses [Changesets](https://github.com/changesets/changesets) for version management.

### Creating a Changeset

```bash
pnpm changeset
```

### Publishing

```bash
pnpm changeset version
pnpm changeset publish
```

## Directory Structure

```
packages/pixel/
├── src/
│   ├── components/       # React components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── index.ts
│   │   │   └── stories/
│   │   │       ├── Button.stories.tsx
│   │   │       └── tests/
│   │   │           └── interaction-tests.stories.tsx
│   │   ├── Input/
│   │   └── Modal/
│   ├── tokens/          # Design tokens
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── radius.ts
│   │   ├── typography.ts
│   │   └── shadows.ts
│   ├── theme/           # Theme configuration
│   │   └── baseui-theme.ts
│   ├── styles/          # CSS
│   │   └── index.css
│   └── index.ts
├── .storybook/          # Storybook config
├── tailwind.config.ts   # Tailwind configuration
├── tsconfig.json
├── package.json
└── README.md
```

## Contributing

When adding new components:

1. Create component in `src/components/ComponentName/`
2. Add stories in `stories/ComponentName.stories.tsx`
3. Add interaction tests in `stories/tests/interaction-tests.stories.tsx`
4. Export from `src/components/index.ts`
5. Run Storybook to verify
6. Create a changeset

## License

MIT
