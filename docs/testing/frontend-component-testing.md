# Frontend testing

## Layout

```
src/components/card/
├── card.tsx
├── index.ts
└── stories/
    ├── card.stories.tsx
    ├── shared.tsx
    └── tests/
        ├── interaction-tests.stories.tsx
        └── visual-regression-tests.stories.tsx
```

## What to use

| Change | Test |
|--------|------|
| UI component | Storybook interaction + VRT |
| Page | Doc story + E2E |
| API | Integration |
| Pure util/hook | Unit |

**Pages:** avoid heavy `useRouter`/tRPC mocks in Storybook; use doc story + E2E for real flows.

## Snippets

**Interaction:** `play` with `step()`, `within`, `userEvent`; for modals use `document.body` / `screen` + `waitFor`.

**VRT:** `defaultGlobals` / viewports; Tailwind pseudo-states need the `hover` custom variant in app CSS; add a short `play` delay if transitions matter.

**Story title:** full route path including dynamic segments (e.g. `[projectDir]`).

## Rules in repo

Cursor: `.cursor/rules/ui-component-testing.mdc`. Colocate Storybook selectors/steps under each component’s `stories/helpers/` (or `src/app/_stories/helpers/` when shared across the app).
