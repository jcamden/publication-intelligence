# Styling Architecture

This document explains how the styling system works in Pixel.

## Overview

The Pixel design system uses a layered approach to styling:

```
Design Tokens (TypeScript + CSS vars)
  ↓
Tailwind Configuration (reads tokens)
  ↓
CSS Cascade Layers (organized styling)
  ↓
BaseUI Components (accessible primitives)
  ↓
Pixel Components (styled wrappers)
```

## 1. Design Tokens

Tokens are defined in two places:

### TypeScript Tokens (`src/tokens/`)

```typescript
// src/tokens/colors.ts
export const colors = {
  primary: {
    light: "220 90% 56%",
    DEFAULT: "220 90% 56%",
    dark: "220 90% 46%",
  },
  // ...
};
```

These are imported by:
- Tailwind config (for utility classes)
- BaseUI theme (for component theming)
- TypeScript code (for programmatic access)

### CSS Custom Properties (`src/styles/index.css`)

```css
@layer tokens {
  :root,
  [data-theme="light"] {
    --color-primary: 220 90% 56%;
    --color-primary-light: 220 90% 66%;
    --color-primary-dark: 220 90% 46%;
    /* ... */
  }

  [data-theme="dark"] {
    --color-primary: 220 90% 56%;
    /* Different surface/text colors */
    --color-background: 0 0% 4%;
    --color-text: 0 0% 98%;
    /* ... */
  }
}
```

## 2. Tailwind Configuration

Tailwind reads the TypeScript tokens to generate utilities:

```typescript
// tailwind.config.ts
import { colors, spacing, radius } from "./src/tokens";

const config: Config = {
  theme: {
    extend: {
      colors: {
        primary: {
          light: `hsl(${colors.primary.light})`,
          DEFAULT: `hsl(${colors.primary.DEFAULT})`,
          dark: `hsl(${colors.primary.dark})`,
        },
        // CSS var references for theme-aware colors
        background: "hsl(var(--color-background))",
        text: "hsl(var(--color-text))",
      },
      spacing,
      borderRadius: radius,
    },
  },
};
```

This generates utilities like:
- `bg-primary` → `background: hsl(220 90% 56%)`
- `bg-background` → `background: hsl(var(--color-background))` (theme-aware!)
- `px-4` → `padding-left: 16px; padding-right: 16px;`

## 3. CSS Cascade Layers

We use CSS layers to control specificity:

```css
@layer reset, base, tokens, components, utilities, overrides;

@tailwind base;      /* Goes in 'base' layer */
@tailwind components; /* Goes in 'components' layer */
@tailwind utilities;  /* Goes in 'utilities' layer */

@layer tokens {
  /* All CSS custom properties */
}
```

**Benefits:**
- Predictable override behavior
- No specificity wars
- Easy to reason about
- Users can add `@layer overrides` to override anything

## 4. BaseUI Components

BaseUI provides unstyled, accessible components:

```tsx
import { Button as BaseButton } from "@base-ui/react/button";

// BaseButton has ARIA, keyboard nav, focus management, but no styles
```

## 5. Pixel Components

We wrap BaseUI with our styling system:

```tsx
export const Button = ({ variant = "primary", size = "md", ...props }) => {
  const classes = cn(
    "base-classes",
    variantClasses[variant],  // Uses CSS vars
    sizeClasses[size],
    props.className
  );

  return <BaseButton className={classes} {...props} />;
};
```

## Color System Details

### HSL Format

All colors use HSL (Hue, Saturation, Lightness) format:

```
220 90% 56%
│   │   └─ Lightness
│   └───── Saturation
└───────── Hue
```

**Why HSL?**
- Easier to create variations (lighter/darker)
- Semantic color adjustments
- Better for dark mode transitions

### Using Colors in Components

```tsx
// ✅ GOOD: Theme-aware via CSS var
"bg-[hsl(var(--color-primary))]"
"text-[hsl(var(--color-text))]"

// ✅ GOOD: Direct Tailwind utility (theme-aware)
"bg-background"
"text-text-secondary"

// ⚠️ OK: Fixed color (not theme-aware)
"bg-primary"

// ❌ BAD: Hardcoded color
"bg-blue-600"
"#3b82f6"
```

## Theme Switching

### How It Works

1. Theme is controlled by `data-theme` attribute:
   ```tsx
   <div data-theme="dark">
     <Button>I'm dark mode</Button>
   </div>
   ```

2. CSS custom properties change based on theme:
   ```css
   [data-theme="light"] {
     --color-background: 0 0% 100%; /* white */
   }
   [data-theme="dark"] {
     --color-background: 0 0% 4%; /* almost black */
   }
   ```

3. Components using `var(--color-*)` automatically update

### Implementing Theme Toggle

```tsx
const [theme, setTheme] = useState<"light" | "dark">("light");

return (
  <div data-theme={theme}>
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      Toggle Theme
    </button>
    {/* All Pixel components here will respect the theme */}
  </div>
);
```

## Storybook Integration

Storybook includes theme switching via decorator:

```tsx
// .storybook/preview.ts
decorators: [
  (Story, context) => {
    const theme = context.globals.theme || "light";
    return (
      <div data-theme={theme}>
        <Story />
      </div>
    );
  },
],
```

This adds a theme switcher toolbar in Storybook.

## Best Practices

### DO:
- ✅ Use CSS custom properties for theme-aware values
- ✅ Use Tailwind utilities where possible
- ✅ Reference tokens via imports, not hardcoded values
- ✅ Test components in both light and dark themes
- ✅ Use semantic color names (`--color-error` not `--color-red`)

### DON'T:
- ❌ Hardcode colors, spacing, or other token values
- ❌ Use `!important` (use cascade layers instead)
- ❌ Create custom CSS when Tailwind utilities exist
- ❌ Override BaseUI internals (extend, don't modify)

## Adding New Tokens

1. **Add to TypeScript:**
   ```typescript
   // src/tokens/colors.ts
   export const colors = {
     // ...
     tertiary: {
       light: "150 60% 60%",
       DEFAULT: "150 60% 50%",
       dark: "150 60% 40%",
     },
   };
   ```

2. **Add to CSS variables:**
   ```css
   /* src/styles/index.css */
   @layer tokens {
     :root {
       --color-tertiary: 150 60% 50%;
       --color-tertiary-light: 150 60% 60%;
       --color-tertiary-dark: 150 60% 40%;
     }
   }
   ```

3. **Add to Tailwind config:**
   ```typescript
   // tailwind.config.ts
   colors: {
     tertiary: {
       light: `hsl(${colors.tertiary.light})`,
       DEFAULT: `hsl(${colors.tertiary.DEFAULT})`,
       dark: `hsl(${colors.tertiary.dark})`,
     },
   }
   ```

4. **Update BaseUI theme if needed:**
   ```typescript
   // src/theme/baseui-theme.ts
   export const baseuiTheme = {
     colors: {
       tertiary: `hsl(${colors.tertiary.DEFAULT})`,
     },
   };
   ```

## Debugging Styles

### Check computed styles:
```javascript
// In browser console
const el = document.querySelector('[data-testid="button"]');
console.log(window.getComputedStyle(el).backgroundColor);
console.log(getComputedStyle(el).getPropertyValue('--color-primary'));
```

### Verify layer order:
```css
/* Inspect which layer a style comes from */
@layer utilities {
  .debug { background: red !important; }
}
```

### Check theme:
```javascript
// In browser console
document.documentElement.getAttribute('data-theme');
```

## Performance Considerations

- CSS variables are fast (native browser feature)
- Tailwind generates minimal CSS (purges unused)
- Cascade layers have no performance impact
- BaseUI components are lightweight

## Migration Guide

### From hardcoded colors:
```tsx
// BEFORE
<button className="bg-blue-600 text-white">

// AFTER
<button className="bg-[hsl(var(--color-primary))] text-white">
```

### From custom CSS:
```tsx
// BEFORE
<button style={{ backgroundColor: '#3b82f6' }}>

// AFTER
<button className="bg-primary">
```

### From CSS modules:
```tsx
// BEFORE
import styles from './Button.module.css';
<button className={styles.button}>

// AFTER
import { Button } from '@pubint/pixel';
<Button variant="primary">
```
