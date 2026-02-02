# Dark Mode

## Implementation

- Attribute-based: `data-theme="light|dark"` on `<html>`
- CSS variables in `@theme` (light defaults) + `[data-theme="dark"]` overrides
- System preference + localStorage
- Inline script prevents FOUC

## Locations

- `packages/yaboujee/.storybook/preview.tsx` - Theme decorator
- `apps/index-pdf-frontend/.storybook/preview.ts` - Same decorator
- `apps/index-pdf-frontend/src/_common/_providers/theme-provider.tsx` - React context
- `apps/index-pdf-frontend/src/_common/_lib/theme-script.tsx` - FOUC prevention

## Usage

### Hook
```tsx
import { useTheme } from "@/app/_common/_providers/theme-provider";

const { theme, resolvedTheme, setTheme } = useTheme();
setTheme({ theme: theme === "dark" ? "light" : "dark" });
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
