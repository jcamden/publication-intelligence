# Logging (docs mirror)

**Canonical:** `apps/index-pdf-backend/LOGGING.md` and `.cursor/rules/logging-standards.mdc`.

- **pino** structured logs; `event` as `domain.action`; include `requestId`.
- No `console.log`; no secrets or huge payloads in metadata.

Example events: `auth.user_logged_in`, `http.request_started`, `server.started`.
