# Tailwind CSS v4 + Base UI Setup

## What We've Configured

### 1. Dependencies
- `tailwindcss@4.1.18` - CSS framework
- `postcss@8.5.6` - CSS processor (for Vite)
- `autoprefixer@10.4.23` - Browser compatibility
- `@base-ui/react@1.1.0` - Headless UI components

### 2. Tailwind CSS Configuration

#### File: `src/app/globals.css`
```css
@import "tailwindcss";
@source "../";  // Tells Tailwind to scan src directory for classes

@layer base {
  // Custom base styles
}
```

#### Imported In:
- `src/app/layout.tsx` - For Next.js app
- `.storybook/preview.ts` - For Storybook

### 3. Components Created

#### Card Component (Tailwind only)
- Location: `src/components/card/`
- Uses Tailwind utility classes for styling
- Props: `elevation`, `className`, `children`

#### Button Component (Base UI + Tailwind)
- Location: `src/components/button/`
- Built on `@base-ui/react/button`
- Uses Tailwind for visual styling
- Props: `variant`, `size`, `disabled`, `className`, `onClick`
- Variants: primary, secondary, outline, ghost
- Sizes: sm, md, lg

### 4. Storybook Stories

#### Regular Stories
- `button.stories.tsx` - Interactive documentation
- `card.stories.tsx` - Interactive documentation

#### Test Stories
- `interaction-tests.stories.tsx` - User interaction tests
- `visual-regression-tests.stories.tsx` - Visual regression tests

## Key Configuration Files

### `.storybook/main.ts`
Must include the Tailwind Vite plugin:
```typescript
import tailwindcss from '@tailwindcss/vite';

async viteFinal(config) {
  config.plugins = config.plugins || [];
  config.plugins.push(tailwindcss());
  return config;
}
```

### `next.config.ts`
Must include the Tailwind Vite plugin:
```typescript
import tailwindcss from "@tailwindcss/vite";

const nextConfig: NextConfig = {
  experimental: {
    vitePlugins: [tailwindcss()],
  },
};
```

## Troubleshooting Tailwind Styles

### If styles aren't appearing:

1. **Verify Vite plugin is configured**
   - Check `.storybook/main.ts` has `viteFinal` with `tailwindcss()` plugin
   - Check `next.config.ts` has `vitePlugins: [tailwindcss()]`

2. **Restart Storybook**
   ```bash
   # Stop current Storybook (Ctrl+C in terminal)
   pnpm run storybook
   ```

3. **Verify CSS is loaded**
   - Open browser DevTools (F12)
   - Check "Network" tab for `globals.css` being loaded
   - Check "Elements" tab and inspect a button element
   - Look for Tailwind utility classes being applied

4. **Check for build errors**
   ```bash
   pnpm run build-storybook
   ```
   Look for any CSS or PostCSS errors

### Common Issues

#### Issue: Times font (serif) instead of sans-serif
- **Cause**: Tailwind base styles not loading
- **Fix**: Ensure `globals.css` is imported in `preview.ts`
- **Check**: Look for `@import "tailwindcss";` in globals.css

#### Issue: Utility classes not working
- **Cause**: Tailwind not scanning component files
- **Fix**: Add/verify `@source "../";` in globals.css
- **Check**: Run `pnpm run build` to see if CSS is generated

#### Issue: Styles work in app but not Storybook
- **Cause**: CSS not imported in Storybook preview
- **Fix**: Verify `.storybook/preview.ts` imports `../src/app/globals.css`

## Testing

### Visual Regression Tests
```bash
# Generate and run VRT
pnpm run test:vrt

# Update snapshots after intentional changes
pnpm run test:vrt:update
```

### E2E Tests
```bash
pnpm run test:e2e
```

## Tailwind v4 vs v3 Differences

### v4 (Current Setup)
- ✅ No `tailwind.config.js` needed
- ✅ Configuration via CSS (`@source`, `@theme`)
- ✅ Import via `@import "tailwindcss";`
- ✅ Auto-detection of source files

### v3 (Old Way - Don't Use)
- ❌ Required `tailwind.config.js`
- ❌ Required `@tailwind` directives
- ❌ Manual content path configuration

## Next Steps

If you need to customize Tailwind:
- Add `@theme` directives in `globals.css` for custom colors, fonts, etc.
- Add `@utility` directives for custom utility classes
- See: https://tailwindcss.com/docs/functions-and-directives
