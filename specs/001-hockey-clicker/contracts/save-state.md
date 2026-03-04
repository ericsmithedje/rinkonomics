# Contract: Save State Schema

**Type**: localStorage persistence contract  
**Key**: `rinkonomics_save`  
**Format**: JSON string  
**Version**: 1

---

## Schema

```json
{
  "saveVersion": 1,
  "pucks": 0.0,
  "totalPucksEarned": 0.0,
  "totalClicks": 0,
  "baseClickValue": 1,
  "clickMultiplier": 1.0,
  "generators": {
    "stick-boy": 0,
    "pee-wee-player": 0,
    "junior-league-team": 0,
    "scout": 0,
    "skills-coach": 0,
    "ahl-affiliate": 0,
    "nhl-roster": 0,
    "arena": 0,
    "media-empire": 0,
    "hockey-dynasty": 0
  },
  "purchasedUpgrades": [],
  "milestoneIndex": 0,
  "championshipRings": 0,
  "generatorMultipliers": {
    "stick-boy": 1.0,
    "pee-wee-player": 1.0,
    "junior-league-team": 1.0,
    "scout": 1.0,
    "skills-coach": 1.0,
    "ahl-affiliate": 1.0,
    "nhl-roster": 1.0,
    "arena": 1.0,
    "media-empire": 1.0,
    "hockey-dynasty": 1.0
  },
  "lastSaveTimestamp": 1709000000000
}
```

---

## Field Rules

| Field                 | Type            | Constraints                                            |
|-----------------------|-----------------|--------------------------------------------------------|
| `saveVersion`         | integer         | Must equal `1` (current); triggers migration if lower |
| `pucks`               | float ≥ 0       | Never negative; capped by Number.MAX_SAFE_INTEGER      |
| `totalPucksEarned`    | float ≥ 0       | Never decreases (monotonically increasing)             |
| `totalClicks`         | integer ≥ 0     | Never decreases                                        |
| `baseClickValue`      | float ≥ 1       | Always ≥ 1                                             |
| `clickMultiplier`     | float ≥ 1       | Product of all purchased click upgrade multipliers     |
| `generators`          | object          | All 10 keys must be present; values are integers ≥ 0  |
| `purchasedUpgrades`   | string[]        | Array of upgrade IDs; no duplicates                    |
| `milestoneIndex`      | integer 0–7     | Index into milestones array                            |
| `championshipRings`   | integer ≥ 0     | Persists across New Season resets                      |
| `generatorMultipliers`| object          | All 10 keys must be present; values are floats ≥ 1    |
| `lastSaveTimestamp`   | integer         | Unix milliseconds                                      |

---

## Migration Rules

When loading a save where `saveVersion < 1`:
- No migration needed (version 1 is initial release)

When loading a save where `saveVersion > 1` (future):
- Load as-is; unrecognized fields are ignored
- Missing fields receive their default values

---

## Invariants

- `pucks` ≤ `totalPucksEarned` is NOT guaranteed (player spends pucks)
- `totalPucksEarned` is the only monotonically increasing value
- After a New Season: `pucks`, `totalPucksEarned`, `totalClicks`, `generators`, `purchasedUpgrades`, `generatorMultipliers` all reset; `championshipRings` and `saveVersion` persist
