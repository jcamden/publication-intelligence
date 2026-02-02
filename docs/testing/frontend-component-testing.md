# Frontend Testing

## Test Organization

```
src/components/card/
├── card.tsx
├── index.ts
└── stories/
    ├── card.stories.tsx              # Documentation stories
    ├── shared.tsx                    # Shared fixtures
    └── tests/
        ├── interaction-tests.stories.tsx    # User interactions
        └── visual-regression-tests.stories.tsx  # Visual states
```

## Patterns

### UI Components → Storybook + VRT

```typescript
// Interaction test
export const DeleteProject: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step("Click delete button", async () => {
      const deleteBtn = canvas.getByRole("button", { name: /delete/i });
      await userEvent.click(deleteBtn);
    });
    
    await step("Confirm modal appears", async () => {
      const modal = within(document.body).getByRole("dialog");
      await expect(modal).toBeInTheDocument();
    });
  }
};

// VRT story (no play function)
export const ActiveState: Story = {
  globals: { ...defaultGlobals },
  args: { ... },
  parameters: {
    nextjs: { navigation: { pathname: "/projects/my-book/editor" } }
  }
};
```

### Page Components → Doc Story + E2E

**Don't** mock `useRouter()`, `useParams()`, `useAuthToken()`, tRPC for page tests.

**Do** create documentation story + E2E test:

```typescript
// Storybook: Visual documentation only
export const Default: Story = { ... };

// Playwright: Full flow
test("redirects when not authenticated", async ({ page }) => {
  await page.goto("/projects/test/editor");
  await expect(page).toHaveURL("/login");
});
```

## Repo-Specific Quirks

### Portal Components (Modals/Dialogs)
```typescript
// Modals render in document.body, not canvasElement
await waitFor(async () => {
  const body = within(document.body);
  const modal = body.getByRole("dialog", { hidden: true });
  await expect(modal).toBeInTheDocument();
});
```

### Pseudo-States for Tailwind 4
Custom variant in `globals.css` makes hover work with storybook-addon-pseudo-states:

```css
@custom-variant hover (&:hover, &.pseudo-hover, .pseudo-hover-all &);
```

VRT usage:
```typescript
export const HoverState: Story = {
  parameters: {
    pseudo: { hover: ['[data-testid="element"]'] }
  },
  // Add delay for CSS transitions
  play: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
  }
};
```

### Story Naming
Reflect full route hierarchy including dynamic segments:

```typescript
// Route: app/projects/[projectDir]/editor/_components/editor/
export default {
  title: 'Projects/[ProjectDir]/Editor',  // Include [projectDir]!
  component: Editor,
};
```

### VRT Viewport Selection
Use smallest viewport that fits content (saves disk space):

```typescript
// Small modal - use mobile1
export const SmallModal: Story = {
  globals: {
    ...defaultGlobals,
    viewport: { value: "mobile1" },  // 375x667
  },
};

// Wide dialog - use mobile1 landscape
export const WideDialog: Story = {
  globals: {
    ...defaultGlobals,
    viewport: { value: "mobile1", isRotated: true },  // 667x375
  },
};

// Large component - omit viewport (uses 1280x720 default)
```
