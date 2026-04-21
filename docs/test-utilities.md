# Test utilities (index)

Shared helpers live next to code; this file is a **map**, not a full catalog.

## Backend (`apps/index-pdf-backend/src/test/`)

| File | Role |
|------|------|
| `mocks.ts` | `createMockContext`, `createMockUser`, `FAKE_UUID`, `createTestPdfBuffer` |
| `factories.ts` | `createTestUser`, `createTestProject`, … |
| `server-harness.ts` | `createTestServer`, `makeAuthenticatedRequest`, `closeTestServer` |

## Frontend (`apps/index-pdf-frontend`)

| Area | Role |
|------|------|
| `src/app/projects/[projectDir]/editor/_mocks/` | `mockMentions`, `mockIndexEntries`, `mockIndexTypes` |
| `src/app/_common/_test-utils/storybook-utils/` | `TestDecorator`, `TrpcDecorator` |
| `src/app/_common/_test-helpers/interaction-steps.ts` | Reusable Storybook steps (e.g. modals) |

## Yaboujee (`packages/yaboujee`)

- `src/components/pdf/test-helpers/mock-factories.ts` — PDF file + highlight mocks  
- Per-component `stories/shared.ts` — args, test ids, fixtures  

## Core (`packages/core`)

- `validation.ts` — shared Zod validators (email, password, project dir, …)  
- `logger.types.ts` — shared log context types  

## Guidelines

Promote to shared mocks after **3+** repeats; keep one-off fixtures local.

## Rules

`.cursor/rules/ui-component-testing.mdc`, `.cursor/rules/user-run-commands.mdc`, `apps/index-pdf-backend/TESTING.md`.
