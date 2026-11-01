# components/guests

Guest list, family sides, RSVP tracking and WhatsApp invites.

- `GuestForm`, `GuestFilters`, `GuestTable`, `GuestRow`, `GuestsSummary`
- `helpers.ts`, `constants.ts`

Conventions: the folder exposes its tab through `index`; presentational pieces take props only, stateful logic lives in hooks, and pure helpers / constants live in `helpers.ts` / `constants.ts`. Keep accessibility attributes (labels, roles, `aria-*`) intact; they are asserted by `tests/ui` and the Playwright suite.
