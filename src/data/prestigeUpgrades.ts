import type { GeneratorId } from '../game/GameState';

export type PrestigeUpgradeType = 'click-power' | 'bulk-buy' | 'generator-tier';

export interface PrestigeUpgradeDefinition {
  id: string;
  name: string;
  description: string;
  ringCost: number;
  type: PrestigeUpgradeType;
  multiplier?: number;
  bulkQuantity?: 10 | 'max';
  targetId?: GeneratorId;
  generatorOwnershipThreshold?: number;
}

export const prestigeUpgrades: PrestigeUpgradeDefinition[] = [
  // === Bulk-Buy Unlocks ===
  {
    id: 'buy-10',
    name: 'Bulk Purchase',
    description: 'Unlock ×10 buy buttons in the generator shop.',
    ringCost: 1,
    type: 'bulk-buy',
    bulkQuantity: 10,
  },
  {
    id: 'buy-max',
    name: 'Maximum Effort',
    description: 'Unlock ×Max buy buttons to purchase as many generators as you can afford.',
    ringCost: 3,
    type: 'bulk-buy',
    bulkQuantity: 'max',
  },

  // === Click-Power Upgrades ===
  {
    id: 'power-wrist-shot',
    name: 'Wrist Shot Mastery',
    description: 'Permanently doubles your click power across all seasons.',
    ringCost: 2,
    type: 'click-power',
    multiplier: 2,
  },
  {
    id: 'power-slap-shot',
    name: 'Slap Shot Mastery',
    description: 'Permanently triples your click power across all seasons.',
    ringCost: 5,
    type: 'click-power',
    multiplier: 3,
  },

  // === Generator Tier-3 Upgrades (50 owned threshold, ×2 multiplier) ===
  {
    id: 'tier3-stick-boy',
    name: 'Elite Stick Boy Program',
    description: 'Doubles stick boy production permanently. Requires 50 stick boys.',
    ringCost: 2,
    type: 'generator-tier',
    multiplier: 2,
    targetId: 'stick-boy',
    generatorOwnershipThreshold: 50,
  },
  {
    id: 'tier3-pee-wee-player',
    name: 'Pee-Wee Powerhouse Academy',
    description: 'Doubles pee-wee player production permanently. Requires 50 pee-wee players.',
    ringCost: 2,
    type: 'generator-tier',
    multiplier: 2,
    targetId: 'pee-wee-player',
    generatorOwnershipThreshold: 50,
  },
  {
    id: 'tier3-junior-league-team',
    name: 'Junior League Elite Circuit',
    description: 'Doubles junior league team production permanently. Requires 50 teams.',
    ringCost: 3,
    type: 'generator-tier',
    multiplier: 2,
    targetId: 'junior-league-team',
    generatorOwnershipThreshold: 50,
  },
  {
    id: 'tier3-scout',
    name: 'International Scouting Network',
    description: 'Doubles scout production permanently. Requires 50 scouts.',
    ringCost: 4,
    type: 'generator-tier',
    multiplier: 2,
    targetId: 'scout',
    generatorOwnershipThreshold: 50,
  },
  {
    id: 'tier3-skills-coach',
    name: 'Hall of Fame Coaching Staff',
    description: 'Doubles skills coach production permanently. Requires 50 coaches.',
    ringCost: 5,
    type: 'generator-tier',
    multiplier: 2,
    targetId: 'skills-coach',
    generatorOwnershipThreshold: 50,
  },
  {
    id: 'tier3-ahl-affiliate',
    name: 'Premier AHL Partnership',
    description: 'Doubles AHL affiliate production permanently. Requires 50 affiliates.',
    ringCost: 6,
    type: 'generator-tier',
    multiplier: 2,
    targetId: 'ahl-affiliate',
    generatorOwnershipThreshold: 50,
  },
  {
    id: 'tier3-nhl-roster',
    name: 'Dynasty Roster Management',
    description: 'Doubles NHL roster production permanently. Requires 50 rosters.',
    ringCost: 7,
    type: 'generator-tier',
    multiplier: 2,
    targetId: 'nhl-roster',
    generatorOwnershipThreshold: 50,
  },
  {
    id: 'tier3-arena',
    name: 'World-Class Arena Network',
    description: 'Doubles arena production permanently. Requires 50 arenas.',
    ringCost: 8,
    type: 'generator-tier',
    multiplier: 2,
    targetId: 'arena',
    generatorOwnershipThreshold: 50,
  },
  {
    id: 'tier3-media-empire',
    name: 'Global Media Dominance',
    description: 'Doubles media empire production permanently. Requires 50 media empires.',
    ringCost: 9,
    type: 'generator-tier',
    multiplier: 2,
    targetId: 'media-empire',
    generatorOwnershipThreshold: 50,
  },
  {
    id: 'tier3-hockey-dynasty',
    name: 'Eternal Hockey Dynasty',
    description: 'Doubles hockey dynasty production permanently. Requires 50 dynasties.',
    ringCost: 10,
    type: 'generator-tier',
    multiplier: 2,
    targetId: 'hockey-dynasty',
    generatorOwnershipThreshold: 50,
  },
];

export const prestigeUpgradesById = new Map(prestigeUpgrades.map((u) => [u.id, u]));
