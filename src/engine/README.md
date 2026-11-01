# engine

Pure, deterministic planning logic. No React, no I/O, no randomness: the same plan and `today` always produce the same result, which is why it is covered by unit and property tests.

| File                                        | Responsibility                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `money.ts`                                  | INR formatting / parsing and Largest Remainder (Hare-Niemeyer) rounding; money is integer rupees |
| `budget.ts`                                 | Preset allocation, live redistribution across unlocked categories, over-budget options           |
| `timeline.ts`                               | Date maths, dependency DAG (sort, cycles), schedule, delay propagation                           |
| `guests.ts`, `venues.ts`, `vendors.ts`      | Headcount / RSVP aggregation, venue fit, quote comparison and payments                           |
| `runsheet.ts`, `calendar.ts`, `whatsapp.ts` | Day-of sheet, RFC 5545 `.ics` export, shareable WhatsApp text                                    |
| `advisor.ts`, `analytics.ts`                | Prioritised insights, local Q&A fallback, 4-pillar readiness score                               |
| `presets/`                                  | Per-occasion labels, budget shares, task and run-sheet templates                                 |

Rules of the module:

- Import from `engine/index.ts` (barrel) or a specific file; never import from components or state.
- Keep functions under the ESLint limits (complexity 10, 80 lines); extract named helpers instead.
- Every exported function has TSDoc with `@param`, `@returns` and `@example`.
