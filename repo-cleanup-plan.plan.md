Guiding principles





Each phase = one PR. Phases are ordered so earlier ones don't conflict with later ones.



No behavior changes except Phase 5 (events). Everything else is rename / move / dedupe / delete.



Use git mv for renames so history is preserved.



Gate each PR on pnpm check && pnpm typecheck && pnpm test && pnpm test:interaction && pnpm vrt:update (update snapshots only for intentional visual changes — there shouldn't be any).

Phase 0 — Root and docs hygiene

Safe, fast, no code moves. Good first PR.





Delete tracked stale file: [apps/index-pdf-backend/.test-structure.txt](apps/index-pdf-backend/.test-structure.txt) (references a doc that doesn't exist).



Update [.gitignore](.gitignore) to ignore Python artifacts under apps/index-pdf-extractor/: venv/, *.egg-info/, __pycache__/, *.pyc. Confirm sample.pdf stays tracked if it's a fixture.



Remove db/* from [pnpm-workspace.yaml](pnpm-workspace.yaml) — no package.json lives there; db/migrations/ is just Drizzle output.



Drop unused @pubint/core from [packages/storybook-vrt/package.json](packages/storybook-vrt/package.json) devDeps.



Docs consolidation:





Collapse root [TESTING.md](TESTING.md) into [docs/testing/README.md](docs/testing/README.md); leave root as a 2-line pointer or delete and update references in [README.md](README.md).



Reconcile [docs/testing/backend-integration-tests.md](docs/testing/backend-integration-tests.md) (Gel story) with the actual PGLite reality in [apps/index-pdf-backend/TESTING.md](apps/index-pdf-backend/TESTING.md) — keep PGLite as source of truth; delete the Gel content.



Consolidate [johns-todos.md](johns-todos.md) and [docs/development/todos.md](docs/development/todos.md) into a single docs/development/todos.md, or rename johns-todos.md explicitly personal and move to docs/development/.



Fix yaboujee branding drift in [packages/yaboujee/README.md](packages/yaboujee/README.md), [packages/yaboujee/USAGE_EXAMPLES.md](packages/yaboujee/USAGE_EXAMPLES.md), [packages/yaboujee/STYLING_ARCHITECTURE.md](packages/yaboujee/STYLING_ARCHITECTURE.md), [packages/yaboujee/COMPONENT_PATTERN.md](packages/yaboujee/COMPONENT_PATTERN.md): replace all Pixel / @pubint/pixel references with yaboujee / @pubint/yaboujee.



Delete [apps/index-pdf-backend/src/logger.example.ts](apps/index-pdf-backend/src/logger.example.ts); move any useful snippets into [docs/architecture/logging-standards.md](docs/architecture/logging-standards.md).

Phase 1 — Populate @pubint/pdf and @pubint/llm

Turn stub packages into real shared code instead of deleting them.

@pubint/pdf:





Move [apps/index-pdf-backend/src/modules/source-document/pdf-utils.ts](apps/index-pdf-backend/src/modules/source-document/pdf-utils.ts) → packages/pdf/src/validation.ts.



Extract PyMuPDF wire-format types (PyMuPDFPage, PyMuPDFWord, PyMuPDFResult) from [text-extraction.utils.ts](apps/index-pdf-backend/src/modules/detection/text-extraction.utils.ts) → packages/pdf/src/pymupdf.types.ts. These are the JS↔Python contract.



Replace stub body in [packages/pdf/src/index.ts](packages/pdf/src/index.ts):

export * from "./validation";
export type { PyMuPDFPage, PyMuPDFWord, PyMuPDFResult } from "./pymupdf.types";





Update backend imports: import { validatePdfFile, computeFileHash } from "@pubint/pdf"; update text-extraction.utils.ts to re-export types from @pubint/pdf.

@pubint/llm:





Move [apps/index-pdf-backend/src/modules/detection/openrouter.client.ts](apps/index-pdf-backend/src/modules/detection/openrouter.client.ts) → packages/llm/src/openrouter.ts.



The LLMDetectionResponse type used in that file stays in detection (it's domain-specific); accept a generic response shape in @pubint/llm.



Replace stub body in [packages/llm/src/index.ts](packages/llm/src/index.ts) to export callOpenRouter and its types.



Update detection imports to @pubint/llm.

Both: confirm [apps/index-pdf-frontend/next.config.ts](apps/index-pdf-frontend/next.config.ts) transpile list still makes sense (frontend doesn't currently import either; can drop them from the transpile list until it does).

Phase 2 — Backend naming and structure consistency

Pure renames (git mv), no logic changes.





Rename all sourceDocument.*.ts files in [apps/index-pdf-backend/src/modules/source-document/](apps/index-pdf-backend/src/modules/source-document/) to source-document.*.ts to match every other module (auth.*.ts, user-settings.*.ts, etc.).



Resolve the projectIndexType vs project-highlight-config mismatch in [apps/index-pdf-backend/src/routers/index.ts](apps/index-pdf-backend/src/routers/index.ts): pick one name. Recommendation: rename the router key to projectHighlightConfig to match the folder, since the folder name describes the actual domain (highlight configs per project).



Rename [apps/index-pdf-backend/src/events/](apps/index-pdf-backend/src/events/) → apps/index-pdf-backend/src/event-bus/ to disambiguate from [apps/index-pdf-backend/src/modules/event/](apps/index-pdf-backend/src/modules/event/) (persistence). This unblocks Phase 5.



Update imports and any .cursor/rules/*.mdc or docs that reference old paths.



Because the router rename touches the frontend tRPC tree, bump any frontend hook call sites (grep for .projectIndexType.).

Phase 3 — Backend dedupe and file-size hygiene





Extract a single Bearer-token parser into apps/index-pdf-backend/src/lib/bearer-token.ts; replace ad-hoc authHeader.slice("Bearer ".length) in [apps/index-pdf-backend/src/server.ts](apps/index-pdf-backend/src/server.ts), [apps/index-pdf-backend/src/modules/source-document/upload.routes.ts](apps/index-pdf-backend/src/modules/source-document/upload.routes.ts), and [apps/index-pdf-backend/src/modules/source-document/download.routes.ts](apps/index-pdf-backend/src/modules/source-document/download.routes.ts).



Split oversized files (optional — do only what feels clean; keep behavior identical):





[detection.service.ts](apps/index-pdf-backend/src/modules/detection/detection.service.ts) — split by phase (collect pages → call LLM → persist results).



[index-entry.repo.ts](apps/index-pdf-backend/src/modules/index-entry/index-entry.repo.ts) — split CRUD / bulk / query.



[scripture-bootstrap.service.ts](apps/index-pdf-backend/src/modules/scripture-bootstrap/scripture-bootstrap.service.ts) / [scripture-bootstrap.repo.ts](apps/index-pdf-backend/src/modules/scripture-bootstrap/scripture-bootstrap.repo.ts) — split by phase.



[scripture-detection-on-page.test.ts](apps/index-pdf-backend/src/modules/detection/scripture-detection-on-page.test.ts) — split by scenario.

Phase 4 — Frontend dedupe





Extract a shared auth form primitive from near-identical [apps/index-pdf-frontend/src/app/login/_components/login-form/login-form.tsx](apps/index-pdf-frontend/src/app/login/_components/login-form/login-form.tsx) and [apps/index-pdf-frontend/src/app/signup/_components/signup-form/signup-form.tsx](apps/index-pdf-frontend/src/app/signup/_components/signup-form/signup-form.tsx). Put it in src/app/_common/_components/auth-form/ (layout + submit + error surface). Each page keeps its own form for field definitions and submit handler.



Promote matcher-run-controls-shared.tsx pattern: move the mirrored sidebar primitives from editor/_components/project-sidebar/ and page-sidebar/ into a single editor/_components/sidebar/ with variant props. Do this in small, reviewable slices — one control at a time.



Consolidate the four tRPC-related files into a single folder: src/app/_common/_trpc/ containing client.ts (was _utils/trpc.ts), types.ts (was _utils/trpc-types.ts), error.ts (was _utils/trpc-error.ts), provider.tsx (was _providers/trpc-provider.tsx). Update imports.

Phase 5 — Events pipeline unification (separate PR, same plan)

The big one. Do this last; own its own PR.

Goal: one emitEvent(...) call per mutation instead of today's three parallel mechanisms (in-process emitter that nobody calls, insertEvent on ~25 sites, logEvent on ~100 sites). Keeps the door open for socket.io and OTel without doing either yet.

Steps:





Expand [packages/events/src/auth.ts](packages/events/src/auth.ts) into a full discriminated union:

export type DomainEvent =
  | AuthEvent        // existing
  | ProjectEvent     // project.created|updated|deleted
  | DocumentEvent    // document.uploaded|deleted
  | IndexEntryEvent  // index_entry.created|updated|parent_updated|deleted
  | IndexMentionEvent
  | RegionEvent
  | HighlightConfigEvent
  | ScriptureBootstrapEvent
  | ScriptureIndexConfigEvent
  | CanonicalPageRuleEvent;

   Pull event names from the call sites identified in this plan. Add a Zod schema per variant; validate at emit time.





Standardize the event type-string convention as entity.action with both halves snake_case (e.g. index_mention.bulk_created, project.created, scripture_bootstrap.run_completed). Matches the DB table's current contents so no backfill/migration is needed. Enforce via the Zod schemas and a lint-style unit test that walks the union.



Implement a transactional outbox so events can't be dropped on partial failure. Concretely:





Refactor [insertEvent](apps/index-pdf-backend/src/modules/event/event.repo.ts) to accept an optional Drizzle transaction handle: insertEvent(input, { tx }) — when tx is provided, the INSERT runs on that transaction; otherwise it runs on the root db as today.



Refactor emitEvent to accept the same optional tx. Inside a transaction, callers pass tx and the event row is written atomically with the mutation.



In-process subscriber fanout (o11y / future socket.io) happens after the transaction commits to avoid emitting events for rolled-back work. Implement this with a small helper that queues events during the transaction and dispatches them on commit (tx.onCommit(() => dispatch(event)) pattern, or a per-request collector wired into the request lifecycle — pick whichever is simpler to land in this PR).



Document the guarantee in packages/events/README.md: "an event is persisted iff its originating mutation committed; subscriber delivery is best-effort after commit".



Build apps/index-pdf-backend/src/event-bus/emit-event.ts:

export const emitEvent = async (
  event: DomainEvent,
  context: { userId?: string; projectId?: string; requestId?: string },
  options?: { tx?: DrizzleTx },
): Promise<void> => {
  DomainEventSchema.parse(event);                             // validate
  logEvent({ event: event.type, context });                   // o11y path (sync)
  await insertEvent({ ...event, ...context }, options);       // audit path (tx-aware)
  queueForPostCommitDispatch(event, options?.tx);             // fanout after commit
};

   queueForPostCommitDispatch falls back to immediate dispatch when there's no transaction. Zero subscribers are registered yet — that's fine; it's the extension point for future socket.io / OTel.





Replace call sites: grep for insertEvent( (~25 sites) and paired logEvent( calls; replace with emitEvent(...). Where the mutation already runs inside a db.transaction(async (tx) => ...), pass tx through. Pattern:

- logEvent({ event: "project.created", context: { userId, projectId } });
- await insertEvent({ type: "project.created", projectId, userId, entityType: "Project", entityId: projectId });
+ await emitEvent({ type: "project.created", project: { id: projectId, ... } }, { userId, projectId }, { tx });





Replace the 4 commented-out emits in [apps/index-pdf-backend/src/modules/auth/auth.router.ts](apps/index-pdf-backend/src/modules/auth/auth.router.ts) with real emitEvent(...) calls for user.created, user.logged_in, user.logged_out, auth.failed_login_attempt.



Add packages/events/README.md describing: event naming rules (snake_case entity.action), how to add a new event (type → Zod schema → call site), transactional guarantee, and how consumers subscribe (future socket.io gateway, future OTel exporter, future Sentry breadcrumb handler).

Explicitly out of scope for Phase 5:





Actual socket.io gateway.



Actual OTel / Sentry exporter.



Retrying failed subscriber deliveries (best-effort after commit is fine for now).

Phase 6 — Final hygiene





Review .cursor/rules/*.mdc for any references to renamed paths; update as needed.



Verify pre-commit in [.husky/pre-commit](.husky/pre-commit) still works end-to-end.



Update root [README.md](README.md) "Workspace Structure" section to reflect new reality (events pipeline, populated @pubint/pdf / @pubint/llm).

Risk summary





Phase 2 renames will cause a brief import-churn storm; use a single atomic PR and run full test suite + pnpm check before merging.



Phase 5 touches ~25 service call sites; pair it with integration tests for each event type (use [apps/index-pdf-backend/src/test/factories.ts](apps/index-pdf-backend/src/test/factories.ts) patterns). Keep the DB events table schema unchanged — that's the guarantee that makes this a safe refactor.



Phase 4 sidebar dedupe has the most visual risk; land it with VRT snapshot review, not bulk update.

