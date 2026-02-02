# Frontend Testing Strategy

## Overview

This document outlines our testing approach for different types of components in the frontend application.

**📖 See [TESTING-PHILOSOPHY.md](./TESTING-PHILOSOPHY.md) for detailed principles, anti-patterns, and examples.**

## Testing by Component Type

### 1. **UI Components** (Buttons, Cards, Inputs, etc.)

**Primary: Storybook Interaction Tests**

- ✅ Test all user interactions (clicks, typing, keyboard navigation)
- ✅ Test visual states (hover, focus, disabled, loading)
- ✅ Test accessibility (ARIA attributes, keyboard navigation)
- ✅ Visual regression tests for different states

**Why?**
- Real browser testing catches actual issues
- Visual documentation alongside tests
- No mocking required
- Tests match real user experience

**Location:** `stories/tests/interaction-tests.stories.tsx` and `stories/tests/visual-regression-tests.stories.tsx`

**Examples:**
- `ProjectCard` - Click, delete, hover states
- `ProjectNavbar` - Navigation links, dropdowns, theme toggle
- `Button` - All variants, states, and interactions

---

### 2. **Page Components** (Next.js route pages)

**Primary: Documentation Stories + E2E Tests**

**Storybook Stories:**
- 📖 Document page structure and layout
- 📖 Show main visual appearance
- ❌ **Don't** mock complex routing/auth for interaction tests

**E2E Tests (Playwright):**
- ✅ Test authentication flows and redirects
- ✅ Test routing and navigation
- ✅ Test full user journeys across pages
- ✅ Test data loading and error states

**Why not unit tests for pages?**
- Pages use `useRouter()`, `useParams()`, `useAuthToken()`, tRPC
- Mocking all these creates brittle tests that don't reflect reality
- Child components already have comprehensive Storybook tests
- E2E tests provide better coverage for page-level flows

**Location:** 
- Stories: `app/[route]/stories/page.stories.tsx`
- E2E: `playwright/e2e/`

**Examples:**
- `EditorPage` - Story shows structure, E2E tests auth + routing
- `IndexPage` - Story shows structure, E2E tests auth + routing
- `ProjectsPage` - Story shows structure, E2E tests CRUD flows

---

### 3. **Hooks and Utilities**

**Primary: Unit Tests (Vitest)**

- ✅ Test pure functions and logic
- ✅ Test edge cases and error handling
- ✅ Test complex state transformations
- ✅ Mock external dependencies minimally

**Why?**
- Fast execution
- No DOM rendering needed
- Easy to test edge cases
- Clear, focused tests

**Location:** `*.test.ts` next to the file

**Examples:**
- `useAuthenticatedPdf` - PDF fetching logic
- `useProjectBarButtons` - Button state logic
- Utility functions for formatting, validation, etc.

---

## Testing Tools

### Storybook + Vitest (Component Tests)
- **Use for:** UI components, interactions, visual states
- **Benefits:** Real browser, visual docs, no complex mocking
- **Run:** `pnpm test:storybook`

### Vitest (Unit Tests)
- **Use for:** Hooks, utilities, pure functions
- **Benefits:** Fast, focused, easy to debug
- **Run:** `pnpm test`

### Playwright (E2E Tests)
- **Use for:** Full user journeys, auth flows, routing
- **Benefits:** Real user scenarios, cross-browser
- **Run:** `pnpm test:e2e`

---

## When to Add Tests

### Always Add Tests For:
1. New UI components → Storybook interaction + VRT
2. New utilities/hooks → Unit tests
3. New user flows → E2E tests
4. Bug fixes → Regression test in appropriate layer

### Don't Add Tests For:
1. Page components → Use stories for docs, E2E for flows
2. Simple pass-through components → Parent component tests suffice
3. Type-only files → TypeScript is the test

---

## Examples from Codebase

### ✅ Good Testing
```typescript
// ProjectCard - Storybook interaction tests
export const DeleteButton: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const deleteBtn = canvas.getByRole("button", { name: /delete/i });
    await userEvent.click(deleteBtn);
    // Assert modal opens, etc.
  }
};
```

### ❌ Avoid
```typescript
// EditorPage - Don't create complex unit tests with mocks
// ❌ BAD
it("redirects when not authenticated", () => {
  mockUseRouter.mockReturnValue({ push: mockPush });
  mockUseAuthToken.mockReturnValue({ isAuthenticated: false });
  // ... complex mocking
});

// ✅ GOOD - Use E2E test instead
test("redirects to login when not authenticated", async ({ page }) => {
  await page.goto("/projects/test/editor");
  await expect(page).toHaveURL("/login");
});
```

---

## Measuring Coverage

- **Component coverage:** Storybook coverage addon
- **Unit test coverage:** Vitest coverage reports
- **E2E coverage:** Playwright test reports
- **Overall:** Aim for high confidence, not 100% line coverage

---

## References

- [Testing Library Guiding Principles](https://testing-library.com/docs/guiding-principles/)
- [Storybook Interaction Testing](https://storybook.js.org/docs/writing-tests/interaction-testing)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
