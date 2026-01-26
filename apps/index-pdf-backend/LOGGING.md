# Structured Logging Guide

## Overview

IndexPDF uses structured JSON logging via **pino** for production-grade observability. All logs follow a consistent schema and are designed for future OpenTelemetry integration.

## Core Principles

1. **No console.log** - Use structured logging everywhere
2. **Consistent schema** - All logs include standard fields
3. **Request tracing** - Every request has a unique `requestId`
4. **Security first** - Sensitive data (passwords, tokens) is automatically redacted
5. **Future-proof** - Ready for OpenTelemetry without major changes

## Log Schema

Every log entry includes:

```typescript
{
  timestamp: string,      // ISO 8601 (handled by pino)
  level: string,          // info, warn, error, debug
  service: string,        // "index-pdf-backend"
  env: string,            // process.env.NODE_ENV
  event: string,          // Semantic event name (see below)
  requestId?: string,     // UUID per request
  userId?: string,        // User ID if authenticated
  error?: object,         // Error details if applicable
  metadata?: object       // Additional context
}
```

## Event Naming Convention

Use dot-notation with format: `domain.action`

### Auth Events
- `auth.user_created` - User registration completed
- `auth.user_logged_in` - Successful login
- `auth.login_failed` - Failed login attempt
- `auth.user_logged_out` - User logged out
- `auth.signup_failed` - Failed registration
- `auth.token_verification_failed` - Invalid token
- `auth.token_verification_error` - Token verification threw error

### HTTP Events
- `http.request_started` - Request received
- `http.request_completed` - Response sent

### Server Events
- `server.started` - Server listening
- `server.startup_failed` - Server failed to start

### Domain Events
- `domain.event_emitted` - Internal event published

## Usage

### Backend (apps/index-pdf-backend)

#### Basic Logging

```typescript
import { logEvent } from '../logger';

logEvent({
  event: 'user.profile_updated',
  context: {
    requestId: ctx.requestId,
    userId: ctx.user.id,
    metadata: {
      fieldsChanged: ['name', 'email'],
    },
  },
});
```

#### Error Logging

```typescript
import { logEvent } from '../logger';

try {
  // ... operation
} catch (error) {
  logEvent({
    event: 'pdf.indexing_failed',
    context: {
      requestId: ctx.requestId,
      userId: ctx.user.id,
      error,  // Automatically formatted
      metadata: {
        documentId: doc.id,
      },
    },
  });
}
```

#### Direct Logger Access

For cases where `logEvent` doesn't fit:

```typescript
import { logger } from '../logger';

logger.info({ event: 'custom.event', metadata: { foo: 'bar' } });
logger.warn({ event: 'custom.warning', metadata: { reason: 'something' } });
logger.error({ event: 'custom.error', error: { message: 'Failed' } });
logger.debug({ event: 'custom.debug', metadata: { detail: 'info' } });
```

### Frontend (apps/index-pdf-frontend)

Minimal client-side logging for auth lifecycle:

```typescript
import { logEvent, logError } from '../lib/logger';

// Log auth events
logEvent({
  event: 'auth.token_saved',
  context: {
    metadata: { tokenLength: token.length },
  },
});

// Log errors
try {
  // ... operation
} catch (error) {
  logError({
    event: 'ui.operation_failed',
    error,
    context: {
      metadata: { component: 'AuthForm' },
    },
  });
}
```

## Request Context

Every request automatically gets:

1. **requestId** - Generated UUID via middleware
2. **Request logging** - Start and completion events
3. **User context** - If authenticated, available in tRPC context

### Accessing Context in tRPC

```typescript
export const myRouter = router({
  myProcedure: protectedProcedure.mutation(async ({ ctx, input }) => {
    // ctx.requestId - Available on all procedures
    // ctx.user.id - Available on protected procedures
    
    logEvent({
      event: 'my.action',
      context: {
        requestId: ctx.requestId,
        userId: ctx.user.id,
        metadata: { ... },
      },
    });
  }),
});
```

## Security

### Automatic Redaction

The following fields are automatically removed from logs:
- `password`
- `token`
- `authToken`
- `auth_token`
- Any nested field matching these patterns (e.g., `user.password`)

### What NOT to Log

❌ Passwords or credentials  
❌ Full auth tokens or JWTs  
❌ Complete PDF file contents  
❌ Full LLM prompts (log metadata instead)  
❌ PII without consideration  

✅ User IDs (not PII in our model)  
✅ Email addresses (for auth events only)  
✅ Error messages and stack traces  
✅ Request metadata (method, status, timing)  

## Development vs Production

### Development
- Pretty-printed, colorized output
- Shows all log levels
- Easy to read in terminal

### Production
- Structured JSON (one line per log)
- Configurable via `LOG_LEVEL` env var
- Ready for log aggregation (Datadog, CloudWatch, etc.)

## Configuration

Environment variables:

```bash
NODE_ENV=production          # Controls log format
LOG_LEVEL=info              # Minimum log level (debug, info, warn, error)
```

## Future: OpenTelemetry Integration

This logging system is designed for easy OpenTelemetry migration:

1. **requestId** maps to trace/span IDs
2. **event** names become span names
3. **metadata** becomes span attributes
4. **error** becomes span status

When ready, we'll:
1. Add `@opentelemetry/api` and `@opentelemetry/sdk-node`
2. Replace `requestId` generation with trace context
3. Add span creation around key operations
4. Keep structured logging for non-traced events

## Examples

### Complete Auth Flow

```typescript
// apps/index-pdf-backend/src/routers/auth.ts

signUp: publicProcedure
  .mutation(async ({ input, ctx }) => {
    try {
      // ... create user
      
      logEvent({
        event: 'auth.user_created',
        context: {
          requestId: ctx.requestId,
          userId: user.id,
          metadata: {
            email: user.email,
            hasName: !!user.name,
          },
        },
      });
      
      return { success: true };
    } catch (error) {
      logEvent({
        event: 'auth.signup_failed',
        context: {
          requestId: ctx.requestId,
          error,
          metadata: { email: input.email },
        },
      });
      throw error;
    }
  });
```

## Best Practices

1. **Always include requestId** - Essential for tracing requests
2. **Use semantic event names** - Follow `domain.action` pattern
3. **Add useful metadata** - But don't over-log
4. **Log at appropriate levels**:
   - `debug` - Verbose internal state
   - `info` - Normal operations (default)
   - `warn` - Unexpected but handled
   - `error` - Failures requiring attention
5. **Log errors with context** - Include what was being attempted
6. **Keep functions small** - Makes logging consistent

## Troubleshooting

### Logs not appearing?

Check `LOG_LEVEL` - default is `info`, debug logs won't show.

### Sensitive data in logs?

Add field to redaction list in `logger.ts`:

```typescript
redact: {
  paths: ['password', 'token', 'yourField'],
  remove: true,
}
```

### Need to disable pretty printing?

Set `NODE_ENV=production` even in dev.
