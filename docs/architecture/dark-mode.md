# Dark Mode

## Implementation

- Attribute-based: `data-theme="light|dark"` on `<html>`, plus `class="dark"` for Tailwind
- CSS variables in `@theme` (light defaults) + `[data-theme="dark"]` overrides
- System preference + localStorage via [next-themes](https://github.com/pacocoursey/next-themes)
- `next-themes` injects a short inline script to prevent FOUC

## Locations

- `packages/yaboujee/.storybook/preview.tsx` - Theme decorator
- `apps/index-pdf-frontend/.storybook/preview.ts` - Same decorator
- `apps/index-pdf-frontend/src/app/_common/_config/theme-config.ts` - Shared `ThemeProvider` props (layout + Storybook)
- `apps/index-pdf-frontend/src/app/layout.tsx` - Root `ThemeProvider` from `next-themes`

## Usage

### Hook

```tsx
import { useTheme } from "next-themes";

const { theme, resolvedTheme, setTheme } = useTheme();
setTheme(resolvedTheme === "dark" ? "light" : "dark");
```

### Adding Styles

```css
/* packages/yaboujee/src/index.css */
@layer tokens {
  [data-theme="dark"] {
    --color-my-custom: hsl(200 50% 60%);
  }
}
```

Components using semantic colors (`bg-surface`, `text-text`) automatically adapt.
