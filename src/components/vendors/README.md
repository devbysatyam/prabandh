# components/vendors

Vendor sourcing: checklist, booked vendors and payments, quote analyser / comparison, tastings.

- `VendorsTab`, `ChecklistView`, `BookedView`, `ComparisonView`, `TastingsView`, `QuoteAnalyzer`
- Forms: `AddVendorForm`, `MeetingForm`, `PaymentMilestoneForm`
- `useQuoteAnalyzer.ts`, `useDraft.ts`, `helpers.ts`, `constants.ts`

Conventions: the folder exposes its tab through `index`; presentational pieces take props only, stateful logic lives in hooks, and pure helpers / constants live in `helpers.ts` / `constants.ts`. Keep accessibility attributes (labels, roles, `aria-*`) intact; they are asserted by `tests/ui` and the Playwright suite.
