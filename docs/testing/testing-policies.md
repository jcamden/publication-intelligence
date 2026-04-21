# Testing policies

Agents should **not** execute `pnpm` test/install scripts or DB CLI. Give exact commands; the developer runs them and shares results.

**Typically user-driven:** interaction tests, VRT, E2E (Playwright, browsers, snapshots).

**Same rule for:** `pnpm test`, `pnpm typecheck`, etc. — instruct the user; do not assume outputs without a run report.
