# Frontend Testing Philosophy

## Core Principle: Test at the Right Level

> **"Write tests. Not too many. Mostly integration."** - Guillermo Rauch

This project follows a pragmatic testing approach that maximizes value while minimizing maintenance burden.

---

## The Three Testing Layers

### 1. **Storybook Tests** → Component Behavior & Visuals

**What to test:**
- ✅ User interactions (clicks, typing, keyboard nav)
- ✅ Component behavior (state changes, callbacks)
- ✅ Accessibility (ARIA, keyboard support)
- ✅ Visual states (light/dark, hover/focus/active)

**What NOT to test:**
- ❌ CSS class names (use VRT instead)
- ❌ Exact pixel measurements
- ❌ Browser routing logic
- ❌ Complex authentication flows

**Example - Good Interaction Test:**
```typescript
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
```

**Example - Bad Interaction Test:**
```typescript
// ❌ Don't test CSS classes in interaction tests
await step("Verify active link styling", async () => {
  const link = canvas.getByRole("link", { name: /editor/i });
  expect(link.className).toContain("bg-muted"); // ← VRT concern!
});
```

---

### 2. **Visual Regression Tests (VRT)** → Pixel-Perfect UI

**What to test:**
- ✅ Visual appearance of all component variants
- ✅ Active/hover/focus states
- ✅ Dark mode vs light mode
- ✅ Layout at different viewports
- ✅ CSS class application (indirectly via screenshots)

**Location:** `stories/tests/visual-regression-tests.stories.tsx`

**Example:**
```typescript
export const ActiveLinkEditor: Story = {
  globals: { ...defaultGlobals },
  args: { userName: "John Doe", ... },
  parameters: {
    nextjs: {
      navigation: { pathname: "/projects/my-book/editor" }
    }
  }
  // No play function - just visual snapshot
};
```

---

### 3. **E2E Tests (Playwright)** → Full User Journeys

**What to test:**
- ✅ Authentication flows (login, logout, session)
- ✅ Multi-page user journeys
- ✅ Form submissions with API calls
- ✅ Routing and navigation
- ✅ Data fetching and error states

**What NOT to test:**
- ❌ Individual component interactions (use Storybook)
- ❌ Visual regression (use VRT)
- ❌ Pure functions (use unit tests)

**Example:**
```typescript
test("create project flow", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL("/projects");
  
  await page.click('button:has-text("New Project")');
  await page.fill('input[name="title"]', "My Book");
  await page.click('button:has-text("Create")');
  
  await expect(page).toHaveURL(/\/projects\/my-book/);
});
```

---

## Anti-Patterns to Avoid

### ❌ Don't Mock Complex Page Logic

**Bad:**
```typescript
// page.test.tsx - Don't do this!
describe("EditorPage", () => {
  it("redirects when not authenticated", () => {
    mockUseRouter.mockReturnValue({ push: mockPush });
    mockUseAuthToken.mockReturnValue({ isAuthenticated: false });
    mockTrpc.auth.me.useQuery.mockReturnValue({ data: null });
    mockTrpc.project.getByDir.useQuery.mockReturnValue({ data: null });
    mockUseAuthenticatedPdf.mockReturnValue({ blobUrl: null });
    
    render(<EditorPage />);
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});
```

**Why bad:**
- Brittle - breaks when implementation changes
- Doesn't test real behavior
- Complex mocking setup
- False confidence

**Good:**
```typescript
// E2E test instead
test("redirects to login when not authenticated", async ({ page }) => {
  await page.goto("/projects/test-project/editor");
  await expect(page).toHaveURL("/login");
});
```

---

### ❌ Don't Test CSS Classes in Interaction Tests

**Bad:**
```typescript
// interaction-tests.stories.tsx
await expect(element.className).toContain("bg-muted");
```

**Good:**
```typescript
// visual-regression-tests.stories.tsx
export const ActiveState: Story = {
  parameters: {
    nextjs: { navigation: { pathname: "/active-route" } }
  }
  // Visual snapshot will catch styling changes
};
```

---

### ❌ Don't Create Page Unit Tests

**Bad:**
```typescript
// app/projects/page.test.tsx
describe("ProjectsPage", () => {
  it("renders with user data", () => {
    // ... complex mocking
  });
});
```

**Good:**
```typescript
// app/projects/stories/projects-page.stories.tsx
export const Default: Story = {
  // Visual documentation only
};

// playwright/e2e/projects.spec.ts
test("displays user's projects", async ({ page }) => {
  // Test full flow
});
```

---

## Testing Decision Tree

```
Is it a UI component (Button, Card, Modal)?
├─ Yes → Storybook interaction tests + VRT
└─ No ↓

Is it a page component (EditorPage, ProjectsPage)?
├─ Yes → Storybook documentation story + E2E tests
└─ No ↓

Is it a hook or utility with complex logic?
├─ Yes → Unit tests (Vitest)
└─ No ↓

Is it pure types or simple pass-through?
└─ No tests needed (TypeScript is the test)
```

---

## Summary

### ✅ DO
- Test component behavior in Storybook
- Test visual appearance in VRT
- Test full user flows in E2E
- Test pure logic in unit tests
- Keep tests maintainable and valuable

### ❌ DON'T
- Mock complex framework logic (routing, auth)
- Test implementation details (CSS classes in interaction tests)
- Create brittle unit tests for pages
- Test things already covered by child component tests
- Over-test simple components

---

## Real Example from Codebase

### Before (❌ Complex Unit Tests)
```typescript
// page.test.tsx - 381 lines of complex mocking
describe("EditorPage", () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue(mockRouter);
    vi.mocked(useParams).mockReturnValue(mockParams);
    vi.mocked(useAuthToken).mockReturnValue({ ... });
    vi.mocked(trpc.auth.me.useQuery).mockReturnValue({ ... });
    vi.mocked(trpc.project.getByDir.useQuery).mockReturnValue({ ... });
    vi.mocked(useAuthenticatedPdf).mockReturnValue({ ... });
  });
  
  it("redirects when not authenticated", ...);
  it("shows loading state", ...);
  it("shows error state", ...);
  // 8 more tests with complex mocking
});
```

### After (✅ Simple Stories + E2E)
```typescript
// stories/editor-page.stories.tsx - 30 lines of documentation
export const Default: Story = {
  // Visual documentation of page structure
};

// playwright/e2e/editor.spec.ts - Real tests
test("redirects when not authenticated", async ({ page }) => {
  await page.goto("/projects/test/editor");
  await expect(page).toHaveURL("/login");
});

test("loads project and displays editor", async ({ page }) => {
  await loginAsUser(page);
  await page.goto("/projects/test/editor");
  await expect(page.locator(".pdf-viewer")).toBeVisible();
});
```

**Result:** Less code, better tests, easier maintenance.

---

## Further Reading

- [Write Tests. Not Too Many. Mostly Integration.](https://kentcdodds.com/blog/write-tests)
- [Testing Library Guiding Principles](https://testing-library.com/docs/guiding-principles/)
- [Storybook Test Documentation](https://storybook.js.org/docs/writing-tests/interaction-testing)
- [The Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
