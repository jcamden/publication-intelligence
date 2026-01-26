# Backend Testing Guide

## Overview

This backend uses a **three-tier testing strategy**:

1. **Domain/Service Tests** - Test business logic directly with real Gel database
2. **API/Integration Tests** - Test HTTP endpoints with full server setup
3. **Contract Tests** - Validate tRPC schemas and error handling

## Philosophy

- **Minimal Mocking**: Use real Gel database for authentic behavior
- **Transactional Safety**: Each test creates isolated data
- **Realistic Scenarios**: Test actual user flows, not just happy paths
- **Architectural Validation**: Tests enforce clean separation of concerns

## Running Tests

```bash
# Run all tests
pnpm test

# Watch mode (re-run on file changes)
pnpm test:watch

# Integration tests only
pnpm test:integration

# Coverage report
pnpm test:coverage
```

## Test Structure

```
src/
├── test/
│   ├── setup.ts              # Test database config
│   ├── factories.ts          # Test data generators
│   ├── server-harness.ts     # HTTP test utilities
│   └── *.test.ts             # Shared integration tests
├── modules/
│   └── project/
│       ├── project.service.test.ts       # Domain tests
│       └── project.integration.test.ts   # API tests
```

## Writing Tests

### Domain/Service Tests

Test business logic **without HTTP layer**:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createAuthenticatedClient } from "../../db/client";
import { createTestUser, cleanupTestData } from "../../test/setup";
import * as projectService from "./project.service";

describe("Project Service", () => {
  let testUser, gelClient;

  beforeAll(async () => {
    testUser = await createTestUser();
    gelClient = createAuthenticatedClient({ authToken: testUser.authToken });
  });

  afterAll(async () => {
    await cleanupTestData({ userEmails: [testUser.email] });
  });

  it("should create project", async () => {
    const project = await projectService.createProject({
      gelClient,
      input: { title: "Test" },
      userId: "test-id",
      requestId: "req-123",
    });

    expect(project.title).toBe("Test");
  });
});
```

### API/Integration Tests

Test **full HTTP flow** including auth, validation, and responses:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestServer, closeTestServer, makeAuthenticatedRequest } from "../../test/server-harness";
import { createTestUser, cleanupTestData } from "../../test/factories";

describe("Project API", () => {
  let server, testUser, authenticatedRequest;

  beforeAll(async () => {
    server = await createTestServer();
    testUser = await createTestUser();
    authenticatedRequest = makeAuthenticatedRequest({
      server,
      authToken: testUser.authToken,
    });
  });

  afterAll(async () => {
    await cleanupTestData({ userEmails: [testUser.email] });
    await closeTestServer(server);
  });

  it("should create project via HTTP", async () => {
    const response = await authenticatedRequest.inject({
      method: "POST",
      url: "/trpc/project.create",
      payload: { title: "HTTP Test" },
    });

    expect(response.statusCode).toBe(200);
  });
});
```

## Test Utilities

### Factories

Generate realistic test data:

```typescript
import { generateTestEmail, createTestUser, createTestProject } from "./test/factories";

const user = await createTestUser();
const project = await createTestProject({ gelClient, title: "My Book" });
```

### Cleanup

Always clean up test data:

```typescript
afterAll(async () => {
  await cleanupTestData({ userEmails: [testUser.email] });
});
```

### Authenticated Requests

Make HTTP requests with auth token:

```typescript
const authenticatedRequest = makeAuthenticatedRequest({
  server,
  authToken: testUser.authToken,
});

const response = await authenticatedRequest.inject({
  method: "POST",
  url: "/trpc/project.create",
  payload: { title: "Test" },
});
```

## What to Test

### ✅ DO Test

- **Domain logic** - Business rules, validation, calculations
- **Database operations** - CRUD, queries, transactions
- **Authorization** - Access control, ownership checks
- **Event emission** - Domain events are persisted
- **Error handling** - Invalid input, missing data, unauthorized access
- **Integration flows** - Auth → create → read → update → delete

### ❌ DON'T Test

- **Third-party libraries** - Trust they work
- **Framework internals** - Fastify, tRPC already tested
- **Generated code** - edgeql-js, Gel client
- **Type checks** - TypeScript catches these at compile time

## Architectural Validation

Tests enforce clean architecture:

- **Controllers** (routers) should NOT contain business logic
- **Services** should NOT depend on HTTP or Fastify
- **Repositories** should be the ONLY layer touching Gel directly

If a test reveals violations, refactor before proceeding.

## CI/CD Integration

Tests run automatically in:

- Pre-commit hooks (fast unit tests)
- Pull request checks (full suite)
- Main branch merges (with coverage reports)

## Debugging Tests

```bash
# Run single test file
pnpm vitest src/modules/project/project.service.test.ts

# Debug with Node inspector
node --inspect-brk node_modules/.bin/vitest

# Show all logs (not just errors)
DEBUG=* pnpm test
```

## Database Isolation

Each test run uses:

- Real Gel database instance
- Unique test data (random emails, IDs)
- Automatic cleanup after tests complete

**No test database reset** is needed between runs - data is isolated by design.

## Common Patterns

### Test a CRUD flow

```typescript
it("should complete full CRUD cycle", async () => {
  // Create
  const created = await projectService.createProject({ gelClient, input: { title: "Test" } });
  
  // Read
  const read = await projectService.getProjectById({ gelClient, projectId: created.id });
  expect(read.title).toBe("Test");
  
  // Update
  const updated = await projectService.updateProject({
    gelClient,
    projectId: created.id,
    input: { title: "Updated" },
  });
  expect(updated.title).toBe("Updated");
  
  // Delete
  await projectService.deleteProject({ gelClient, projectId: created.id });
  await expect(
    projectService.getProjectById({ gelClient, projectId: created.id })
  ).rejects.toThrow();
});
```

### Test authorization

```typescript
it("should not allow access to other users' projects", async () => {
  const user1 = await createTestUser();
  const user2 = await createTestUser();
  
  const client1 = createAuthenticatedClient({ authToken: user1.authToken });
  const client2 = createAuthenticatedClient({ authToken: user2.authToken });
  
  const project = await createTestProject({ gelClient: client1 });
  
  await expect(
    projectService.getProjectById({ gelClient: client2, projectId: project.id })
  ).rejects.toThrow("not found");
});
```

### Test event emission

```typescript
it("should emit domain event", async () => {
  const project = await projectService.createProject({ gelClient, input: { title: "Test" } });
  
  const events = await gelClient.query(
    `SELECT Event { action } FILTER .entity_id = <uuid>$id`,
    { id: project.id }
  );
  
  expect(events).toContainEqual({ action: "created" });
});
```

## Troubleshooting

### Tests timing out

Increase timeout in vitest.config.ts:

```typescript
test: {
  testTimeout: 30000, // 30 seconds
}
```

### Database connection errors

Check Gel is running:

```bash
pnpm gel:ui
```

### Auth failures in tests

Verify GEL_AUTH_URL environment variable:

```bash
export GEL_AUTH_URL=http://localhost:10701/db/main/ext/auth
```

## Best Practices

1. **Test behavior, not implementation** - Test what the code does, not how
2. **Use realistic data** - Avoid `foo`, `bar`, `test123` - use factories
3. **Clean up after yourself** - Always use afterAll to remove test data
4. **Test error paths** - Don't just test happy paths
5. **Keep tests fast** - Avoid unnecessary waits, use real DB for speed
6. **Write tests first** - TDD when adding new features

## Future Enhancements

- [ ] Contract testing with frontend tRPC client
- [ ] Load testing for high-volume scenarios
- [ ] Mutation testing for test quality validation
- [ ] Visual regression testing for error messages
- [ ] Performance benchmarks for critical paths
