# components/icons

SVG shape data rendered by `<Icon />` (decorative by default, `aria-hidden`).

- `shapes.tsx`: icon name list and path data

Conventions: the folder exposes its tab through `index`; presentational pieces take props only, stateful logic lives in hooks, and pure helpers / constants live in `helpers.ts` / `constants.ts`. Keep accessibility attributes (labels, roles, `aria-*`) intact; they are asserted by `tests/ui` and the Playwright suite.
