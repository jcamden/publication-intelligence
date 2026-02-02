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
