# Data Model: Rinkonomics — Hockey Incremental Clicker Game

**Branch**: `001-hockey-clicker` | **Date**: 2026-03-03

---

## Runtime Game State

The single mutable state object held in memory during play. Persisted to localStorage on save.

### GameState

| Field                | Type       | Description                                                              |
|----------------------|------------|--------------------------------------------------------------------------|
| `saveVersion`        | `number`   | Integer schema version; used for migration on load. Current: `1`        |
| `pucks`              | `number`   | Current spendable Puck balance                                           |
| `totalPucksEarned`   | `number`   | All-time Pucks earned (never decreases); drives milestone progression    |
| `totalClicks`        | `number`   | All-time click count; drives click-based upgrade unlocks                 |
| `baseClickValue`     | `number`   | Pucks earned per click before multipliers. Starts at `1`                |
| `clickMultiplier`    | `number`   | Cumulative multiplier from click upgrades. Starts at `1`                |
| `generators`         | `Record<GeneratorId, number>` | Map of generator ID → quantity owned             |
| `purchasedUpgrades`  | `Set<UpgradeId>` | Set of IDs of one-time upgrades already purchased                 |
| `milestoneIndex`     | `number`   | Index into the milestones array; the player's current career tier       |
| `championshipRings`  | `number`   | Prestige currency; accumulates across New Season resets                 |
| `lastSaveTimestamp`  | `number`   | Unix ms timestamp of last save; for future offline production feature   |

### Derived / Computed Values (not stored, recalculated on state change)

| Computed Field      | Formula                                                                  |
|---------------------|--------------------------------------------------------------------------|
| `pucksPerClick`     | `baseClickValue * clickMultiplier * prestigeMultiplier`                  |
| `pucksPerSecond`    | `Σ (generators[g.id] * g.basePps * generatorMultiplier(g.id)) * prestigeMultiplier` |
| `prestigeMultiplier`| `1 + championshipRings * 0.1`                                            |
| `nextGeneratorCost` | `g.baseCost * 1.15 ^ generators[g.id]`                                   |

---

## Static Game Data (immutable configuration)

These objects are defined at compile time and never change. They are NOT part of the save state.

### GeneratorDefinition

| Field            | Type     | Description                                             |
|------------------|----------|---------------------------------------------------------|
| `id`             | `string` | Unique identifier, e.g. `"stick-boy"`                  |
| `name`           | `string` | Display name, e.g. `"Stick Boy"`                        |
| `flavor`         | `string` | Tooltip flavor text                                     |
| `baseCost`       | `number` | Cost to buy first unit                                  |
| `basePps`        | `number` | Pucks-per-second produced by one unit before upgrades  |
| `unlockThreshold`| `number` | Total pucks earned required before this tier is visible |

**All 10 generators** (see research.md for values):
`stick-boy`, `pee-wee-player`, `junior-league-team`, `scout`, `skills-coach`,
`ahl-affiliate`, `nhl-roster`, `arena`, `media-empire`, `hockey-dynasty`

### UpgradeDefinition

| Field          | Type                       | Description                                              |
|----------------|----------------------------|----------------------------------------------------------|
| `id`           | `string`                   | Unique identifier                                        |
| `name`         | `string`                   | Display name                                             |
| `description`  | `string`                   | Plain-language effect description                        |
| `cost`         | `number`                   | One-time Puck cost                                       |
| `type`         | `"click" \| "generator"`   | What this upgrade affects                                |
| `targetId`     | `string \| null`           | Generator ID this applies to (null for click upgrades)  |
| `multiplier`   | `number`                   | Output multiplier applied (e.g., `2` = doubles output)  |
| `unlockType`   | `"totalPucks" \| "generatorOwned" \| "totalClicks"` | What triggers availability |
| `unlockValue`  | `number`                   | Threshold for the unlock condition                       |

### MilestoneDefinition

| Field              | Type       | Description                                                   |
|--------------------|------------|---------------------------------------------------------------|
| `id`               | `string`   | Unique identifier                                             |
| `title`            | `string`   | Career title displayed to player                              |
| `threshold`        | `number`   | Total pucks earned required to reach this milestone           |
| `unlockGenerators` | `string[]` | Generator IDs newly available at this milestone               |
| `unlockUpgrades`   | `string[]` | Upgrade IDs newly available at this milestone                 |

**All 8 milestones**:

| Index | Title                  | Threshold (total pucks) |
|-------|------------------------|-------------------------|
| 0     | Backyard Rink Kid      | 0 (starting state)      |
| 1     | Junior League          | 100                     |
| 2     | Minor Leagues          | 1,000                   |
| 3     | AHL Call-up            | 10,000                  |
| 4     | NHL Roster Spot        | 100,000                 |
| 5     | All-Star               | 1,000,000               |
| 6     | Stanley Cup Champion   | 10,000,000              |
| 7     | Hockey Legend          | 100,000,000 (prestige unlocked) |

---

## State Transitions

### Click Flow
```
Player clicks puck
  → totalClicks++
  → pucks += pucksPerClick
  → totalPucksEarned += pucksPerClick
  → checkMilestoneProgression()
  → checkUpgradeUnlocks()
  → triggerClickAnimation()
```

### Generator Purchase Flow
```
Player clicks "Buy" on generator G
  → if pucks < nextGeneratorCost(G): reject (UI already disabled)
  → pucks -= nextGeneratorCost(G)
  → generators[G.id]++
  → recalculatePps()
  → checkUpgradeUnlocks()
  → scheduleSave()
```

### Upgrade Purchase Flow
```
Player clicks available upgrade U
  → if pucks < U.cost: reject
  → pucks -= U.cost
  → purchasedUpgrades.add(U.id)
  → if U.type == "click": clickMultiplier *= U.multiplier
  → if U.type == "generator": generatorMultipliers[U.targetId] *= U.multiplier
  → recalculatePps()
  → scheduleSave()
```

### Prestige (New Season) Flow
```
Player clicks "New Season"
  → if milestoneIndex < 7: reject (not yet eligible)
  → Show PrestigeModal (confirm/cancel)
  → On confirm:
      → championshipRings++
      → pucks = 0
      → totalPucksEarned = 0
      → totalClicks = 0
      → generators = {} (all zeroed)
      → purchasedUpgrades = {} (cleared)
      → milestoneIndex = 0
      → baseClickValue = 1
      → clickMultiplier = 1
      → generatorMultipliers = {} (cleared)
      → prestigeMultiplier = 1 + championshipRings * 0.1 (recalculated)
      → scheduleSave()
```

### Auto-Save
```
Every 30 seconds (and on beforeunload):
  → serialize GameState to JSON
  → localStorage.setItem("rinkonomics_save", json)
```

### Load / Restore
```
On game init:
  → raw = localStorage.getItem("rinkonomics_save")
  → if null: initialize fresh state
  → else: parse JSON
      → if saveVersion < current: run migrations
      → hydrate GameState
      → recalculatePps()
      → start GameLoop
```
