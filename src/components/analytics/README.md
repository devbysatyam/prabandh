# components/analytics

Presentation for the Analytics and Readiness tab (data comes from `engine/analytics.ts`).

- `AnalyticsHero.tsx`: readiness score, tier and headline figures
- `constants.ts`: tier labels and colours

Conventions: the folder exposes its tab through `index`; presentational pieces take props only, stateful logic lives in hooks, and pure helpers / constants live in `helpers.ts` / `constants.ts`. Keep accessibility attributes (labels, roles, `aria-*`) intact; they are asserted by `tests/ui` and the Playwright suite.
