# Testing with PGLite

This project uses [PGLite](https://github.com/electric-sql/pglite) for fast, isolated database tests.

## Benefits

✅ **Fast**: In-memory PostgreSQL, no Docker/server needed  
✅ **Isolated**: Each test suite gets its own database  
✅ **Full PostgreSQL**: Supports RLS, triggers, all PG features  
✅ **CI-Friendly**: No external dependencies  

## Setup

PGLite is configured in `src/test/setup.ts`:

- `beforeAll`: Creates fresh PGLite instance and runs migrations
- `afterEach`: Cleans up test data between tests
- `afterAll`: Closes PGLite instance

## Usage

### Direct Database Access

Use `testDb` from the test setup:

```typescript
import { testDb } from "../../test/setup";
import { users } from "../../db/schema";

it("should query users", async () => {
  const result = await testDb.select().from(users);
  expect(result).toEqual([]);
});
```

### Factory Functions

Factories automatically use `testDb`:

```typescript
import { createTestUser, createTestProject } from "../../test/factories";

it("should create test data", async () => {
  const user = await createTestUser();
  const project = await createTestProject({ userId: user.userId });
  
  expect(project.ownerId).toBe(user.userId);
});
```

### RLS Context

Use `withTestUserContext` for RLS-aware queries:

```typescript
import { withTestUserContext } from "../../db/test-client";
import { testDb } from "../../test/setup";
import { projects } from "../../db/schema";

it("should enforce RLS", async () => {
  const user = await createTestUser();
  
  const result = await withTestUserContext({
    db: testDb,
    userId: user.userId,
    fn: async (tx) => tx.select().from(projects),
  });
  
  // Only returns projects user can access (RLS enforced!)
  expect(result).toEqual([]);
});
```

## Integration Tests

For full-stack integration tests that go through the service layer, you have two options:

### Option 1: Test Factories + Service Functions (Current)

```typescript
import * as projectService from "./project.service";
import { createTestUser } from "../../test/factories";

it("should create project via service", async () => {
  const user = await createTestUser();
  
  const project = await projectService.createProject({
    input: { title: "Test", project_dir: "test" },
    userId: user.userId,
    requestId: "test",
  });
  
  expect(project.title).toBe("Test");
});
```

**Note**: Service functions use the production `db` client, not `testDb`. This means they hit the real PostgreSQL database. For true isolated tests, use Option 2 or test at the repository level.

### Option 2: Repository-Level Tests (Recommended for RLS)

Test repository functions directly with `testDb`:

```typescript
import { testDb } from "../../test/setup";
import { withTestUserContext } from "../../db/test-client";
import * as projectRepo from "./project.repo";

it("should enforce RLS at repo level", async () => {
  const user = await createTestUser();
  
  // This uses testDb and PGLite
  const projects = await projectRepo.listProjectsForUser({ userId: user.userId });
  
  expect(projects).toEqual([]);
});
```

## Performance

PGLite tests are significantly faster than PostgreSQL tests:

- **PostgreSQL**: ~2-5s per test suite (setup + teardown)
- **PGLite**: ~100-500ms per test suite (in-memory)

## Migrations

Migrations are automatically run against PGLite in `beforeAll`. The test setup:

1. Creates PGLite instance
2. Reads migration journal
3. Runs migrations in order
4. Database is ready for tests!

## Cleanup

Data is automatically cleaned between tests (`afterEach`) and the PGLite instance is closed after all tests (`afterAll`).

## Troubleshooting

### "Cannot find module '@electric-sql/pglite'"

Install PGLite:
```bash
nvm use 23
pnpm add -D @electric-sql/pglite
```

### Tests fail with "role authenticated does not exist"

Ensure migrations have run. The `beforeAll` hook should run migrations automatically.

### RLS not enforcing in tests

Make sure you're using `withTestUserContext` or `withUserContext` to set the user context. Direct queries bypass RLS.
