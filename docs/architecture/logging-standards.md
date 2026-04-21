# Logging Standards

Uses **pino** with structured logging. Never use `console.log`.

## Schema

```typescript
{
  timestamp: string,      // ISO 8601
  level: string,          // info, warn, error, debug
  service: string,        // "index-pdf-backend"
  env: string,
  event: string,          // domain.action format
  requestId?: string,     // UUID per request
  userId?: string,
  error?: object,
  metadata?: object
}
```

## Event Names (domain.action)

```
auth.user_created
auth.user_logged_in
auth.login_failed
http.request_started
http.request_completed
server.started
```

## Usage

### Backend
```typescript
import { logEvent } from '../logger';

logEvent({
  event: 'user.profile_updated',
  context: {
    requestId: ctx.requestId,
    userId: ctx.user.id,
    metadata: { fieldsChanged: ['name', 'email'] },
  },
});
```

### tRPC Context
```typescript
// ctx.requestId available on all procedures
// ctx.user.id available on protected procedures
logEvent({
  event: 'my.action',
  context: {
    requestId: ctx.requestId,
    userId: ctx.user.id,
  },
});
```

## Security

Auto-redacted fields: `password`, `token`, `authToken`, `auth_token`

❌ Don't log: passwords, tokens, full PDF contents, full LLM prompts  
✅ Can log: user IDs, emails (auth only), error messages

## Config

```bash
NODE_ENV=production  # Controls format (JSON vs pretty)
LOG_LEVEL=info       # debug, info, warn, error
```

## Examples

### Error logging

```ts
import { logEvent } from "../logger";

try {
  // ... some operation
} catch (error) {
  logEvent({
    event: "document.creation_failed",
    context: {
      requestId: ctx.requestId,
      userId: ctx.user.id,
      error,
      metadata: { attemptedTitle: "My Doc" },
    },
  });
}
```

### Direct logger usage (non-event scenarios)

Reach for `logger` directly when the log line isn't a domain event (cache hit, rate-limit warning, debug traces):

```ts
import { logger } from "../logger";

logger.info({ event: "cache.hit", metadata: { key: "user:123", ttl: 3600 } });
logger.warn({ event: "rate_limit.approaching", metadata: { userId: "123", requests: 95, limit: 100 } });
logger.debug({ event: "query.executed", metadata: { sql: "SELECT * FROM users", duration: 45 } });
```

### Background jobs (no request context)

```ts
logEvent({
  event: "job.started",
  context: {
    metadata: { jobType: "pdf_indexing", batchSize: 100 },
  },
});
```

### Rich metadata

```ts
logEvent({
  event: "search.query_executed",
  context: {
    requestId: ctx.requestId,
    userId: ctx.user.id,
    metadata: {
      query: "machine learning",
      filters: { dateRange: "2024-01-01:2024-12-31", tags: ["ai", "ml"] },
      resultsCount: 42,
      durationMs: 156,
    },
  },
});
```
