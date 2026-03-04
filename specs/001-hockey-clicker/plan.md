# Implementation Plan: Rinkonomics — Hockey Incremental Clicker Game

**Branch**: `001-hockey-clicker` | **Date**: 2026-03-03 | **Spec**: [spec.md](spec.md)

## Summary

Build a browser-based incremental clicker game with a hockey theme. The player clicks a hockey puck to earn "Pucks" (primary currency), purchases automated generators (hockey roles and assets), buys one-time power upgrades, progresses through career milestones, and eventually prestiges via a "New Season" reset. All state is persisted to browser localStorage. No backend required.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: Vite (build/dev server), Vitest (testing)  
**Storage**: Browser localStorage (JSON serialization)  
**Testing**: Vitest (unit + integration)  
**Target Platform**: Modern browsers — Chrome 100+, Firefox 100+, Safari 15+, Edge 100+  
**Project Type**: Single-page web application (fully static, no backend)  
**Performance Goals**: Game loop runs at 60fps; click events register within one animation frame (~16ms); save/load completes in under 50ms  
**Constraints**: No server, no accounts, no network calls after initial page load; must function offline after first visit  
**Scale/Scope**: Single-player; 10 generator tiers; ~40 one-time upgrades; 8 milestone tiers; unbounded prestige cycles

## Constitution Check

*Constitution is an unfilled template — no project-specific gates are defined. No violations.*

**Post-design re-check**: No additions to constitution required. This is a self-contained static web app with no external dependencies or compliance concerns.

## Project Structure

### Documentation (this feature)

```text
specs/001-hockey-clicker/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── save-state.md    # localStorage schema contract
│   └── game-config.md   # Static game data contract
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── index.html
├── main.ts                    # Entry point — bootstraps game, attaches UI
├── styles/
│   └── main.css
├── game/
│   ├── GameState.ts           # Central mutable state object + derived computations
│   ├── GameLoop.ts            # requestAnimationFrame loop; delta-time pps accumulation
│   ├── SaveManager.ts         # localStorage read/write + versioned migration
│   └── NumberFormatter.ts     # Abbreviation formatter (K/M/B/T/Qa/Qi...)
├── data/
│   ├── generators.ts          # Static generator definitions (id, name, cost, pps, flavor)
│   ├── upgrades.ts            # Static upgrade definitions (id, name, cost, effect, unlock)
│   └── milestones.ts          # Static milestone definitions (id, title, threshold, unlocks)
└── ui/
    ├── ClickTarget.ts         # Puck click handler + visual click feedback
    ├── StatsPanel.ts          # Top bar: current pucks, pps, total earned, career title
    ├── Shop.ts                # Generator purchase panel
    ├── UpgradesPanel.ts       # One-time upgrades panel (locked/available/purchased states)
    ├── MilestoneDisplay.ts    # Career title + next milestone progress bar
    └── PrestigeModal.ts       # New Season confirmation dialog

tests/
├── unit/
│   ├── GameState.test.ts      # State mutations, pps calculation, click value
│   ├── NumberFormatter.test.ts # Abbreviation edge cases
│   └── SaveManager.test.ts    # Serialize/deserialize, version migration
└── integration/
    └── purchaseFlow.test.ts   # Buy generator → balance decreases → pps increases
```

**Structure Decision**: Single-project static web app. No backend directory. Source under `src/`, tests under `tests/`. Vite handles bundling with `index.html` at root of `src/`.

## Complexity Tracking

*No constitution violations — section not applicable.*
