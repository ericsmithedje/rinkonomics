---
description: "Task list for Rinkonomics — Hockey Incremental Clicker Game"
---

# Tasks: Rinkonomics — Hockey Incremental Clicker Game

**Input**: Design documents from `/specs/001-hockey-clicker/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize the Vite + TypeScript project and establish folder structure.

- [X] T001 Initialize Vite project with vanilla-ts template: `npm create vite@latest . -- --template vanilla-ts`
- [X] T002 Install dev dependencies: `npm install -D vitest`
- [X] T003 [P] Configure Vitest in `vite.config.ts` (add `test` block pointing to `tests/`)
- [X] T004 [P] Create folder structure: `src/game/`, `src/data/`, `src/ui/`, `src/styles/`, `tests/unit/`, `tests/integration/`
- [X] T005 [P] Add npm scripts to `package.json`: `dev`, `build`, `preview`, `test`, `test:watch`
- [X] T006 [P] Create `.gitignore` with patterns: `node_modules/`, `dist/`, `.env*`, `*.log`
- [X] T007 Replace default Vite boilerplate: clear `src/main.ts` and `src/style.css` to empty shells

**Checkpoint**: `npm run dev` starts dev server; `npm test` runs (zero tests, exits clean)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required by ALL user stories. No user story work begins until this phase is complete.

⚠️ **CRITICAL**: All user story phases depend on this phase completing first.

- [X] T008 [P] Define `GeneratorDefinition` TypeScript interface and all 10 generator records in `src/data/generators.ts` (ids, names, flavors, baseCost, basePps, unlockThreshold — values from `contracts/game-config.md`)
- [X] T009 [P] Define `UpgradeDefinition` TypeScript interface and all upgrades in `src/data/upgrades.ts` (id, name, description, cost, type, targetId, multiplier, unlockType, unlockValue — full set from `contracts/game-config.md`)
- [X] T010 [P] Define `MilestoneDefinition` TypeScript interface and all 8 milestones in `src/data/milestones.ts` (id, title, threshold, unlockGenerators, unlockUpgrades, notification — values from `contracts/game-config.md`)
- [X] T011 Implement `GameState` class/object in `src/game/GameState.ts`: all fields from `contracts/save-state.md`, derived value computations (`pucksPerClick`, `pucksPerSecond`, `prestigeMultiplier`, `nextGeneratorCost`), and all mutation methods (`addPucks`, `spendPucks`, `incrementGenerator`, `purchaseUpgrade`, `advanceMilestone`, `prestige`)
- [X] T012 Implement `NumberFormatter` in `src/game/NumberFormatter.ts`: `format(n: number): string` returning abbreviated notation (K, M, B, T, Qa, Qi) for values ≥ 10,000; raw integer string below that
- [X] T013 Implement `SaveManager` in `src/game/SaveManager.ts`: `save(state: GameState): void` (JSON serialize → `localStorage.setItem("rinkonomics_save", ...)`), `load(): GameState` (deserialize + default-fill missing fields + version migration stub), `clear(): void`
- [X] T014 Implement `GameLoop` in `src/game/GameLoop.ts`: `start()` / `stop()` wrapping `requestAnimationFrame`; delta-time accumulation calling `state.addPucks(pps * deltaSeconds)` each frame; auto-save every 30 seconds; dispatches `"gameloop:tick"` custom event for UI to subscribe to
- [X] T015 Wire entry point `src/main.ts`: import GameLoop, call `SaveManager.load()`, pass state to `GameLoop.start()`, attach `beforeunload` listener calling `SaveManager.save()`
- [X] T016 Add base layout to `src/index.html`: semantic regions `#stats-bar`, `#click-area`, `#shop`, `#upgrades-panel`, `#milestone-display`, `#prestige-area`; link `src/main.ts` as module
- [X] T017 Add base styles to `src/styles/main.css`: dark ice-rink color scheme, grid layout for panels, disabled-state styles (`.locked`, `.unaffordable`), responsive viewport

**Checkpoint**: `npm run dev` loads a blank but structured page; `GameLoop` ticks in console; save/load round-trips correctly in browser console using debug commands from `quickstart.md`

---

## Phase 3: User Story 1 — Click the Puck to Earn Points (Priority: P1) 🎯 MVP

**Goal**: Player clicks a visible puck, Puck balance increments, stats are always visible.

**Independent Test**: Load game → click puck 10 times → Puck counter reads 10; stats bar shows balance and career title "Backyard Rink Kid" at all times.

- [X] T018 [US1] Implement `ClickTarget` in `src/ui/ClickTarget.ts`: render a `<button id="puck">` inside `#click-area`; on click call `state.addPucksFromClick()` (which increments `totalClicks`, adds `pucksPerClick` to `pucks` and `totalPucksEarned`); dispatch `"gamestate:click"` event
- [X] T019 [US1] Add click animation to `src/styles/main.css`: puck scale-down/up on click (`transform: scale(0.92)` → 100ms back), floating `+N` text label fading out upward
- [X] T020 [US1] Implement `StatsPanel` in `src/ui/StatsPanel.ts`: subscribe to `"gameloop:tick"` and `"gamestate:click"`; update `#stats-bar` innerHTML with current pucks (formatted), pps (formatted), total earned (formatted), career title from `state.currentMilestone.title`
- [X] T021 [US1] Add `addPucksFromClick()` method to `src/game/GameState.ts` if not already present: increments `totalClicks` by 1, adds `pucksPerClick` to `pucks` and `totalPucksEarned`, then calls `checkMilestoneProgression()`
- [X] T022 [US1] Mount `ClickTarget` and `StatsPanel` from `src/main.ts`

**Checkpoint**: User Story 1 independently testable — click puck, counter increments, stats bar shows live values. Matches quickstart.md Scenario 1.

---

## Phase 4: User Story 2 — Purchase Generators to Automate Puck Production (Priority: P2)

**Goal**: Player buys generators from a shop; Pucks accumulate automatically at the displayed pps rate.

**Independent Test**: Click to 15 pucks → buy Stick Boy → balance drops, pps counter shows 0.1 → wait 10 seconds → balance grows without clicking.

- [X] T023 [US2] Add `buyGenerator(id: string): boolean` to `src/game/GameState.ts`: validates `pucks >= nextGeneratorCost(id)`, deducts cost, increments `generators[id]`, recalculates pps, calls `checkUpgradeUnlocks()`, returns success flag
- [X] T024 [US2] Implement `Shop` in `src/ui/Shop.ts`: render a `<div id="shop">` listing all generators; each row shows name, flavor, current cost (formatted), owned count, pps contribution; rows hidden while `totalPucksEarned < generator.unlockThreshold`; "Buy" button disabled (class `unaffordable`) when `pucks < cost`; on click call `state.buyGenerator(id)` and re-render
- [X] T025 [US2] Subscribe `Shop` to `"gameloop:tick"` to refresh affordability state every tick (button classes only — avoid full re-render on every frame; use dirty flag or targeted DOM update)
- [X] T026 [US2] Mount `Shop` from `src/main.ts`
- [X] T027 [US2] Write integration test `tests/integration/purchaseFlow.test.ts`: create fresh `GameState`, set `pucks = 15`, call `buyGenerator("stick-boy")`, assert `pucks === 0`, `generators["stick-boy"] === 1`, `pucksPerSecond === 0.1`

**Checkpoint**: User Story 2 independently testable — generators visible and purchasable, pps counter active. Matches quickstart.md Scenario 2.

---

## Phase 5: User Story 3 — One-Time Power Upgrades (Priority: P2)

**Goal**: Upgrade panel shows unlocked one-time upgrades; purchasing them boosts click value or generator output.

**Independent Test**: Click to 100 pucks → "Composite Stick" upgrade appears → buy it → next click earns 2 pucks instead of 1.

- [X] T028 [US3] Add `buyUpgrade(id: string): boolean` to `src/game/GameState.ts`: validates not already purchased and `pucks >= upgrade.cost`, deducts cost, adds to `purchasedUpgrades`, applies multiplier to `clickMultiplier` or `generatorMultipliers[targetId]`, recalculates pps
- [X] T029 [US3] Add `checkUpgradeUnlocks()` to `src/game/GameState.ts` (called after every click and every purchase): iterate `upgradesData`, for each upgrade not yet purchased check its `unlockType`/`unlockValue` condition against current state; maintain `availableUpgrades: Set<string>` on state
- [X] T030 [US3] Implement `UpgradesPanel` in `src/ui/UpgradesPanel.ts`: render `<div id="upgrades-panel">`; show only upgrades in `state.availableUpgrades` that are not in `state.purchasedUpgrades`; each entry shows name, description, cost; "Buy" button disabled if `pucks < cost`; on click call `state.buyUpgrade(id)` and re-render
- [X] T031 [US3] Subscribe `UpgradesPanel` to `"gameloop:tick"` to refresh affordability; subscribe to `"gamestate:upgradeunlocked"` custom event for immediate panel refresh when new upgrades unlock
- [X] T032 [US3] Mount `UpgradesPanel` from `src/main.ts`

**Checkpoint**: User Story 3 independently testable — Composite Stick upgrade appears at 10 clicks, purchase doubles click value, panel removes purchased upgrade.

---

## Phase 6: User Story 4 — Career Milestone Progression (Priority: P3)

**Goal**: Career title updates as `totalPucksEarned` crosses thresholds; toast notification shown; new shop content unlocks.

**Independent Test**: Set `totalPucksEarned = 100` in DevTools → milestone title changes to "Junior League" → toast notification appears → previously hidden generator appears in shop.

- [X] T033 [US4] Implement `checkMilestoneProgression()` in `src/game/GameState.ts` (called after every puck-earning event): compare `totalPucksEarned` against `milestones[milestoneIndex + 1].threshold`; if exceeded, increment `milestoneIndex`, dispatch `"gamestate:milestone"` event with new milestone data
- [X] T034 [US4] Implement `MilestoneDisplay` in `src/ui/MilestoneDisplay.ts`: render `<div id="milestone-display">` showing current title, a progress bar toward next milestone threshold (width = `totalPucksEarned / nextMilestone.threshold * 100%`), and next milestone label; subscribe to `"gameloop:tick"` for progress bar updates and `"gamestate:milestone"` for title update
- [X] T035 [US4] Implement toast notification system in `src/ui/MilestoneDisplay.ts` (or `src/ui/Toast.ts`): on `"gamestate:milestone"` event, inject a `<div class="toast">` with milestone message into `<body>`, animate in (slide up + fade), auto-remove after 3 seconds
- [X] T036 [US4] Update `Shop.ts` to reactively show newly unlocked generators: subscribe to `"gamestate:milestone"` event and re-evaluate which generator rows are visible (removing `hidden` class for generators whose `unlockThreshold <= totalPucksEarned`)
- [X] T037 [US4] Add toast styles to `src/styles/main.css`: fixed bottom-right positioning, slide-up keyframe animation, 3s auto-fade
- [X] T038 [US4] Mount `MilestoneDisplay` from `src/main.ts`

**Checkpoint**: User Story 4 independently testable — milestones progress and notify; shop content gates by milestone. Debug via console: inject pucks and reload (quickstart.md debug commands).

---

## Phase 7: User Story 5 — Prestige / New Season (Priority: P3)

**Goal**: At Hockey Legend milestone, "New Season" button appears; confirming resets run state and awards one Championship Ring with a persistent production multiplier.

**Independent Test**: Set `milestoneIndex = 7` via DevTools → "New Season" button visible → click → modal explains reset → confirm → pucks = 0, rings = 1, production rate is 1.1x.

- [X] T039 [US5] Add `prestige()` method to `src/game/GameState.ts`: validates `milestoneIndex === 7`; increments `championshipRings`; resets `pucks`, `totalPucksEarned`, `totalClicks`, `generators` (all 0), `purchasedUpgrades` (empty), `generatorMultipliers` (all 1), `clickMultiplier` to 1, `milestoneIndex` to 0; recalculates `prestigeMultiplier = 1 + championshipRings * 0.1`; dispatches `"gamestate:prestige"` event; calls `SaveManager.save()`
- [X] T040 [US5] Implement `PrestigeModal` in `src/ui/PrestigeModal.ts`: render a hidden `<div id="prestige-modal">` overlay; show when `"gamestate:milestone"` fires with index 7 OR when "New Season" button is clicked; modal body lists exactly what resets and what persists; "Confirm New Season" button calls `state.prestige()`; "Cancel" button hides modal
- [X] T041 [US5] Add "New Season" button to `#prestige-area` in `src/index.html`: hidden by default; `PrestigeModal.ts` shows/hides the button based on `state.milestoneIndex === 7`
- [X] T042 [US5] Subscribe `StatsPanel` to `"gamestate:prestige"` event: update displayed `prestigeMultiplier` in stats bar (e.g., "🏆 ×1.1" badge next to pps when rings > 0)
- [X] T043 [US5] Subscribe `Shop`, `UpgradesPanel`, and `MilestoneDisplay` to `"gamestate:prestige"` event: trigger full re-render to reflect reset state
- [X] T044 [US5] Mount `PrestigeModal` from `src/main.ts`
- [X] T045 [US5] Write unit test `tests/unit/GameState.test.ts` — prestige block: verify `championshipRings` increments, `pucks === 0`, `prestigeMultiplier === 1.1` after first prestige; verify `prestigeMultiplier === 1.2` after second prestige

**Checkpoint**: User Story 5 independently testable — New Season button visible at Hockey Legend, modal confirms details, reset executes correctly, ring multiplier reflected in stats. Matches quickstart.md Scenario 4.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final quality, edge cases, and save/restore validation.

- [X] T046 [P] Write unit tests `tests/unit/NumberFormatter.test.ts`: test values 0, 999, 1000, 9999, 10000, 1500000, 1000000000, Number.MAX_SAFE_INTEGER
- [X] T047 [P] Write unit tests `tests/unit/SaveManager.test.ts`: save round-trip (serialize → deserialize → fields match), load with empty localStorage (returns fresh state), load with `saveVersion` mismatch (migration stub applies defaults)
- [X] T048 [P] Write unit tests `tests/unit/GameState.test.ts` — core: click adds `pucksPerClick` to balance and `totalPucksEarned`; `buyGenerator` deducts cost and increases pps; `buyUpgrade` (click type) doubles `clickMultiplier`; `buyUpgrade` (generator type) doubles `generatorMultipliers[targetId]`
- [X] T049 Handle rapid-click race condition in `src/ui/ClickTarget.ts`: after each click, synchronously validate that `pucks` is non-negative before the next purchase is possible (GameState mutations are synchronous so this is free — add assertion/guard in `spendPucks`)
- [X] T050 Handle large number display throughout all UI components: audit all `innerHTML` assignments that render puck values — ensure all pass through `NumberFormatter.format()` before display
- [X] T051 Handle first-load empty state in `src/main.ts`: if `SaveManager.load()` returns a fresh state, show a one-time welcome tooltip near the puck (e.g., "Click the puck to get started!") that dismisses on first click
- [X] T052 Handle `beforeunload` save in `src/main.ts`: ensure `SaveManager.save()` is registered on `window.beforeunload` during initialization (already wired in T015 — verify it fires correctly)
- [X] T053 [P] Responsive layout pass in `src/styles/main.css`: test layout at 375px (mobile), 768px (tablet), 1280px (desktop); shop and upgrades panel stack vertically on mobile
- [X] T054 [P] Run full test suite: `npm test` — all unit and integration tests pass
- [X] T055 [P] Run production build: `npm run build` — no TypeScript errors, `dist/` output is valid
- [X] T056 [P] Validate quickstart.md scenarios manually: run all 4 scenarios from quickstart.md and confirm each acceptance criteria passes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **US1 — Click Loop (Phase 3)**: Depends on Phase 2 only — no story dependencies
- **US2 — Generators (Phase 4)**: Depends on Phase 2; can start in parallel with US1 after Phase 2
- **US3 — Upgrades (Phase 5)**: Depends on Phase 2; can start in parallel with US1/US2 after Phase 2 (T029 reuses `checkUpgradeUnlocks` pattern from US1/US2)
- **US4 — Milestones (Phase 6)**: Depends on Phase 2; benefits from US1 and US2 being complete (milestone events trigger shop updates), but can be implemented independently
- **US5 — Prestige (Phase 7)**: Depends on Phase 2 and US4 (requires `milestoneIndex` to reach 7)
- **Polish (Phase 8)**: Depends on all user story phases complete

### Within Each User Story

- Data definitions (`src/data/`) before state methods (`src/game/GameState.ts`)
- State methods before UI components (`src/ui/`)
- UI components before mounting in `src/main.ts`

### Parallel Opportunities

- T003, T004, T005, T006 all parallel in Phase 1
- T008, T009, T010 all parallel in Phase 2 (different files)
- T018, T020 can run in parallel in Phase 3 (different files)
- T023, T024 can run in parallel in Phase 4 (different files; T024 needs T023 interface only)
- T046, T047, T048 all parallel in Phase 8

---

## Parallel Execution Example: Phase 2 (Foundational)

```text
Parallel batch 1:
  Task: "Define GeneratorDefinition interface + all 10 generators in src/data/generators.ts"
  Task: "Define UpgradeDefinition interface + all upgrades in src/data/upgrades.ts"
  Task: "Define MilestoneDefinition interface + all 8 milestones in src/data/milestones.ts"

Sequential (depends on all above):
  Task: "Implement GameState with all fields, computed values, and mutation methods in src/game/GameState.ts"

Parallel batch 2 (depends on T011 interface only, not full implementation):
  Task: "Implement NumberFormatter in src/game/NumberFormatter.ts"
  Task: "Implement SaveManager in src/game/SaveManager.ts"
  Task: "Implement GameLoop in src/game/GameLoop.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks everything)
3. Complete Phase 3: US1 (Click Loop)
4. **STOP and VALIDATE**: Click puck, verify counter, verify stats bar — Scenario 1 from quickstart.md
5. Commit: `feat: core click loop MVP`

### Incremental Delivery

1. Foundation → Click Loop → commit (playable MVP)
2. + Generators → commit (automation working, Scenario 2 passes)
3. + Upgrades → commit (power upgrades working)
4. + Milestones → commit (progression arc complete)
5. + Prestige → commit (full game loop, Scenario 4 passes)
6. + Polish/Tests → commit (production-ready)

### Parallel Team Strategy

After Phase 2 (Foundational) completes:
- **Dev A**: US1 (Click Loop) + US3 (Upgrades — both are `GameState` + UI focused)
- **Dev B**: US2 (Generators) + US4 (Milestones — both extend shop/display)
- **Dev C**: US5 (Prestige) + Polish/Tests

---

## Notes

- [P] tasks = different files, no shared dependencies — safe to parallelize
- [US*] label maps each task to its user story for traceability
- `src/data/` files are pure configuration — no side effects, safe to write first
- `GameState.ts` is the single source of truth; all UI components read from it, never store their own copies
- All puck values flowing to the DOM MUST pass through `NumberFormatter.format()` (enforced in T050 audit)
- Save state schema is versioned — always increment `saveVersion` in `contracts/save-state.md` before changing the shape
- Each user story phase produces a standalone, demostrable increment — stop at any checkpoint to validate independently
