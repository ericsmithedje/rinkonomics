# Contract: Game Configuration Schema

**Type**: Static compile-time data definitions  
**Location**: `src/data/`  
**Purpose**: Defines all generators, upgrades, and milestones. This data is read-only at runtime.

---

## Generator Config (`src/data/generators.ts`)

Each entry in the generators array:

```typescript
interface GeneratorDefinition {
  id: string;              // kebab-case unique identifier
  name: string;            // Display name
  flavor: string;          // Tooltip flavor text
  baseCost: number;        // Cost for first unit
  basePps: number;         // Pucks per second per unit (before upgrades/prestige)
  unlockThreshold: number; // totalPucksEarned required to show in shop
}
```

**Full generator list**:

| id                   | name               | baseCost   | basePps | unlockThreshold |
|----------------------|--------------------|------------|---------|-----------------|
| `stick-boy`          | Stick Boy          | 15         | 0.1     | 0               |
| `pee-wee-player`     | Pee-Wee Player     | 100        | 0.5     | 10              |
| `junior-league-team` | Junior League Team | 500        | 4       | 75              |
| `scout`              | Scout              | 2000       | 20      | 400             |
| `skills-coach`       | Skills Coach       | 10000      | 100     | 2000            |
| `ahl-affiliate`      | AHL Affiliate      | 50000      | 400     | 10000           |
| `nhl-roster`         | NHL Roster         | 250000     | 1600    | 50000           |
| `arena`              | Arena              | 1250000    | 6000    | 250000          |
| `media-empire`       | Media Empire       | 7500000    | 20000   | 1000000         |
| `hockey-dynasty`     | Hockey Dynasty     | 50000000   | 65000   | 5000000         |

---

## Upgrade Config (`src/data/upgrades.ts`)

```typescript
type UpgradeUnlockType = "totalPucks" | "generatorOwned" | "totalClicks";

interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: "click" | "generator";
  targetId: string | null;
  multiplier: number;
  unlockType: UpgradeUnlockType;
  unlockValue: number;
}
```

**Sample upgrades (minimum viable set for P1/P2 implementation)**:

| id                    | name                  | cost    | type      | targetId             | mult | unlockType      | unlockValue |
|-----------------------|-----------------------|---------|-----------|----------------------|------|-----------------|-------------|
| `composite-stick`     | Composite Stick       | 100     | click     | null                 | 2    | totalClicks     | 10          |
| `better-tape-job`     | Better Tape Job       | 500     | click     | null                 | 2    | totalPucks      | 1000        |
| `carbon-blade`        | Carbon Blade          | 5000    | click     | null                 | 2    | totalPucks      | 10000       |
| `pro-stick-flex`      | Pro Stick Flex        | 50000   | click     | null                 | 2    | totalPucks      | 100000      |
| `assistant-stick-boy` | Assistant Stick Boy   | 100     | generator | `stick-boy`          | 2    | generatorOwned  | 1           |
| `puck-bag`            | Puck Bag              | 500     | generator | `stick-boy`          | 2    | generatorOwned  | 10          |
| `new-equipment`       | New Equipment         | 2000    | generator | `stick-boy`          | 2    | generatorOwned  | 25          |
| `private-lessons`     | Private Lessons       | 1000    | generator | `pee-wee-player`     | 2    | generatorOwned  | 1           |
| `power-skating`       | Power Skating Coach   | 5000    | generator | `pee-wee-player`     | 2    | generatorOwned  | 10          |
| `video-analysis`      | Video Analysis        | 20000   | generator | `pee-wee-player`     | 2    | generatorOwned  | 25          |
| `team-bus`            | Team Bus              | 5000    | generator | `junior-league-team` | 2    | generatorOwned  | 1           |
| `sponsorship-deal`    | Sponsorship Deal      | 25000   | generator | `junior-league-team` | 2    | generatorOwned  | 10          |

*(Additional upgrades for tiers 4–10 follow the same pattern — 4 upgrades per generator at owned counts: 1, 10, 25, 50)*

---

## Milestone Config (`src/data/milestones.ts`)

```typescript
interface MilestoneDefinition {
  id: string;
  title: string;
  threshold: number;           // totalPucksEarned required
  unlockGenerators: string[];  // Generator IDs that become visible
  unlockUpgrades: string[];    // Upgrade IDs that become visible
  notification: string;        // Toast message shown to player on reaching this tier
}
```

| index | id                      | title                  | threshold   |
|-------|-------------------------|------------------------|-------------|
| 0     | `backyard-rink-kid`     | Backyard Rink Kid      | 0           |
| 1     | `junior-league`         | Junior League          | 100         |
| 2     | `minor-leagues`         | Minor Leagues          | 1000        |
| 3     | `ahl-callup`            | AHL Call-up            | 10000       |
| 4     | `nhl-roster-spot`       | NHL Roster Spot        | 100000      |
| 5     | `all-star`              | All-Star               | 1000000     |
| 6     | `stanley-cup-champion`  | Stanley Cup Champion   | 10000000    |
| 7     | `hockey-legend`         | Hockey Legend          | 100000000   |
