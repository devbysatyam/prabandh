# components/overview

Overview tab: metrics, deterministic insights, plan review banner, section shortcuts and the Copilot chat.

- `MetricsGrid`, `InsightsList`, `ReviewBanner`, `SectionExplorer`, `CopilotChatbox`
- `useCopilot.ts`: asks the API and falls back to `engine/localAnswer`

Conventions: the folder exposes its tab through `index`; presentational pieces take props only, stateful logic lives in hooks, and pure helpers / constants live in `helpers.ts` / `constants.ts`. Keep accessibility attributes (labels, roles, `aria-*`) intact; they are asserted by `tests/ui` and the Playwright suite.
