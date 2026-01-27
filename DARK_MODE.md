# Dark Mode Implementation

Complete dark/light mode support across the entire monorepo.

## Architecture

### Design System (Pixel)
- **CSS Variables**: All colors defined in `@theme` with light mode defaults
- **Dark Mode Override**: `[data-theme="dark"]` in `@layer tokens` overrides colors
- **Automatic**: Components automatically respond to theme changes via CSS variables

### Theme Switching
- **Attribute-based**: Uses `data-theme="light|dark"` on `<html>` element
- **System preference**: Respects `prefers-color-scheme` media query
- **Persistent**: Stores user preference in `localStorage`
- **No Flash**: Inline script prevents FOUC (Flash of Unstyled Content)

## Implementation

### 1. Pixel Storybook ✅
**Location**: `packages/pixel/.storybook/preview.tsx`

- Theme toolbar switcher in Storybook UI
- Decorator wraps stories with `data-theme` attribute
- Syncs with Storybook backgrounds

### 2. Frontend Storybook ✅
**Location**: `apps/index-pdf-frontend/.storybook/preview.ts`

- Same theme toolbar switcher
- Same decorator pattern
- Consistent with pixel Storybook

### 3. Next.js App ✅
**Components**:
- `src/providers/theme-provider.tsx` - React context for theme state
- `src/components/theme-script.tsx` - Prevents FOUC
- `src/components/theme-toggle.tsx` - UI toggle component

**Features**:
- System preference detection
- localStorage persistence
- Live system theme sync
- Type-safe `useTheme()` hook

## Usage

### In Storybooks
Use the theme toolbar button (moon/sun icon) in the top toolbar.

### In Next.js App

```tsx
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/providers/theme-provider";

// Simple toggle button
export const MyComponent = () => {
  return <ThemeToggle />;
};

// Custom implementation
export const CustomTheme = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme({ theme: theme === "dark" ? "light" : "dark" })}>
      Current: {resolvedTheme}
    </button>
  );
};
```

### Adding Dark Mode Styles

In pixel components, colors automatically adapt:

```tsx
// Component automatically works in both themes
<div className="bg-surface text-text border-border">
  {/* Colors change based on data-theme */}
</div>
```

To add custom dark mode overrides in pixel:

```css
/* packages/pixel/src/styles/index.css */
@layer tokens {
  [data-theme="dark"] {
    --color-my-custom: hsl(200 50% 60%);
  }
}
```

## Theme Values

### Light Mode (Default)
- Background: `hsl(0 0% 100%)` - white
- Surface: `hsl(0 0% 98%)` - very light gray
- Text: `hsl(0 0% 9%)` - almost black
- Border: `hsl(0 0% 90%)` - light gray

### Dark Mode
- Background: `hsl(0 0% 4%)` - almost black
- Surface: `hsl(0 0% 9%)` - dark gray
- Text: `hsl(0 0% 98%)` - almost white
- Border: `hsl(0 0% 25%)` - medium gray

All brand colors (primary, secondary, accent) remain the same in both themes for consistency.

## Testing

1. **Pixel Storybook**: http://localhost:6007 - Use toolbar to switch themes
2. **Frontend Storybook**: http://localhost:6006 - Use toolbar to switch themes
3. **Next.js App**: http://localhost:3000 - Add `<ThemeToggle />` to any page

All three environments share the same theme implementation and colors.
