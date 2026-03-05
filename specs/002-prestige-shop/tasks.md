# Tasks: Prestige Shop

**Input**: Design documents from `/specs/002-prestige-shop/`
**Branch**: `002-prestige-shop`
**Prerequisites**: plan.md ✅, spec.md ✅

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story this task belongs to (US1–US4)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm branch/files are in place. No new project init needed (existing codebase).

- [X] T001 Confirm branch `002-prestige-shop` is active and `src/data/`, `src/ui/`, `tests/unit/`, `tests/integration/` directories exist

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: New data type, extended `GameState`, and `SaveManager` migration. ALL user stories depend on this phase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Create `src/data/prestigeUpgrades.ts` — define `PrestigeUpgradeDefinition` interface and export `prestigeUpgrades` array + `prestigeUpgradesById` Map with initial catalog: `buy-10` (1 ring), `buy-max` (3 rings), `power-wrist-shot` click ×2 (2 rings), `power-slap-shot` click ×3 (5 rings), and one tier-3 ×2 generator upgrade per generator type (2–10 rings, threshold 50 owned)
- [X] T003 [P] Write unit tests for ring formula and bulk-buy cost helpers in `tests/unit/PrestigeUpgrades.test.ts` — cover `computeRingsFromPrestige` at 100M/1B/10B pucks, `generatorBulkCost` geometric series, `generatorMaxAffordable` boundary
- [X] T004 Extend `GameState.ts` — add runtime fields `purchasedPrestigeUpgrades: Set<string>`, `prestigeClickMultiplier: number` (default 1), `prestigeGeneratorMultipliers: Record<GeneratorId, number>` (default all 1); initialize in constructor
- [X] T005 Update `pucksPerClick` getter in `GameState.ts` to include `prestigeClickMultiplier` (stack after existing `clickMultiplier`)
- [X] T006 Update per-generator pps calculation in `GameState.ts` `pucksPerSecond` getter to multiply by `prestigeGeneratorMultipliers[id]`
- [X] T007 Add `computeRingsFromPrestige(totalPucksEarned: number): number` method to `GameState.ts` — formula: `Math.max(1, Math.floor(Math.log10(totalPucksEarned) - 7))`; update `prestige()` to use it instead of `championshipRings++`; ensure prestige does NOT reset `purchasedPrestigeUpgrades`, `prestigeClickMultiplier`, or `prestigeGeneratorMultipliers`
- [X] T008 Add `generatorBulkCost(id: GeneratorId, quantity: number): number` and `generatorMaxAffordable(id: GeneratorId): number` methods to `GameState.ts`; add `buyGeneratorBulk(id: GeneratorId, quantity: number): boolean` method that spends pucks, increments generator count, and dispatches `gamestate:purchase`
- [X] T009 Add `buyPrestigeUpgrade(id: string): boolean` method to `GameState.ts` — checks not already owned, checks `championshipRings >= ringCost`, deducts rings, adds to `purchasedPrestigeUpgrades`, applies click or generator multiplier effect, dispatches `gamestate:prestige-purchase` CustomEvent
- [X] T010 Add `get hasBulkBuy10(): boolean` and `get hasBuyMax(): boolean` computed getters to `GameState.ts` based on `purchasedPrestigeUpgrades`
- [X] T011 Update `serialize()` in `GameState.ts` to include `purchasedPrestigeUpgrades` (as array), `prestigeClickMultiplier`, `prestigeGeneratorMultipliers`; update `SerializedGameState` interface accordingly
- [X] T012 Update `hydrate()` in `GameState.ts` to restore `purchasedPrestigeUpgrades`, `prestigeClickMultiplier`, `prestigeGeneratorMultipliers` from save data with safe defaults
- [X] T013 Bump `SaveManager.ts` `CURRENT_VERSION` from `1` to `2`; add v1→v2 migration branch in `load()` that sets missing prestige fields to defaults (empty set / 1 / all-1s) rather than discarding the save
- [X] T014 [P] Extend `tests/unit/GameState.test.ts` with tests for: updated `pucksPerClick`/`pucksPerSecond` with prestige multipliers, `computeRingsFromPrestige`, `buyPrestigeUpgrade` deducts rings + applies effect + dispatches event, `prestige()` preserves prestige fields
- [X] T015 [P] Write integration test `tests/integration/prestigeShop.test.ts` — full flow: reach prestige, confirm rings formula, buy prestige upgrade, prestige again, confirm upgrade persists and multiplier still active; **also cover bulk-buy flow**: after buying `buy-10` upgrade, call `buyGeneratorBulk(id, 10)`, assert generator count increases by exactly 10 and puck balance decreases by `generatorBulkCost(id, 10)`; assert ×10 is disabled when puck balance drops below `generatorBulkCost(id, 10)` and ×1 remains enabled

**Checkpoint**: Foundation ready — all GameState logic is functional and tested. User story UI work can begin.

---

## Phase 3: User Story 1 — Championship Rings Balance (Priority: P1) 🎯 MVP

**Goal**: Persistent, always-visible ring counter that appears after first prestige and survives page reload.

**Independent Test**: Complete one prestige via `window.debug`, verify ring count appears in the stats bar and matches expected value; reload the page and verify it's still correct.

- [X] T016 [US1] Modify `StatsPanel.ts` — add `gamestate:prestige-purchase` to the event subscriptions list (alongside existing `gamestate:prestige`)
- [X] T017 [US1] Modify `StatsPanel.ts` `render()` to show Championship Rings count (`🏆 N rings`) as a stat when `championshipRings > 0`; when 0, show nothing (no "0 rings" display)

**Checkpoint**: User Story 1 complete — rings counter appears after prestige, updates immediately, survives reload.

---

## Phase 4: User Story 2 — Bulk-Buy Generator Buttons (Priority: P1)

**Goal**: ×10 and ×Max buttons appear in the generator shop once the corresponding prestige upgrades are purchased. The ×1 button always remains active.

**Independent Test**: Purchase `buy-10` prestige upgrade via `state.buyPrestigeUpgrade('buy-10')` in console. Verify ×10 button appears per generator row. Click ×10 on an affordable generator and confirm balance decreases by the correct bulk cost and count increases by 10.

- [X] T018 [US2] Modify `Shop.ts` to subscribe to `gamestate:prestige-purchase` (triggers re-render to show newly unlocked bulk buttons)
- [X] T019 [US2] Modify `Shop.ts` `render()` to conditionally render ×10 button per generator row when `state.hasBulkBuy10`; display bulk cost via `state.generatorBulkCost(id, 10)`; disable when player can't afford 10 units; ×1 button unchanged
- [X] T020 [US2] Modify `Shop.ts` `render()` to conditionally render ×Max button per generator row when `state.hasBuyMax`; display cost via `state.generatorBulkCost(id, state.generatorMaxAffordable(id))`; disable when `maxAffordable === 0`; wire click to `state.buyGeneratorBulk(id, state.generatorMaxAffordable(id))`
- [X] T021 [US2] Modify `Shop.ts` `updateAffordability()` to handle ×10 and ×Max button enabled/disabled states using `dataset` attributes on the new buttons
- [X] T022 [US2] Add CSS in `src/styles/` for `.buy-btn-bulk` variants (×10, ×Max) — visually distinct from the base buy button but consistent with the shop's existing style

**Checkpoint**: User Story 2 complete — bulk-buy buttons appear after purchasing upgrades, ×1 always works, ×10/Max correctly disabled when unaffordable.

---

## Phase 5: User Story 3 + User Story 4 — Prestige Shop Panel (Priority: P2)

**Goal**: A new Prestige Shop panel where players spend Championship Rings on permanent upgrades (click-power for US3, generator-tier for US4). Both stories share the same UI component.

**Independent Test (US3)**: Have 2+ rings via debug. Open Prestige Shop, purchase `power-wrist-shot`. Click puck and confirm per-click value is doubled. Prestige and confirm multiplier is still active.

**Independent Test (US4)**: Own 50+ of any generator. Open Prestige Shop, confirm tier-3 upgrade for that generator is unlocked. Purchase it. Confirm pps for that generator increases by the stated multiplier.

- [X] T023 [US3] Add `<div id="prestige-shop"></div>` container to `index.html` in an appropriate panel location (alongside existing shop/upgrades panels)
- [X] T024 [P] [US3] Create `src/ui/PrestigeShop.ts` — class with `constructor(state: GameState)`, `mount()` attaching to `#prestige-shop`, `render()` method; subscribe to `gamestate:prestige` and `gamestate:prestige-purchase` for re-render; show ring balance header
- [X] T025 [US3] Implement prestige upgrade list rendering in `PrestigeShop.ts` — group by type (bulk-buy → click-power → generator-tier); each row shows name, description, ring cost; affordability state (enabled / unaffordable / owned)
- [X] T026 [US3] Wire click handlers in `PrestigeShop.ts` to call `state.buyPrestigeUpgrade(id)` then re-render; no action if already owned or unaffordable
- [X] T027 [US4] Add locked state rendering in `PrestigeShop.ts` for generator-tier upgrades — show ownership threshold requirement and current owned count when not yet met; show as available once threshold is crossed
- [X] T028 [US4] Subscribe `PrestigeShop.ts` to `gamestate:purchase` so generator-tier upgrade availability updates live as the player buys generators (without requiring a prestige)
- [X] T029 [US3] Mount `PrestigeShop` in `src/main.ts` alongside existing UI components
- [X] T030 [US3] Add CSS in `src/styles/` for prestige shop panel — ring cost badge, owned state, locked state, section headers per upgrade type

**Checkpoint**: User Stories 3 and 4 complete — Prestige Shop panel visible and functional; click-power upgrades apply cross-prestige; generator-tier upgrades gated by ownership and unlock live.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T031 [P] Run `npm test` — fix any regressions across `GameState.test.ts`, `PrestigeUpgrades.test.ts`, `prestigeShop.test.ts`, and existing tests
- [X] T032 [P] Run `npm run build` — fix any TypeScript errors introduced by new fields, `import type` correctness, unused variable warnings
- [X] T033 Manually verify edge cases: rings counter hidden at 0 rings; ×1 button stays active when ×10 is disabled; ×Max disabled when broke; prestige shop ring balance updates immediately after purchase; all prestige upgrades survive a prestige reset

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user story phases**
- **Phase 3 (US1)**: Depends on Phase 2 only — no dependency on US2/US3/US4
- **Phase 4 (US2)**: Depends on Phase 2 only — no dependency on US1/US3/US4
- **Phase 5 (US3+US4)**: Depends on Phase 2 only — no dependency on US1/US2
- **Phase 6 (Polish)**: Depends on all desired phases being complete

### User Story Dependencies

| Story | Depends On | Blocks |
|-------|-----------|--------|
| US1 (Rings Counter) | Phase 2 | nothing |
| US2 (Bulk-Buy) | Phase 2 | nothing |
| US3 (Click-Power Shop) | Phase 2 | nothing |
| US4 (Generator Tiers) | Phase 2, T024–T026 (shares PrestigeShop component with US3) | nothing |

### Within Each Phase (ordering)

- Phase 2: T002 → T003–T004 (parallel) → T005–T010 (parallel pairs) → T011 → T012 → T013 → T014–T015 (parallel)
- Phase 3: T016 → T017
- Phase 4: T018 → T019 → T020 → T021 → T022
- Phase 5: T023 → T024 → T025 → T026 → T027–T028 (parallel) → T029 → T030

### Parallel Opportunities

- T003 (write tests) and T004 (add GameState fields) can run in parallel — different files
- T014 and T015 (test files) can run in parallel after T013
- T023 (index.html) and T024 (PrestigeShop.ts skeleton) can run in parallel
- T027 and T028 (both PrestigeShop.ts additions) can run in parallel if on different methods
- T031 and T032 (test + build) can run in parallel

---

## Implementation Strategy

### MVP First (US1 + US2 — both P1)

1. Complete Phase 2: Foundational (all GameState + save logic)
2. Complete Phase 3: US1 (rings counter) — minimal UI change
3. Complete Phase 4: US2 (bulk-buy buttons) — additive to existing shop
4. **STOP and VALIDATE**: Core prestige economy is functional
5. Ship: players can see rings and use bulk-buy

### Incremental Delivery

1. Phase 2 → foundation complete
2. Phase 3 → rings counter visible 🎯
3. Phase 4 → bulk-buy available 🎯
4. Phase 5 → full prestige shop with click-power + generator tiers
5. Phase 6 → polish and validation

---

## Notes

- `gamestate:prestige-purchase` is a **new** CustomEvent — not in the existing event bus; dispatched by `buyPrestigeUpgrade()`
- The ×1 buy button in `Shop.ts` MUST remain unaffected by bulk-buy logic — it always stays active per FR-008
- `prestigeClickMultiplier` and `prestigeGeneratorMultipliers` must NOT appear in the `prestige()` reset block
- Save version migration (T013) must NOT discard v1 saves — use safe defaults
- All `import type` for `SerializedGameState` additions per constitution Principle IV
