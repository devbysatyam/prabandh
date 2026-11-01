# state

The single source of truth: one validated `Plan` held in a reducer, autosaved to `localStorage`.

- `planReducer.ts` handles lifecycle actions (create, load, reset, toast) then asks each feature reducer in turn.
- `reducers/` split by domain: `core` (budget, guests, locks, intake), `tasks`, `guests`, `venues`, `vendors`. A feature reducer returns `undefined` for actions it does not own. See ADR 0004.
- `planFactory.ts` / `samplePlan.ts` build new and demo plans using the engine.
- `persistence.ts` reads / writes `localStorage` and encodes / decodes share links (validated with the Zod schema on load).
- `selectors`: derived values come from the engine (`budgetStatus`, `buildSchedule`, ...), not from the store.
- `usePlanStore.ts` is the React hook; `planStore.ts` is the public barrel.

Reducers must stay pure; time-dependent defaults take `today` as a parameter.
