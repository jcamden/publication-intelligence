# Backend Integration Tests

Backend tests run against an in-memory PostgreSQL instance via [PGLite](https://github.com/electric-sql/pglite). There is **no external database** involved — each test file boots its own PGLite with migrations applied.

For the detailed PGLite setup (factories, RLS, cleanup, troubleshooting), see the authoritative guide at [`apps/index-pdf-backend/TESTING.md`](../../apps/index-pdf-backend/TESTING.md).

## Running

```bash
pnpm test                                        # all workspace tests
pnpm test:backend                                # backend only
pnpm --filter @pubint/index-pdf-backend test:watch
pnpm test:coverage
```

No pre-step required — PGLite is set up in [`apps/index-pdf-backend/src/test/setup.ts`](../../apps/index-pdf-backend/src/test/setup.ts) and migrations are applied automatically in `beforeAll`. Per-test cleanup happens in `afterEach`.

## Test layout

```
apps/index-pdf-backend/src/
├── test/
│   ├── setup.ts              # PGLite lifecycle (beforeAll / afterEach / afterAll)
│   ├── factories.ts          # createTestUser, createTestProject, ...
│   ├── server-harness.ts     # HTTP test utilities (Fastify + tRPC)
│   └── mocks.ts
└── modules/
    └── <domain>/
        ├── <domain>.service.test.ts       # Domain / service-layer tests
        └── <domain>.integration.test.ts   # Full HTTP + tRPC flow
```

Two tiers in active use:

- **Service tests** — exercise a service directly (`projectService.createProject(...)`). Faster; no HTTP stack. Suitable for business logic.
- **Integration tests** — boot a Fastify test server via `createTestServer()` and drive it through tRPC. Covers auth, RLS, and the full request lifecycle.

A third tier (contract tests for tRPC schemas) is a possible future addition; nothing lives there yet.

## Patterns

### Service / domain test

```ts
import { createTestUser } from "../../test/factories";
import * as projectService from "./project.service";

describe("Project Service", () => {
  it("creates a project", async () => {
    const user = await createTestUser();

    const project = await projectService.createProject({
      input: { title: "Test", project_dir: "test" },
      userId: user.userId,
      requestId: "test",
    });

    expect(project.title).toBe("Test");
  });
});
```

### Integration test (HTTP + tRPC)

```ts
import {
  createTestServer,
  closeTestServer,
  makeAuthenticatedRequest,
} from "../../test/server-harness";
import { createTestUser } from "../../test/factories";

describe("Project API", () => {
  let server: Awaited<ReturnType<typeof createTestServer>>;
  let request: ReturnType<typeof makeAuthenticatedRequest>;

  beforeAll(async () => {
    server = await createTestServer();
    const user = await createTestUser();
    request = makeAuthenticatedRequest({ server, authToken: user.authToken });
  });

  afterAll(async () => {
    await closeTestServer(server);
  });

  it("creates via HTTP", async () => {
    const response = await request.inject({
      method: "POST",
      url: "/trpc/project.create",
      payload: { title: "Test" },
    });

    expect(response.statusCode).toBe(200);
  });
});
```

### Factories

```ts
import { createTestUser, createTestProject } from "../../test/factories";

const user = await createTestUser();
const project = await createTestProject({ userId: user.userId });
```

### RLS-aware queries

Use `withTestUserContext` when querying directly through `testDb` so Row-Level Security policies are enforced. See [`apps/index-pdf-backend/TESTING.md`](../../apps/index-pdf-backend/TESTING.md#rls-context) for the full pattern.
