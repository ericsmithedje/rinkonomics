# Implementation Plan: Prestige Shop

**Branch**: `002-prestige-shop` | **Date**: 2026-03-05 | **Spec**: [spec.md](./spec.md)

## Summary

Add a Prestige Shop powered by Championship Rings — a persistent currency earned based on how many total pucks the player accumulated before resetting. The shop sells three categories of permanent upgrades: bulk-buy buttons (×10, ×Max) that appear in the generator shop, click-power multipliers that survive prestige resets, and late-game generator upgrade tiers. The ring-earning formula replaces the current flat +1 per prestige with a depth-based award. Save version bumps from 1 → 2 with a migration path.

## Technical Context

**Language/Version**: TypeScript (ES2022), strict mode, `verbatimModuleSyntax`
**Primary Dependencies**: Vite (build), Vitest + jsdom (testing) — no runtime deps
**Storage**: `localStorage` via `SaveManager` (key: `rinkonomics_save`)
**Testing**: Vitest, `tests/unit/` and `tests/integration/`
**Target Platform**: Browser (GitHub Pages, base `/rinkonomics/`)
**Project Type**: Single-page browser game
**Performance Goals**: 60fps game loop (rAF); no per-frame DOM thrashing
**Constraints**: Zero runtime npm dependencies; strict TypeScript; save backward-compat via version migration
**Scale/Scope**: Single player, client-only; ~10 prestige upgrades to start

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Single Source of Truth | ✅ | `GameState` extended; no second instance created |
| II. Event-Driven UI | ✅ | New `gamestate:prestige-purchase` event defined; PrestigeShop subscribes to it |
| III. Data-First Content | ✅ | Prestige upgrades added to `src/data/prestigeUpgrades.ts` array + Map |
| IV. TypeScript Strictness | ✅ | All new fields typed; `import type` used throughout |
| V. Test Coverage | ✅ | Unit tests for new GameState methods; integration test for prestige purchase flow |
| VI. No Runtime Deps | ✅ | No new packages added |
| VII. Simplicity | ✅ | Smallest viable change: separate prestige multiplier fields, no refactor of existing logic |

## Project Structure

### Documentation (this feature)

```text
specs/002-prestige-shop/
├── plan.md              ← this file
├── research.md          ← Phase 0
├── data-model.md        ← Phase 1
└── tasks.md             ← /speckit.tasks output
```

### Source Code (affected files)

```text
src/
├── data/
│   ├── prestigeUpgrades.ts     ← NEW: prestige upgrade definitions
│   ├── upgrades.ts             ← unchanged
│   └── generators.ts           ← unchanged
├── game/
│   └── GameState.ts            ← MODIFIED: new fields, methods, ring formula, prestige fix
├── ui/
│   ├── PrestigeShop.ts         ← NEW: prestige shop panel component
│   ├── Shop.ts                 ← MODIFIED: bulk-buy buttons
│   └── StatsPanel.ts           ← MODIFIED: show ring count
├── main.ts                     ← MODIFIED: mount PrestigeShop
└── styles/                     ← MODIFIED: prestige shop styles

tests/
├── unit/
│   ├── GameState.test.ts       ← MODIFIED: new prestige upgrade tests
│   └── PrestigeUpgrades.test.ts ← NEW
└── integration/
    └── prestigeShop.test.ts    ← NEW
```

---

## Phase 0: Research

### Ring Earning Formula

**Decision**: Logarithmic depth-based formula — `rings = Math.max(1, Math.floor(Math.log10(totalPucksEarned) - 7))`

| Total Pucks at Prestige | Rings Awarded |
|------------------------|---------------|
| 100M (min threshold)   | 1 |
| 1B                     | 2 |
| 10B                    | 3 |
| 100B                   | 4 |

**Rationale**: Prestige unlocks at 100M (milestone 7). A first-time player who prestiges immediately gets 1 ring — enough for "Buy 10" per FR-015/SC-007. Players who grind longer before resetting earn more rings, rewarding depth without requiring multiple runs to get started.

**Alternatives considered**:
- Flat +1/prestige: Too slow to engage the new shop; rejected
- Milestone-count based: All prestiges happen at the same milestone (index 7), so no differentiation; rejected
- Linear per 100M: Gets too fast at high puck counts; rejected

### Prestige Upgrade Persistence Architecture

**Decision**: Two separate multiplier fields — `prestigeClickMultiplier` and `prestigeGeneratorMultipliers` — that are **not** zeroed during `prestige()`. The existing `clickMultiplier` and `generatorMultipliers` continue to be reset as before.

**Rationale**: Smallest change to `prestige()`. No need to recompute or re-apply upgrades after reset. Clean separation of "session upgrade multipliers" vs "permanent prestige multipliers".

**Applied in derived values**:
- `pucksPerClick = baseClickValue × clickMultiplier × prestigeClickMultiplier × prestigeMultiplier`
- Per-generator pps = `owned × basePps × generatorMultipliers[id] × prestigeGeneratorMultipliers[id]`

### Bulk-Buy Cost Formula

**Decision**: Geometric series sum for sequential costs.

For buying N generators of type with `owned` already:
```
cost(N) = baseCost × 1.15^owned × (1.15^N − 1) / 0.15
```

For "Buy Max": binary search N from 1 upward until `cost(N+1) > pucks`.

**Rationale**: Exact formula avoids iterating N times per render. Binary search for Max is O(log N) — negligible for typical quantities.

### New Event

- `gamestate:prestige-purchase` — dispatched by `buyPrestigeUpgrade()` after a successful ring purchase. Shop and StatsPanel subscribe to this to refresh.

### Save Version Migration

- Bump `CURRENT_VERSION` to `2`
- Migration: v1 saves lack `purchasedPrestigeUpgrades`, `prestigeClickMultiplier`, `prestigeGeneratorMultipliers` — all default to empty/1 on load (safe defaults, no data loss)

---

## Phase 1: Data Model

### New Type: `PrestigeUpgradeDefinition`

```
PrestigeUpgradeDefinition
  id: string                              — unique kebab-case identifier
  name: string                            — display name
  description: string                     — flavor + effect
  ringCost: number                        — Championship Rings required
  type: 'click-power' | 'bulk-buy' | 'generator-tier'
  multiplier?: number                     — for click-power and generator-tier
  bulkQuantity?: 10 | 'max'              — for bulk-buy
  targetId?: GeneratorId                  — for generator-tier
  generatorOwnershipThreshold?: number    — for generator-tier unlock gating
```

### Modified: `SerializedGameState` (new fields)

```
purchasedPrestigeUpgrades: string[]       — persists across prestige
prestigeClickMultiplier: number           — persists across prestige
prestigeGeneratorMultipliers: Record<GeneratorId, number>  — persists
```

### Modified: `GameState` (new runtime fields)

```
purchasedPrestigeUpgrades: Set<string>
prestigeClickMultiplier: number           — default 1
prestigeGeneratorMultipliers: Record<GeneratorId, number>  — default all 1
```

### Computed ring award (new method)

```
computeRingsFromPrestige(totalPucksEarned: number): number
  → Math.max(1, Math.floor(Math.log10(totalPucksEarned) - 7))
```

### Generator bulk-buy helpers (new methods)

```
generatorBulkCost(id: GeneratorId, quantity: number): number
  → geometric series sum

generatorMaxAffordable(id: GeneratorId): number
  → binary search using generatorBulkCost

buyGeneratorBulk(id: GeneratorId, quantity: number): boolean
  → validates cost, spends pucks, increments generator count by quantity
  → dispatches gamestate:purchase
```

### Prestige upgrade purchase (new method)

```
buyPrestigeUpgrade(id: string): boolean
  → checks not already owned
  → checks ring balance >= ringCost
  → deducts rings, adds to purchasedPrestigeUpgrades
  → applies effect (click multiplier or generator multiplier)
  → dispatches gamestate:prestige-purchase
```

### Prestige formula update

```
prestige(): boolean
  → rings += computeRingsFromPrestige(totalPucksEarned)  [was: rings++]
  → does NOT reset: championshipRings, purchasedPrestigeUpgrades,
                     prestigeClickMultiplier, prestigeGeneratorMultipliers
```

---

## Phase 2: Implementation Phases

### Phase A — Data & GameState (foundation, no UI)

1. Create `src/data/prestigeUpgrades.ts` with initial upgrade catalog:
   - `buy-10` (bulk-buy, 1 ring)
   - `buy-max` (bulk-buy, 3 rings)
   - `power-wrist-shot` (click-power ×2, 2 rings)
   - `power-slap-shot` (click-power ×3, 5 rings)
   - One tier-3 upgrade per generator (×2 multiplier, threshold: 50 owned, cost: 2–10 rings scaled by generator tier)

2. Extend `GameState`:
   - New fields + serialize/hydrate
   - `computeRingsFromPrestige()`
   - `buyPrestigeUpgrade()`
   - `buyGeneratorBulk()`
   - `generatorBulkCost()` / `generatorMaxAffordable()`
   - Update `prestige()` ring formula
   - Update `pucksPerClick` and `pucksPerSecond` computed getters

3. Bump `SaveManager` to version 2, add v1→v2 migration

4. **Tests first** (constitution V):
   - `tests/unit/PrestigeUpgrades.test.ts` — ring formula, bulkCost, buyPrestigeUpgrade, persistence through prestige
   - Extend `tests/unit/GameState.test.ts` — updated pucksPerClick/pucksPerSecond with prestige multipliers
   - `tests/integration/prestigeShop.test.ts` — full flow: prestige → earn rings → buy upgrade → prestige again → verify persists; **bulk-buy flow**: buy `buy-10` upgrade → call `buyGeneratorBulk(id, 10)` → assert generator count increases by 10 and puck balance decreases by exactly `generatorBulkCost(id, 10)`

### Phase B — UI: Rings Counter + Prestige Shop Panel

1. Modify `StatsPanel.ts`:
   - Show Championship Rings count (`🏆 N rings`) when `championshipRings > 0`
   - Subscribe to `gamestate:prestige-purchase`

2. Create `src/ui/PrestigeShop.ts`:
   - Constructor subscribes to `gamestate:prestige`, `gamestate:prestige-purchase`
   - Renders prestige upgrades grouped by type (bulk-buy → click-power → generator-tier)
   - Shows ring cost, effect, owned/locked/affordable state
   - Generator-tier upgrades show ownership threshold if not met
   - Click handler calls `state.buyPrestigeUpgrade(id)` then re-renders

3. Add prestige shop container to `index.html`

4. Mount `PrestigeShop` in `main.ts`

5. Add CSS for prestige shop panel and ring counter

### Phase C — UI: Bulk-Buy Buttons in Generator Shop

1. Modify `Shop.ts`:
   - Read `state.hasBulkBuy10` and `state.hasBuyMax` (computed getters on GameState)
   - Conditionally render ×10 / ×Max buttons per generator row
   - ×10 shows `generatorBulkCost(id, 10)`, disabled if can't afford 10 (×1 stays enabled)
   - ×Max shows `generatorBulkCost(id, maxAffordable)`, disabled if maxAffordable === 0
   - `updateAffordability()` updated to handle all three button variants
   - Subscribe to `gamestate:prestige-purchase` to re-render when bulk-buy upgrades are purchased

---

## Complexity Tracking

No constitution violations. All changes are incremental extensions to existing patterns.

