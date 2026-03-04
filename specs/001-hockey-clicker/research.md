# Research: Rinkonomics — Hockey Incremental Clicker Game

**Branch**: `001-hockey-clicker` | **Date**: 2026-03-03

---

## Decision 1: Technology Stack — Vanilla TypeScript + Vite

**Decision**: Use TypeScript 5.x with Vite as the build tool. No UI framework (no React/Vue/Svelte).

**Rationale**: Incremental clicker games are fundamentally DOM manipulation + a game loop. Cookie Clicker, the genre benchmark, is built on vanilla JS. Frameworks add abstraction overhead that doesn't benefit a game where the "render cycle" is driven by `requestAnimationFrame`, not reactive state diffing. Vite provides fast HMR for development and produces a compact static bundle with zero runtime overhead.

**Alternatives considered**:
- *React*: Adds ~45KB runtime and a virtual DOM reconciler that fights the game loop model (frequent fine-grained numeric updates). Rejected.
- *Phaser.js*: Full game engine, canvas-based. Overkill for a clicker game that is primarily DOM/CSS with one click target. Adds ~1MB to bundle. Rejected.
- *No build tool (raw HTML/JS)*: Viable but loses type safety, module resolution, and test tooling integration. Rejected.

---

## Decision 2: Number Representation — IEEE 754 Double (JavaScript Number)

**Decision**: Use standard JavaScript `Number` (IEEE 754 double-precision float) throughout. No BigInt, no external large-number library.

**Rationale**: JavaScript `Number` can represent integers precisely up to 2^53 (~9 quadrillion). The gameplay ceiling for a single prestige run is estimated at ~100 billion pucks (final milestone). With 10 prestige rings the global multiplier is ~2x, so even over 100 prestige cycles production stays well inside safe integer range. Abbreviated display (K/M/B/T/Qa) handles readability. Using BigInt would require serialization conversion and breaks all math operators.

**Alternatives considered**:
- *break_infinity.js*: Supports values up to 10^(10^15). Needed for games like "Universal Paperclips" that run for months. Not needed here — prestige resets prevent unbounded accumulation. Rejected for initial version (can be added later if needed).
- *decimal.js*: Arbitrary precision, but large bundle and slow. Rejected.

---

## Decision 3: Save/Persistence — localStorage with JSON + Version Field

**Decision**: Serialize the full game state to a single `rinkonomics_save` localStorage key as JSON. Include a `saveVersion` integer field. On load, run a migration function if version differs.

**Rationale**: localStorage is universally supported, synchronous (no async complexity), and appropriate for single-player browser game saves of this size (save state JSON will be <5KB). Auto-save every 30 seconds + on page unload (`beforeunload` event).

**Alternatives considered**:
- *IndexedDB*: Async, more complex, better for large data. Not needed at <5KB save size. Rejected.
- *sessionStorage*: Does not persist across tab close. Rejected.
- *Cookie*: Size-limited to 4KB, sent with HTTP requests. Rejected.

---

## Decision 4: Game Loop — requestAnimationFrame with Delta-Time Accumulation

**Decision**: Run a `requestAnimationFrame` loop. Each frame computes `deltaSeconds = (now - lastTimestamp) / 1000` and adds `pucksPerSecond * deltaSeconds` to the balance. UI updates on every frame for smooth pps display.

**Rationale**: This is the standard approach for browser incremental games. Delta-time ensures production is frame-rate independent (correct on 30fps, 60fps, 144fps devices). The loop is cheap — no physics, no sprites, just arithmetic and DOM text updates.

**Alternatives considered**:
- *setInterval (fixed tick)*: Simpler but not frame-rate independent and subject to timer throttling in background tabs. Rejected.
- *Web Workers for game logic*: Would allow background-tab production but spec explicitly excludes offline production. Rejected.

---

## Decision 5: Generator Cost Scaling — 1.15x Multiplier (Cookie Clicker Standard)

**Decision**: Each subsequent purchase of the same generator costs `baseCost * 1.15^owned`. This is the industry standard for incremental games.

**Rationale**: The 1.15x multiplier creates a smooth exponential cost curve that stays engaging — each purchase takes ~15% longer than the last, but power upgrades and generator upgrades provide periodic "breakthroughs" that reset the feel of progress.

**Generator base values** (balanced for ~30-minute first prestige run):

| Tier | Name               | Base Cost  | Base PPS  |
|------|--------------------|------------|-----------|
| 1    | Stick Boy          | 15         | 0.1       |
| 2    | Pee-Wee Player     | 100        | 0.5       |
| 3    | Junior League Team | 500        | 4         |
| 4    | Scout              | 2,000      | 20        |
| 5    | Skills Coach       | 10,000     | 100       |
| 6    | AHL Affiliate      | 50,000     | 400       |
| 7    | NHL Roster         | 250,000    | 1,600     |
| 8    | Arena              | 1,250,000  | 6,000     |
| 9    | Media Empire       | 7,500,000  | 20,000    |
| 10   | Hockey Dynasty     | 50,000,000 | 65,000    |

---

## Decision 6: Upgrade Unlock Conditions

**Decision**: Upgrades unlock based on either (a) owning N of a specific generator, or (b) total pucks earned crossing a threshold. Each generator gets 4 upgrades (at 1, 10, 25, 50 owned). Click upgrades unlock at puck thresholds.

**Rationale**: Generator-count unlocks are self-reinforcing (buying more unlocks better upgrades, incentivizing continued purchase). Puck-threshold unlocks for click upgrades keep the clicking interaction relevant even as automation grows.

**Sample upgrades**:

| ID | Name                  | Cost      | Effect                        | Unlock Condition              |
|----|-----------------------|-----------|-------------------------------|-------------------------------|
| u1 | Composite Stick       | 100       | Click value x2                | 10 total clicks               |
| u2 | Better Tape Job       | 500       | Click value x2                | 1,000 pucks earned            |
| u3 | Assistant Stick Boy   | 100       | Stick Boy output x2           | Own 1 Stick Boy               |
| u4 | Puck Bag              | 500       | Stick Boy output x2           | Own 10 Stick Boys             |
| u5 | Private Lessons       | 1,000     | Pee-Wee Player output x2      | Own 1 Pee-Wee Player          |
| u6 | Power Skating Coach   | 5,000     | Pee-Wee Player output x2      | Own 10 Pee-Wee Players        |

---

## Decision 7: Prestige Multiplier Formula

**Decision**: Each Championship Ring grants a +10% global production multiplier, stacking multiplicatively. Formula: `prestigeMultiplier = (1 + rings * 0.1)`. So 1 ring = 1.1x, 5 rings = 1.5x, 10 rings = 2.0x.

**Rationale**: Linear additive stacking is simple to understand and communicate to the player. It provides meaningful but not overwhelming advantages per ring, encouraging multiple prestige cycles without making early rings feel irrelevant.

**Alternatives considered**:
- *Exponential stacking* (e.g., 1.1^rings): Grows too fast — 10 rings = 2.6x, 20 rings = 6.7x. Creates runaway late-game. Rejected.
- *Separate multiplier per generator*: More complex tracking, harder to explain to player. Rejected.

---

## Decision 8: Testing Strategy — Vitest (Unit) + Integration Tests

**Decision**: Use Vitest for all tests. Unit tests cover pure functions (GameState mutations, NumberFormatter, SaveManager). Integration tests cover the purchase flow and milestone progression.

**Rationale**: Vitest is the natural companion to Vite — same config file, same module resolution, near-instant test execution. No separate Jest configuration needed.
