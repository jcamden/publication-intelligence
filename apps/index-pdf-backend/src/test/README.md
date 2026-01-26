# Test Infrastructure

This directory contains shared test utilities for the backend.

## Files

### `setup.ts`
- Test database client configuration
- Test data cleanup utilities
- Helper functions for test conditions

### `factories.ts`
- Test data generators (users, projects, etc.)
- Random value generators for unique test data
- Factory functions for creating test entities

### `server-harness.ts`
- Test server lifecycle management
- Authenticated request helpers
- HTTP testing utilities

### `*.test.ts`
- Shared integration tests (auth flows, etc.)
- Cross-cutting concern tests
- System-level test scenarios

## Usage

### Creating Test Data

```typescript
import { createTestUser, createTestProject } from "./factories";

const user = await createTestUser();
const project = await createTestProject({ 
  gelClient, 
  title: "Test Book" 
});
```

### Cleaning Up

```typescript
import { cleanupTestData } from "./setup";

afterAll(async () => {
  await cleanupTestData({ userEmails: [testUser.email] });
});
```

### HTTP Testing

```typescript
import { createTestServer, makeAuthenticatedRequest } from "./server-harness";

const server = await createTestServer();
const authenticatedRequest = makeAuthenticatedRequest({
  server,
  authToken: user.authToken
});

const response = await authenticatedRequest.inject({
  method: "POST",
  url: "/trpc/project.create",
  payload: { title: "Test" }
});
```

## Principles

- **Real Database**: Use actual Gel instance, not mocks
- **Isolated Data**: Each test creates unique data
- **Auto Cleanup**: Always clean up after tests
- **Composable**: Factories and helpers are reusable
- **Type Safe**: Full TypeScript support

## Adding New Factories

When adding a new domain entity, create a factory:

```typescript
export const createTestEntity = async ({
  gelClient,
  field1 = defaultValue(),
  field2,
}: {
  gelClient: Client;
  field1?: string;
  field2?: string;
}) => {
  const entity = await gelClient.querySingle<EntityType>(
    `INSERT Entity { ... }`,
    { field1, field2 }
  );
  
  if (!entity) {
    throw new Error("Failed to create test entity");
  }
  
  return entity;
};
```

Then use it in tests:

```typescript
const entity = await createTestEntity({ gelClient });
```

## Best Practices

1. Always use factories for test data creation
2. Generate random values for uniqueness (emails, titles, etc.)
3. Clean up after tests to avoid pollution
4. Keep factories simple and composable
5. Document complex setup scenarios
