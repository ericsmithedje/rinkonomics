# Rinkonomics — Copilot Instructions

Hockey-themed incremental clicker game. TypeScript + Vite, no runtime dependencies.

## Commands

```bash
npm run dev          # dev server (localhost:5173)
npm run build        # tsc type-check + vite production build → dist/
npm test             # vitest run (single pass)
npm run test:watch   # vitest watch mode

# Run a single test file
npx vitest run tests/unit/GameState.test.ts
npx vitest run tests/integration/purchaseFlow.test.ts
```

## Architecture

### Data flow

```
SaveManager.load() → GameState → GameLoop (rAF)
                                     ↓ dispatches DOM events
                     UI components subscribe via document.addEventListener
```

`GameState` is the single source of truth — a plain class instance passed by reference to every UI component. **Never create a second `GameState`; always mutate the shared instance.**

### Event bus

UI decoupling is done entirely through DOM `CustomEvent`s on `document`:

| Event | Fired by | Meaning |
|---|---|---|
| `gameloop:tick` | `GameLoop` | Every rAF frame (~60fps) |
| `gamestate:click` | `GameState.addPucksFromClick()` | Puck clicked |
| `gamestate:purchase` | `GameState.buyUpgrade()` | Upgrade bought (pucks spent) |
| `gamestate:upgradeunlocked` | `GameState.checkUpgradeUnlocks()` | New upgrade becomes available |
| `gamestate:milestone` | `GameState.checkMilestoneProgression()` | Milestone crossed |
| `gamestate:prestige` | `GameState.prestige()` | Season reset |

Shop uses a **dirty-flag pattern**: sets `dirtyAffordability = true` on `gamestate:click` and `gamestate:purchase`, then only calls `updateAffordability()` during the next `gameloop:tick`. This avoids per-frame DOM thrashing.

### Static data

All game content lives in `src/data/` as plain arrays + lookup Maps:
- `generators.ts` — 10 generators; exported as `generators[]` and `generatorsById` Map
- `upgrades.ts` — 26 upgrades; exported as `upgrades[]` and `upgradesById` Map
- `milestones.ts` — 8 milestones

**Adding content = adding entries to these arrays.** No other registration required.

### UI components

Each component follows the same pattern: `constructor(state: GameState)` → `mount()` (attaches to a pre-existing DOM element from `index.html`). Dynamic imports in `main.ts` keep the initial bundle smaller.

## Key Conventions

### TypeScript strictness
`verbatimModuleSyntax` is enabled. **Type-only imports must use `import type`:**
```ts
import type { SerializedGameState } from './GameState'; // ✅
import { SerializedGameState } from './GameState';       // ❌ TS error
```

### Affordability checks
Generator affordability: `state.pucks >= state.nextGeneratorCost(id)`  
Cost formula: `baseCost * 1.15^owned` (exponential scaling, `Math.pow`)

When a puck-spending action is added, it **must** dispatch `gamestate:purchase` so the Shop refreshes affordability. See `GameState.buyUpgrade()` for the pattern.

### Numbers
Always format displayed puck values with `format()` from `NumberFormatter`. Abbreviates at K/M/B/T/Qa/Qi above 10,000.

### Save/load
`SaveManager` reads/writes `rinkonomics_save` in `localStorage`. Version is `1`. If `saveVersion < 1`, `load()` returns a fresh `GameState`. Add migration logic inside `SaveManager.load()` when bumping version.

### Prestige
Requires `milestoneIndex === 7`. Each ring adds `+10%` to all puck production (`prestigeMultiplier = 1 + rings * 0.1`). Prestige resets everything except `championshipRings`.

### Debug helpers (DEV only)
```js
window.debug.state          // live GameState reference
window.debug.addPucks(n)    // add n pucks + totalPucksEarned
window.debug.clearSave()    // wipe localStorage save
```

## Testing

Tests live in `tests/unit/` and `tests/integration/`. Vitest runs with jsdom environment (configured in `vite.config.ts`).

Pattern for GameState unit tests — direct state mutation, no DOM setup needed:
```ts
const state = new GameState();
state.pucks = 200;
state.totalClicks = 10;
state.checkUpgradeUnlocks(); // required before buyUpgrade
state.buyUpgrade('composite-stick');
```

To test event dispatch, listen on `document` before the action:
```ts
const listener = vi.fn();
document.addEventListener('gamestate:purchase', listener, { once: true });
state.buyUpgrade('composite-stick');
expect(listener).toHaveBeenCalledTimes(1);
```

## Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages on push to `main`. Vite `base` is set to `/rinkonomics/` in `vite.config.ts` — required for correct asset paths under the Pages subdirectory.
