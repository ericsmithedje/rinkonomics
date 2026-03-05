# Feature Specification: Prestige Shop

**Feature Branch**: `002-prestige-shop`
**Created**: 2026-03-05
**Status**: Draft

## Overview

After completing a prestige reset ("New Season"), players earn Championship Rings — a permanent prestige currency. This feature adds a visible Championship Rings counter and a dedicated Prestige Shop where players can spend rings on persistent upgrades that carry across all future seasons: bulk-buy buttons for generators (Buy 10, Buy Max), increased click power multipliers, and additional upgrade tiers for existing generators to support late-game progression. Because the prestige shop introduces multiple ring-cost upgrades, the Championship Ring earning rate must be revisited to ensure the economy feels rewarding rather than grindy.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Championship Rings Balance (Priority: P1)

After completing their first prestige, a player wants to know how many Championship Rings they have and how that currency is growing. The rings counter is always visible so players can plan their prestige shop spending without needing to navigate anywhere.

**Why this priority**: The rings counter is the entry point to the entire prestige economy. Without it, players cannot engage with anything else in this feature.

**Independent Test**: Complete one prestige. Verify a Championship Rings counter appears on screen showing the correct ring count, and that it persists after a page reload.

**Acceptance Scenarios**:

1. **Given** a player has completed at least one prestige, **When** they view the game, **Then** their Championship Rings total is visible in a persistent display area
2. **Given** a player has zero rings (fresh game), **When** they view the game, **Then** the rings counter element is hidden — no ring display appears until after the first prestige completes
3. **Given** a player earns rings via prestige, **When** the prestige completes, **Then** the rings counter updates immediately with the new total
4. **Given** the player reloads the page, **When** the game restores from save, **Then** the rings count matches what was saved

---

### User Story 2 - Purchase Bulk-Buy Generator Buttons (Priority: P1)

A player with Championship Rings visits the Prestige Shop and purchases a "Buy 10" upgrade. From that point on, each generator row in the shop gains a dedicated "×10" button alongside the existing single-buy button. The player can still buy one at a time as before — the new button is purely additive, giving them a faster option when they can afford it.

**Why this priority**: Bulk-buy is the most impactful quality-of-life upgrade for mid-to-late game players. It fundamentally speeds up generator accumulation and provides a clear, tangible reason to prestige.

**Independent Test**: Purchase the "Buy 10" prestige upgrade. Go to the generator shop and verify a new ×10 button appears for each generator alongside the existing buy button. Click it and verify 10 generators are purchased and the cost of 10 is deducted.

**Acceptance Scenarios**:

1. **Given** the player owns the "Buy 10" prestige upgrade, **When** they view the generator shop, **Then** each generator row shows both a ×1 button and a ×10 button
2. **Given** the player clicks the ×10 button, **When** they can afford 10 of that generator, **Then** 10 generators are purchased and the combined cost is deducted from their Puck balance
3. **Given** the player cannot afford 10 of a generator, **When** they view the ×10 button, **Then** the ×10 button is disabled — but the ×1 button remains active and usable
4. **Given** the player owns the "Buy Max" prestige upgrade, **When** they view the generator shop, **Then** a ×Max button also appears alongside ×1 (and ×10, if owned)
5. **Given** the player clicks the ×Max button, **When** they can afford at least 1 of that generator, **Then** the maximum affordable quantity is purchased in one click
6. **Given** the player cannot afford any of a generator, **When** they view the shop, **Then** all buy buttons for that generator (×1, ×10, Max) are disabled

---

### User Story 3 - Purchase Click Power Prestige Upgrades (Priority: P2)

A player spends Championship Rings to permanently boost how many Pucks each manual click produces — beyond what the existing one-time click upgrades provide. These upgrades apply a multiplier that stacks on top of all previous click multipliers and persists through every future season.

**Why this priority**: Click power upgrades give prestige value to players who enjoy the active clicking loop, complementing the passive production focus of bulk-buy modes.

**Independent Test**: Purchase a click power prestige upgrade. Click the puck and verify the pucks-per-click value is higher than before the upgrade, and that the increase persists after a prestige reset.

**Acceptance Scenarios**:

1. **Given** the player purchases a click power prestige upgrade, **When** they click the puck, **Then** each click yields more Pucks than before, with the multiplier clearly stated in the upgrade description
2. **Given** the player prestiges after purchasing a click power upgrade, **When** the new season begins, **Then** the click multiplier from the prestige upgrade is still active
3. **Given** multiple click power prestige upgrades are available, **When** the player views the Prestige Shop, **Then** upgrades are shown in order of increasing power with their ring cost clearly displayed
4. **Given** the player cannot afford a click power upgrade, **When** they view it in the Prestige Shop, **Then** it is visually disabled with the ring cost shown

---

### User Story 4 - Purchase Late-Game Generator Upgrade Tiers (Priority: P2)

A veteran player who owns 50+ of a given generator finds that the existing two upgrade tiers are long since purchased and no longer providing meaningful progression. They visit the Prestige Shop and purchase a third (and optionally fourth) upgrade tier for that generator type, unlocking a further production multiplier.

**Why this priority**: Late-game generator tiers extend the viability of the upgrade system into deep play sessions and are directly motivated by the prestige loop.

**Independent Test**: Own 50+ of one generator type. Purchase the third-tier upgrade for that generator in the Prestige Shop. Verify the generator's pucks-per-second rate increases by the stated multiplier.

**Acceptance Scenarios**:

1. **Given** the player purchases a third-tier generator upgrade in the Prestige Shop, **When** that generator produces pucks, **Then** the production rate reflects the additional multiplier stacked on top of existing upgrades
2. **Given** the player has not met the ownership threshold for a tier-3 upgrade, **When** they view the Prestige Shop, **Then** the upgrade is shown as locked with the requirement clearly stated
3. **Given** the player prestiges after purchasing a generator tier upgrade, **When** the new season begins, **Then** the production multiplier from that prestige upgrade persists
4. **Given** all prestige generator tiers for a generator have been purchased, **When** the player views the Prestige Shop, **Then** those upgrades are shown as "Owned" and cannot be purchased again

---

### Edge Cases

- What if a player clicks ×10 but can only afford fewer than 10? The ×10 button is disabled; the ×1 button remains available so the player is never completely blocked from buying.
- What if "Buy Max" calculates a quantity of 0 (player is broke)? The ×Max button is disabled; no purchase occurs.
- What if a player has enough rings to buy multiple prestige upgrades simultaneously? Each upgrade is purchased individually in sequence; no bundle purchasing.
- What happens when the player has 0 rings and opens the Prestige Shop? The shop is accessible but all items show as unaffordable with their ring cost shown.
- What if the player spends rings and then reloads without saving? Progress is saved immediately on each prestige purchase, consistent with how regular upgrades are handled.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game MUST display the player's Championship Rings balance in a persistent, always-visible location when the player has at least 1 ring
- **FR-002**: The game MUST provide a Prestige Shop accessible from the main UI where Championship Rings can be spent
- **FR-003**: The Prestige Shop MUST list all available prestige upgrades with their ring cost, effect description, and current availability status
- **FR-004**: Prestige upgrades MUST persist across prestige resets — they are never lost when a new season begins
- **FR-005**: The game MUST offer a "Buy 10" prestige upgrade that adds a ×10 button to each generator row in the generator shop
- **FR-006**: The game MUST offer a "Buy Max" prestige upgrade that adds a ×Max button to each generator row in the generator shop
- **FR-007**: The ×10 and ×Max buttons MUST display the cost for the selected quantity rather than the single-unit cost
- **FR-008**: The ×10 button MUST be disabled when the player cannot afford the full quantity of 10; the ×1 button MUST remain active as long as the player can afford at least 1 of that generator — being unable to afford 10 does not disable ×1, but being unable to afford even 1 disables ×1 (aligned with AC#6)
- **FR-009**: The ×Max button MUST be disabled when the player cannot afford any quantity of that generator
- **FR-010**: The game MUST offer at least two tiers of click power prestige upgrades, each providing a stackable multiplier to per-click Puck production
- **FR-011**: The game MUST offer at least one additional upgrade tier (beyond the existing two) for each generator type, purchasable with Championship Rings
- **FR-012**: Late-game generator prestige tiers MUST have an ownership threshold that must be met before they become available for purchase
- **FR-013**: Championship Rings spent on prestige upgrades MUST be deducted from the player's ring balance immediately on purchase
- **FR-014**: The Prestige Shop MUST save purchased upgrades as part of the normal game save, restoring them correctly on page reload
- **FR-015**: The Championship Ring earning formula MUST award enough rings from a full first run (reaching the prestige threshold) that the player can afford at least the "Buy 10" upgrade after their first prestige

### Key Entities

- **Championship Ring**: Prestige currency earned per prestige reset; displayed as a persistent balance; spent in the Prestige Shop; never reset by a new season
- **Prestige Upgrade**: A permanent upgrade purchased with Championship Rings; persists across seasons; categorized as click-power, bulk-buy, or generator-tier
- **Buy Button Set**: The collection of quantity buttons displayed per generator row (always includes ×1; ×10 and ×Max added via prestige upgrades)
- **Generator Tier Upgrade**: An additional production multiplier for a specific generator type, available after an ownership threshold is met; extends the existing upgrade ladder

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A returning player (1+ prestige) can locate the Championship Rings counter and open the Prestige Shop within 10 seconds of loading the game, without instructions
- **SC-002**: All prestige upgrades purchased before a prestige reset are active and correctly applied in the new season immediately upon game start
- **SC-003**: ×Max correctly calculates and purchases the maximum affordable quantity for every generator type without allowing the Puck balance to go negative
- **SC-004**: The Prestige Shop ring balance and upgrade availability update instantly after each purchase, with no stale state visible to the player
- **SC-005**: Late-game generator tier upgrades are reachable within a second prestige run of normal length (not requiring an extraordinary grind beyond reaching the existing late-game generators)
- **SC-006**: All prestige upgrade effects (click multipliers, bulk-buy buttons, generator multipliers) are correctly restored after a page reload
- **SC-007**: A player who completes a full first run (reaches the prestige threshold) earns enough Championship Rings to purchase at least the "Buy 10" prestige upgrade immediately after their first reset

---

## Assumptions

- Championship Rings earned per prestige are determined by how far the player progressed before resetting — specifically, a formula based on total all-time pucks earned at the moment of prestige. The more pucks earned before resetting, the more rings awarded. The exact formula (e.g., floor(log of total pucks), milestone count, or a curve) is a design decision for the planning phase, but the principle is: deeper runs yield more rings
- The Prestige Shop is a new UI panel, distinct from the existing regular upgrades panel and generator shop
- Prestige upgrades are one-time purchases (not repeatable); each upgrade can only be owned once
- ×10 and ×Max buttons affect all generator types uniformly; there is no per-generator bulk-buy setting
- The ring cost for prestige upgrades will be determined during planning; this spec treats costs as design parameters to be balanced
- Offline production is out of scope; bulk-buy calculations only apply during an active session
