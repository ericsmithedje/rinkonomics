# Feature Specification: Rinkonomics — Hockey Incremental Clicker Game

**Feature Branch**: `001-hockey-clicker`  
**Created**: 2026-03-03  
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Click the Puck to Earn Points (Priority: P1)

A new player arrives at the game and sees a large, clickable hockey puck on screen. Every click represents taking a shot on goal. Each shot earns "Pucks" — the game's primary currency. The player's shot count and total Pucks are always visible, giving immediate feedback and a sense of progress.

**Why this priority**: This is the core game loop. Without the ability to click and earn, nothing else in the game functions. It must be the very first thing that works.

**Independent Test**: Launch the game, click the puck 10 times, and verify the Puck counter increases by 10 (one per click). The counter should be visible at all times.

**Acceptance Scenarios**:

1. **Given** the game is loaded, **When** the player clicks the puck, **Then** the Puck counter increases by the current click value (starting at 1 per click)
2. **Given** the player has been clicking, **When** they view the screen, **Then** a running total of Pucks earned and total shots taken is displayed
3. **Given** the player clicks rapidly, **When** many clicks occur in quick succession, **Then** all clicks are registered without loss

---

### User Story 2 - Purchase Upgrades to Automate Puck Generation (Priority: P2)

After accumulating Pucks, the player can spend them in an upgrade shop to unlock automatic puck generators. Each upgrade represents a hockey role or asset — from a Stick Boy who digs pucks out of the net, up to a full Hockey Dynasty. Each generator produces Pucks per second automatically, reducing reliance on manual clicking.

**Why this priority**: Automation is the defining feature of incremental games. Without it, the game has no long-term engagement loop.

**Independent Test**: Purchase the first available upgrade (Stick Boy). Verify Puck balance decreases by the cost, and that the Pucks-per-second counter appears and increments automatically.

**Acceptance Scenarios**:

1. **Given** the player has enough Pucks, **When** they purchase an upgrade, **Then** the Puck balance decreases by the correct cost and the Pucks/second rate increases
2. **Given** the player has purchased at least one generator, **When** time passes without clicking, **Then** Pucks accumulate automatically at the displayed rate
3. **Given** the player cannot afford an upgrade, **When** they attempt to purchase it, **Then** the upgrade is visually disabled and the purchase is blocked
4. **Given** the player owns multiple copies of the same upgrade, **When** they view the shop, **Then** the owned count and cumulative production rate are shown

---

### User Story 3 - Upgrade Individual Click and Generator Power (Priority: P2)

The player can purchase one-time upgrades that permanently boost either the value of a single click or the output of specific generators. For example, "New Composite Stick" doubles click value, or "Power Skating Coach" doubles the output of all Player generators. These upgrades appear in a separate upgrades panel and are unlocked progressively.

**Why this priority**: Upgrades transform the feel of progression from linear to exponential, which is critical for long-term engagement. They are independent of generators but closely related.

**Independent Test**: Purchase the first click upgrade. Verify that subsequent clicks earn more Pucks than before the upgrade was purchased.

**Acceptance Scenarios**:

1. **Given** the player meets the unlock condition, **When** a power upgrade becomes available, **Then** it appears in the upgrades panel with its cost and effect clearly described
2. **Given** the player purchases a click upgrade, **When** they click the puck afterward, **Then** each click yields more Pucks than before
3. **Given** the player purchases a generator upgrade, **When** that generator produces Pucks, **Then** the production rate reflects the multiplier

---

### User Story 4 - Track Progress Through Hockey Milestones (Priority: P3)

As the player accumulates Pucks and generators, they progress through named hockey career milestones: from "Backyard Rink Kid" through "Junior League", "Minor Leagues", "AHL Call-up", "NHL Roster Spot", "All-Star", "Stanley Cup Champion", up to "Hockey Legend." Each milestone unlocks a new set of upgrades, generators, and cosmetic changes to the game's visual theme.

**Why this priority**: Milestones give players long-term goals and a sense of narrative arc, which drives retention beyond the first session.

**Independent Test**: Accumulate the Puck threshold for the first milestone. Verify the milestone title updates, a congratulatory message is shown, and new content becomes visible in the shop.

**Acceptance Scenarios**:

1. **Given** a player reaches a Puck milestone threshold, **When** the threshold is crossed, **Then** the career title updates and a milestone notification is displayed
2. **Given** a new milestone is reached, **When** the player views the shop, **Then** previously locked generators and upgrades become available
3. **Given** the player has reached any milestone, **When** they view their profile area, **Then** their current career title and the next milestone goal are visible

---

### User Story 5 - Prestige / Season Reset for Multiplied Rewards (Priority: P3)

Once the player reaches the highest milestone, they can choose to "Start a New Season" — resetting their Pucks and generators but earning a permanent "Championship Rings" multiplier that boosts all future production. This prestige loop gives experienced players an ongoing reason to play.

**Why this priority**: Prestige is standard in incremental games for long-term replayability but is only needed after the core loop is proven.

**Independent Test**: Reach the prestige threshold. Trigger a new season. Verify Pucks and generators reset, that the Championship Rings count increases by 1, and that the starting production rate is visibly higher than a fresh first run.

**Acceptance Scenarios**:

1. **Given** the prestige condition is met, **When** the player chooses to start a new season, **Then** a confirmation prompt is shown describing exactly what resets and what is kept
2. **Given** the player confirms the reset, **When** the new season begins, **Then** Pucks and generators reset to zero and Championship Rings increase
3. **Given** the player has at least one Championship Ring, **When** they earn Pucks, **Then** the Ring multiplier is visibly applied to the production rate

---

### Edge Cases

- What happens if the player closes the browser mid-session? Progress must be saved and restored on next visit.
- What happens if a player has accumulated so many Pucks the number exceeds standard integer display? Numbers should display in abbreviated notation (e.g., 1.4M, 3.2B).
- What if a player tries to purchase multiple upgrades faster than the balance updates? Purchases must validate against the real-time balance to prevent going negative.
- What happens on first load with no saved data? The game must start in a clean initial state with a brief introductory prompt.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game MUST display a clickable hockey puck as the primary interaction element
- **FR-002**: Each click of the puck MUST increase the player's Puck balance by the current click value
- **FR-003**: The game MUST display the current Puck balance and Pucks-per-second rate at all times
- **FR-004**: The game MUST provide a shop where players can purchase generators using Pucks
- **FR-005**: Generators MUST automatically produce Pucks at their defined rate while the game is open
- **FR-006**: The game MUST provide one-time power upgrades that boost click value or generator output
- **FR-007**: Upgrades MUST become visible only when the player meets their unlock condition
- **FR-008**: The game MUST track and display a career milestone title based on total Pucks earned
- **FR-009**: The game MUST automatically save progress to the browser and restore it on next visit
- **FR-010**: Puck totals MUST display in abbreviated human-readable notation once they exceed 10,000
- **FR-011**: The game MUST offer a prestige ("New Season") mechanic once the final milestone is reached
- **FR-012**: Prestige MUST require explicit player confirmation before resetting progress
- **FR-013**: Championship Rings earned through prestige MUST apply a visible production multiplier in all subsequent runs

### Key Entities

- **Puck**: Primary currency earned by clicking and through generators
- **Championship Ring**: Prestige currency that persists across seasons and applies global multipliers
- **Generator**: An automated hockey role or asset that produces Pucks/second (e.g., Stick Boy, Player, Line Coach, Team, Arena, Franchise)
- **Power Upgrade**: A one-time purchase that permanently multiplies click value or generator output
- **Milestone**: A career-tier threshold based on total all-time Pucks, unlocking new content and changing the career title
- **Save State**: A persistent snapshot of all game data stored in the player's browser

---

## Generator Lineup (Hockey Theme)

The following generator tiers define the automatic puck production ladder, from cheapest to most powerful:

| Tier | Generator Name     | Flavor Description                                      |
|------|--------------------|---------------------------------------------------------|
| 1    | Stick Boy          | Digs pucks out of the net and brings them back to you   |
| 2    | Pee-Wee Player     | A young skater practicing slap shots around the clock   |
| 3    | Junior League Team | A whole line grinding through drills every day          |
| 4    | Scout              | Finds talent and funnels prospects into your pipeline   |
| 5    | Skills Coach       | Runs structured drills that multiply player output      |
| 6    | AHL Affiliate      | A feeder team generating a constant stream of prospects |
| 7    | NHL Roster         | A full professional squad competing for the Cup         |
| 8    | Arena              | Sold-out games producing pucks, fans, and revenue       |
| 9    | Media Empire       | Broadcasts, merch, and sponsorships compounding returns |
| 10   | Hockey Dynasty     | A legendary franchise that generates pucks autonomously |

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new player can understand the core click loop and make their first upgrade purchase within 2 minutes of loading the game, without reading any instructions
- **SC-002**: The game remains playable and responsive with all 10 generator types active simultaneously
- **SC-003**: Player progress (Pucks, generators, upgrades, milestone) is fully restored after closing and reopening the browser
- **SC-004**: A player can reach the first prestige milestone within a single session of reasonable length (estimated 20–40 minutes of active play)
- **SC-005**: Number display never breaks or shows scientific notation — large values are always shown in readable abbreviated form (K, M, B, T)
- **SC-006**: The prestige loop provides a measurably faster path to mid-game content on the second run compared to the first

---

## Assumptions

- The game runs entirely in the browser with no user accounts or server-side storage required for the initial version
- Progress is saved locally in the browser; loss of browser data (clearing storage) is acceptable and documented
- The game is single-player only; no multiplayer or leaderboard features are in scope
- Offline production (earning Pucks while the browser is closed) is out of scope for the initial version
- All monetary values within the game are fictional (Pucks); no real-money transactions are in scope
