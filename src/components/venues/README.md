# components/venues

Venue shortlist with capacity fit, policies and the site-recce visit log.

- `index.tsx` (tab), `PropertiesView`, `VisitsView`, `VenueCard`, `VisitCard`
- Forms: `VenueForm`, `SiteVisitForm`, shared `fields.tsx`
- `hooks.ts`, `helpers.ts`, `constants.ts`

Conventions: the folder exposes its tab through `index`; presentational pieces take props only, stateful logic lives in hooks, and pure helpers / constants live in `helpers.ts` / `constants.ts`. Keep accessibility attributes (labels, roles, `aria-*`) intact; they are asserted by `tests/ui` and the Playwright suite.
