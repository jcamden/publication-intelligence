# Pixel Design System - Usage Examples

## Setup

### 1. Install the package

Already set up in your monorepo with workspace protocol:

```json
{
  "dependencies": {
    "@pubint/pixel": "workspace:*"
  }
}
```

### 2. Import styles

In your app's root CSS file (e.g., `globals.css`):

```css
@import "tailwindcss";
@import "@pubint/pixel/styles";
```

### 3. Import components

```tsx
import { Button, Input, Modal } from "@pubint/pixel";
```

## Component Examples

### Button Component

```tsx
import { Button } from "@pubint/pixel";

// Primary button
<Button variant="primary" size="md" onClick={handleClick}>
  Submit
</Button>

// Loading state
<Button variant="primary" disabled={isLoading}>
  {isLoading ? "Loading..." : "Submit"}
</Button>

// Danger button for destructive actions
<Button variant="danger" size="lg">
  Delete Account
</Button>

// Ghost button for tertiary actions
<Button variant="ghost" size="sm">
  Cancel
</Button>

// Outline button
<Button variant="outline" onClick={handleSecondaryAction}>
  Learn More
</Button>
```

### Input Component

```tsx
import { Input } from "@pubint/pixel";
import { useState } from "react";

function MyForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="space-y-4">
      {/* Basic input */}
      <Input
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        size="md"
      />

      {/* Password input */}
      <Input
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="Enter password"
        size="md"
      />

      {/* Input with error state */}
      <Input
        type="text"
        variant="error"
        value={error}
        onChange={setError}
        placeholder="This field has an error"
      />

      {/* Input with success state */}
      <Input
        variant="success"
        value="valid@email.com"
        onChange={() => {}}
        placeholder="Valid email"
      />

      {/* Disabled input */}
      <Input
        disabled
        value="Cannot edit this"
        onChange={() => {}}
      />
    </div>
  );
}
```

### Modal Component

```tsx
import { Modal, Button } from "@pubint/pixel";
import { useState } from "react";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Open Modal
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirm}>
              Confirm
            </Button>
          </>
        }
      >
        <p>Are you sure you want to proceed?</p>
      </Modal>
    </>
  );
}
```

### Complete Form Example

```tsx
import { Button, Input } from "@pubint/pixel";
import { useState } from "react";

function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await submitForm({ email, password });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-text mb-1"
        >
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-text mb-1"
        >
          Password
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Min 8 characters"
          required
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? "Loading..." : "Sign In"}
      </Button>
    </form>
  );
}
```

## Theming

### Light/Dark Mode Toggle

```tsx
import { useState } from "react";
import { Button } from "@pubint/pixel";

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <div data-theme={theme}>
      <Button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
        Toggle {theme === "light" ? "Dark" : "Light"} Mode
      </Button>
      
      {/* All Pixel components here will respect the theme */}
    </div>
  );
}
```

### Using Theme with System Preference

```tsx
import { useEffect, useState } from "react";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(mediaQuery.matches ? "dark" : "light");

    const handler = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return { theme, setTheme };
}

function App() {
  const { theme } = useTheme();

  return <div data-theme={theme}>{/* Your app */}</div>;
}
```

## Using Design Tokens

### In TypeScript/JavaScript

```tsx
import { colors, spacing, radius, typography } from "@pubint/pixel";

// Use tokens programmatically
const myStyles = {
  backgroundColor: `hsl(${colors.primary.DEFAULT})`,
  padding: spacing[4],
  borderRadius: radius.md,
  fontSize: typography.fontSize.lg[0],
};
```

### In CSS

```css
.my-component {
  /* Use CSS custom properties */
  background: hsl(var(--color-primary));
  color: hsl(var(--color-text));
  padding: var(--spacing-4);
  border-radius: var(--radius-md);
  
  /* Theme-aware colors automatically switch */
  border: 1px solid hsl(var(--color-border));
}
```

### With Tailwind

```tsx
// Tailwind utilities read from the same tokens
<div className="bg-primary text-white p-4 rounded-lg">
  Styled with Tailwind + Pixel tokens
</div>

// Theme-aware utilities
<div className="bg-background text-text border border-border">
  Automatically switches with theme
</div>
```

## TypeScript Support

All components are fully typed:

```tsx
import type { ButtonProps, ButtonVariant, ButtonSize } from "@pubint/pixel";

// Type-safe props
const buttonProps: ButtonProps = {
  variant: "primary", // Type error if invalid
  size: "md",
  onClick: () => console.log("clicked"),
};

// Use types in your own components
type MyComponentProps = {
  buttonVariant: ButtonVariant; // "primary" | "secondary" | "outline" | "ghost" | "danger"
  buttonSize: ButtonSize; // "sm" | "md" | "lg"
};
```

## Custom Styling

### Extending Components

```tsx
// Add custom classes via className prop
<Button
  variant="primary"
  className="shadow-2xl hover:scale-105 transition-transform"
>
  Custom Styled Button
</Button>

// Compose with Tailwind
<Input
  variant="default"
  className="border-2 border-dashed"
/>
```

### Overriding Styles

Use the `@layer overrides` in your CSS:

```css
@layer overrides {
  /* Override any Pixel styles */
  .my-custom-button {
    /* Your custom styles here */
  }
}
```

## Best Practices

1. **Always use the Input component's `onChange` prop**: It receives the string value directly, not the event
   ```tsx
   // ✅ Correct
   <Input value={text} onChange={setText} />
   
   // ❌ Wrong
   <Input value={text} onChange={(e) => setText(e.target.value)} />
   ```

2. **Use semantic variants**: Choose the variant that matches the action's meaning
   ```tsx
   <Button variant="primary">Submit Form</Button>
   <Button variant="danger">Delete Account</Button>
   <Button variant="outline">Secondary Action</Button>
   <Button variant="ghost">Cancel</Button>
   ```

3. **Leverage theme tokens**: Use CSS variables for theme-aware styling
   ```tsx
   <div className="bg-surface text-text border-border">
     This adapts to light/dark mode automatically
   </div>
   ```

4. **Keep modals controlled**: Always manage Modal state externally
   ```tsx
   const [open, setOpen] = useState(false);
   <Modal open={open} onClose={() => setOpen(false)} />
   ```

5. **Use appropriate sizes**: Match component sizes to their context
   ```tsx
   <Button size="sm">Inline action</Button>
   <Button size="md">Standard button</Button>
   <Button size="lg">Primary CTA</Button>
   ```

## Accessibility

All components follow accessibility best practices:

- ✅ Proper ARIA attributes
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Color contrast (WCAG AA)
- ✅ Screen reader support

Always add proper labels to form inputs:

```tsx
<label htmlFor="email" className="block text-sm font-medium mb-1">
  Email
</label>
<Input id="email" type="email" value={email} onChange={setEmail} />
```

## Next Steps

- Explore components in Storybook: `cd packages/pixel && pnpm storybook`
- Read component documentation in `COMPONENT_PATTERN.md`
- Understand styling architecture in `STYLING_ARCHITECTURE.md`
- Check `README.md` for full API reference
