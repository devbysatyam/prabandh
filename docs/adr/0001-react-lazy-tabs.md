# ADR 0001: Code-split planning tabs with React.lazy

- Status: Accepted
- Date: 2026-11-02

## Context

The app has nine planning tabs. Only one is visible at a time, but a single bundle ships all of them, hurting first load on the mid-range phones and slow networks common for our users.

## Decision

Keep the shell, Overview and Setup in the entry chunk and load every other tab with `React.lazy` behind `Suspense`, routed by `components/TabContent.tsx`. Each tab is wrapped in its own `ErrorBoundary`, keyed by tab id. A byte budget is enforced in CI by `npm run size`.

## Consequences

- The entry chunk stays near 100 kB gzip; heavy tabs (Vendors, Venues) load on demand.
- A failing tab shows a recoverable error instead of blanking the app.
- Tab imports must remain dynamic `import()` calls; a static import would silently pull the tab back into the entry chunk (the size check catches this).
- First visit to a tab shows a short "Loading section" status message (announced politely to assistive tech).
