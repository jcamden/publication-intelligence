# Backend Testing

## Test Database

Tests use a dedicated `test` Gel branch that **auto-resets before each run**:
- No manual cleanup needed
- Perfect isolation between runs
- Script: `db/gel/reset-test-branch.sh`

```bash
pnpm test              # Auto-resets test branch first
pnpm test:watch
pnpm test:coverage
```

## Test Structure

```
src/
├── test/
│   ├── setup.ts              # Test DB config
│   ├── factories.ts          # createTestUser(), createTestProject()
│   ├── server-harness.ts     # HTTP test utilities
│   └── *.test.ts
├── modules/
│   └── project/
│       ├── project.service.test.ts       # Domain tests (no HTTP)
│       └── project.integration.test.ts   # Full HTTP stack
```

## Patterns

### Domain/Service Tests
```typescript
import { createAuthenticatedClient } from "../../db/client";
import { createTestUser } from "../../test/factories";
import * as projectService from "./project.service";

describe("Project Service", () => {
  let testUser, gelClient;

  beforeAll(async () => {
    testUser = await createTestUser();
    gelClient = createAuthenticatedClient({ authToken: testUser.authToken });
  });

  // No cleanup needed - branch auto-resets

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
```typescript
import { createTestServer, closeTestServer, makeAuthenticatedRequest } from "../../test/server-harness";

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
    await closeTestServer(server);
  });

  it("should create via HTTP", async () => {
    const response = await authenticatedRequest.inject({
      method: "POST",
      url: "/trpc/project.create",
      payload: { title: "Test" },
    });

    expect(response.statusCode).toBe(200);
  });
});
```

## Factories

```typescript
import { createTestUser, createTestProject } from "./test/factories";

const user = await createTestUser();
const project = await createTestProject({ gelClient, title: "My Book" });
```
