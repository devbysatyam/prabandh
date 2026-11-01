# ADR 0004: Split the plan store into feature reducers

- Status: Accepted
- Date: 2026-11-02

## Context

A single `switch` over about 35 actions grew past 400 lines, exceeded the complexity limit and made each domain hard to review and test.

## Decision

Keep one reducer and one state shape (`PlanState`), but compose it from feature reducers in `src/state/reducers` (`core`, `tasks`, `guests`, `venues`, `vendors`). A feature reducer has the type `FeatureReducer` and returns `undefined` for actions it does not own. `planReducer` handles lifecycle actions (create, load, reset, toast) and then offers the action to each feature reducer in order. Large domains compose smaller reducers with `??`.

## Consequences

- Still one source of truth and one `useReducer`; no extra store library.
- Each reducer stays under the ESLint complexity and size limits and is easy to unit test in isolation.
- Action names must be unique across reducers; the first handler wins.
- Cross-domain recalculation stays in the engine, not in reducers.
