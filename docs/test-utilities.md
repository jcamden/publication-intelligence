# Test Utilities

This document catalogs shared test utilities across the monorepo to prevent duplication and promote consistency.

## Backend Test Utilities (`apps/index-pdf-backend/src/test/`)

### Test Mocks (`test/mocks.ts`)

**`createMockContext(overrides?)`**
- Creates mock tRPC context for router tests
- Default: `{ requestId: "test-request-id", authToken: "mock-auth-token" }`
- Usage: `const caller = appRouter.createCaller(createMockContext({ user: mockUser }))`

**`createMockUser(options?)`**
- Creates mock user object for testing
- Default: `{ id: "00000000-0000-0000-0000-000000000001", email: "test@example.com", name: "Test User" }`
- Usage: `const mockUser = createMockUser({ email: "custom@example.com" })`

**`FAKE_UUID`**
- Constant for fake UUID in negative tests
- Value: `"00000000-0000-0000-0000-000000000000"`
- Usage: `await expect(getProject(FAKE_UUID)).rejects.toThrow()`

**`createTestPdfBuffer(options?)`**
- Creates minimal PDF buffer for testing
- Default content: `"test content"`
- Usage: `const pdfBuffer = createTestPdfBuffer({ content: "my content" })`

### Test Factories (`test/factories.ts`)

**`generateTestEmail()`**
- Generates unique test email with random hash

**`generateTestPassword()`**
- Generates random password for testing

**`createTestUser(options?)`**
- Creates authenticated user with real Gel DB record
- Returns: `{ email, password, authToken, userId }`
- Usage: `const testUser = await createTestUser()`

**`createTestProject(options)`**
- Creates test project in database
- Requires: `{ gelClient, title?, description?, project_dir? }`

### Server Test Harness (`test/server-harness.ts`)

**`createTestServer()`**
- Creates Fastify test server instance

**`closeTestServer(server)`**
- Closes test server

**`makeAuthenticatedRequest({ server, authToken })`**
- Returns authenticated request helper
- Usage: `const request = makeAuthenticatedRequest({ server, authToken })`

## Frontend Test Utilities (`apps/index-pdf-frontend/`)

### Test Mocks (`src/app/projects/[projectDir]/editor/_mocks/`)

**`mockMentions`** (`mentions.ts`)
- Standard mock mentions array for testing
- 3 mentions: Philosophy, Kant (2x)
- Used across entry-tree, entry-picker, page-sidebar stories

**`mockIndexEntries`** (`index-entries.ts`)
- Mock index entries for subjects, authors, scripture
- Exports: `mockSubjectEntries`, `mockAuthorEntries`, `mockScriptureEntries`, `mockIndexEntries`

**`mockIndexTypes`** (`index-types.ts`)
- Mock index types configuration

### Storybook Test Utilities (`src/app/_common/_test-utils/storybook-utils/`)

**`TestDecorator`** (`test-decorator.tsx`)
- Hydrates Jotai atoms with mock data for editor component stories
- Hydrates: `indexTypesAtom`, `indexEntriesAtom`, `mentionsAtom`
- Usage: `decorators: [TestDecorator]` in story meta

**`TrpcDecorator`** (`trpc-decorator.tsx`)
- Provides mock tRPC client and Next.js router for Storybook

### Interaction Steps (`src/test-helpers/interaction-steps.ts`)

**`awaitHighlights()`**
- Waits for PDF highlights to render
- Used in PDF-related interaction tests

## Yaboujee Package Test Utilities (`packages/yaboujee/`)

### PDF Mock Factories (`src/components/pdf/test-helpers/mock-factories.ts`)

**`createMockPdfFile(name?)`**
- Creates minimal mock PDF File object
- Default name: `"sample.pdf"`
- Usage: `const mockFile = createMockPdfFile("my-document.pdf")`

**`mockHighlights`**
- Standard mock PDF highlights array
- 3 highlights: top-left, top-right, center
- Coordinates in PDF user space (612x792pt)

### Component Shared Files (`stories/shared.ts`)

Each component may have a `stories/shared.ts` file with:
- Default args for the component
- Test IDs constants (e.g., `COMPONENT_TEST_IDS`)
- Component-specific mock data
- Helper functions for that component's tests

## Cross-Workspace Utilities (`packages/core/`)

### Validation (`src/validation.ts`)

Shared Zod validators used in both backend and frontend:

**`emailValidator`**
- `z.string().email("Please enter a valid email address")`

**`passwordValidator`**
- `z.string().min(8, "Password must be at least 8 characters")`

**`titleValidator`**
- `z.string().min(1, "Title is required").max(500)`

**`projectDirValidator`**
- Validates project directory format: `^[a-z0-9]+(?:-[a-z0-9]+)*$`

### Logging Types (`src/logger.types.ts`)

**`LogLevel`**
- Type: `"info" | "warn" | "error" | "debug"`

**`LogContext`**
- Type: `{ userId?, requestId?, error?, metadata? }`
- Used by both Pino (backend) and custom logger (frontend)

## Style Constants (`packages/yaboujee/src/constants/`)

### Popover Classes (`popover-classes.ts`)

**`POPOVER_ANIMATION_CLASSES`**
- Long className string for consistent popover styling
- Includes animations, colors, shadows, positioning

## Guidelines

### When to Use Shared vs. Local Mocks

**Use shared mocks when:**
- The same mock is used across 3+ test files
- The mock represents a standard test fixture (e.g., mockMentions)
- The mock should be consistent across tests

**Use local mocks when:**
- The mock is specific to one component's tests
- The mock represents a unique test scenario
- The mock is simple and inline (1-2 lines)

### Creating New Shared Mocks

1. **Identify duplication**: Same mock in 3+ places
2. **Choose location**:
   - Backend-only: `apps/index-pdf-backend/src/test/`
   - Frontend-only: `apps/index-pdf-frontend/src/test-helpers/` or component `_mocks/`
   - Yaboujee-only: `packages/yaboujee/src/components/*/stories/shared.tsx`
   - Cross-workspace: `packages/core/src/`
3. **Extract**: Move to shared location with clear JSDoc
4. **Update references**: Replace all instances with imports
5. **Update this doc**: Add entry to relevant section

### When NOT to Share

**Don't extract shared utilities for:**
- Mocks used in only 1-2 places
- Test-specific setup that varies significantly
- Intentional duplications (e.g., similar but different test scenarios)

## Related Documentation

- [Testing Policy](./.cursor/rules/testing-policy.mdc)
- [UI Component Testing Standards](./.cursor/rules/ui-component-testing.mdc)
- [Logging Standards](./.cursor/rules/logging-standards.mdc)
