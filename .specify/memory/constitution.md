# Rinkonomics Constitution

## Core Principles

### I. Single Source of Truth
`GameState` is the one and only instance of game state. All game logic mutates this shared instance. **Never create a second `GameState`; never clone or copy it for UI purposes.** UI components receive a reference, not a snapshot.

### II. Event-Driven UI (No Direct Coupling)
UI components MUST NOT call `GameState` methods directly in response to game loop activity. All UI updates are driven by DOM `CustomEvent`s dispatched on `document`. New UI side-effects MUST subscribe to an existing event or justify a new event in the spec/plan.

### III. Data-First Content
All game content (generators, upgrades, milestones, prestige upgrades) lives in `src/data/` as plain arrays with lookup Maps. Adding a new item MUST mean adding an entry to a data array — never hardcoding content into game logic or UI.

### IV. TypeScript Strictness (NON-NEGOTIABLE)
All code compiles with zero errors under the project's strict `tsconfig.json`. Type-only imports MUST use `import type`. No `any`, no type assertions without justification. `verbatimModuleSyntax` is enforced.

### V. Test Coverage for Game Logic
Every new `GameState` method and data-driven behavior MUST have a unit test in `tests/unit/`. Integration flows (purchase → state change → event) MUST have a test in `tests/integration/`. Tests run with Vitest + jsdom.

### VI. No Runtime Dependencies
The project has no runtime npm dependencies — only devDependencies (Vite, Vitest, TypeScript). New features MUST be implemented without adding runtime packages.

### VII. Simplicity & Incremental Change
Prefer the smallest change that works. Don't refactor unrelated code while implementing a feature. Each spec/plan/task set MUST represent one focused increment of functionality.

## Quality Gates

Every feature MUST pass before merging to `main`:
- `npm run build` succeeds (tsc type-check + Vite build)
- `npm test` passes (all Vitest tests green)
- No new TypeScript errors introduced

## Deployment

GitHub Actions builds and deploys to GitHub Pages on push to `main`. Vite `base` is set to `/rinkonomics/`. Asset paths must remain compatible with this subdirectory deployment.

## Governance

This constitution supersedes individual preferences and file-level comments. If a principle needs to change, update this file explicitly with a note on why — do not silently deviate from it.

**Version**: 1.0.0 | **Ratified**: 2026-03-05 | **Last Amended**: 2026-03-05
