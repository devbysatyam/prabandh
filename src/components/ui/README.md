# components/ui

Shared accessible form primitives.

- `Field.tsx`: label + control wrapper and shared label / button class names

Conventions: the folder exposes its tab through `index`; presentational pieces take props only, stateful logic lives in hooks, and pure helpers / constants live in `helpers.ts` / `constants.ts`. Keep accessibility attributes (labels, roles, `aria-*`) intact; they are asserted by `tests/ui` and the Playwright suite.
