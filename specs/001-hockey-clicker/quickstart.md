# Quickstart: Rinkonomics — Hockey Incremental Clicker Game

**Branch**: `001-hockey-clicker` | **Date**: 2026-03-03

---

## Prerequisites

- Node.js 18+ installed
- npm or pnpm

---

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# → Opens http://localhost:5173

# Run tests
npm test

# Run a single test file
npm test -- GameState

# Build for production
npm run build
# → Output in dist/
```

---

## Project Bootstrap (First Time)

The project uses Vite with TypeScript. If starting from scratch:

```bash
npm create vite@latest rinkonomics -- --template vanilla-ts
cd rinkonomics
npm install
npm install -D vitest
```

Add to `package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

---

## Scenario Walkthrough: Core Click Loop (P1)

1. Open http://localhost:5173
2. The game loads with the puck centered on screen and Pucks = 0
3. Click the puck — Puck counter increments by 1
4. Click 10 more times — counter reads 11
5. Total pucks and career title "Backyard Rink Kid" visible in stats bar

**What to verify**: `GameState.pucks` and `GameState.totalPucksEarned` both equal `totalClicks`.

---

## Scenario Walkthrough: First Generator Purchase (P2)

1. Click puck until balance reaches 15
2. The Stick Boy entry in the shop becomes enabled (was greyed out)
3. Click "Buy" — balance drops to 0, Pucks/sec counter appears showing 0.1 pps
4. Wait 10 seconds without clicking — balance reads ~1 puck from automation
5. The next Stick Boy now costs 17 (15 * 1.15, rounded)

**What to verify**: `generators["stick-boy"] === 1`, `pucksPerSecond === 0.1`.

---

## Scenario Walkthrough: Save and Restore

1. Accumulate some pucks and buy at least one generator
2. Close the browser tab
3. Reopen http://localhost:5173
4. Verify exact Puck balance, generator counts, and career title are restored

**What to verify**: `localStorage.getItem("rinkonomics_save")` contains valid JSON before closing.

---

## Scenario Walkthrough: Prestige (New Season)

1. Reach `totalPucksEarned >= 100,000,000` (Hockey Legend milestone)
2. A "New Season" button becomes visible
3. Click it — a modal explains: "Pucks and generators reset. You earn 1 Championship Ring (+10% global production). Are you sure?"
4. Confirm — screen resets to fresh state
5. Click puck — production rate is now 1.1x the base (Ring multiplier applied)

**What to verify**: `championshipRings === 1`, `prestigeMultiplier === 1.1`, `pucks === 0`.

---

## localStorage Debug Commands (Browser Console)

```javascript
// View current save
JSON.parse(localStorage.getItem("rinkonomics_save"))

// Delete save (fresh start)
localStorage.removeItem("rinkonomics_save")

// Manually inject pucks for testing
const s = JSON.parse(localStorage.getItem("rinkonomics_save"))
s.pucks = 1000000
s.totalPucksEarned = 1000000
localStorage.setItem("rinkonomics_save", JSON.stringify(s))
location.reload()
```
