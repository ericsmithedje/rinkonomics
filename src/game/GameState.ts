import { generators, generatorsById } from '../data/generators';
import { upgrades, upgradesById } from '../data/upgrades';
import { milestones } from '../data/milestones';
import { prestigeUpgradesById } from '../data/prestigeUpgrades';

export type GeneratorId = string;
export type UpgradeId = string;

export interface SerializedGameState {
  saveVersion: number;
  pucks: number;
  totalPucksEarned: number;
  totalClicks: number;
  baseClickValue: number;
  clickMultiplier: number;
  generators: Record<GeneratorId, number>;
  purchasedUpgrades: UpgradeId[];
  milestoneIndex: number;
  championshipRings: number;
  generatorMultipliers: Record<GeneratorId, number>;
  lastSaveTimestamp: number;
  // v2 prestige fields
  purchasedPrestigeUpgrades: string[];
  prestigeClickMultiplier: number;
  prestigeGeneratorMultipliers: Record<GeneratorId, number>;
  hasEverPrestiged: boolean;
}

export class GameState {
  saveVersion = 2;
  pucks = 0;
  totalPucksEarned = 0;
  totalClicks = 0;
  baseClickValue = 1;
  clickMultiplier = 1;
  generators: Record<GeneratorId, number>;
  purchasedUpgrades: Set<UpgradeId>;
  availableUpgrades: Set<UpgradeId>;
  milestoneIndex = 0;
  championshipRings = 0;
  generatorMultipliers: Record<GeneratorId, number>;
  lastSaveTimestamp = Date.now();
  // v2 prestige fields — NOT reset on prestige()
  purchasedPrestigeUpgrades: Set<string>;
  prestigeClickMultiplier = 1;
  prestigeGeneratorMultipliers: Record<GeneratorId, number>;
  hasEverPrestiged = false;

  constructor() {
    this.generators = Object.fromEntries(generators.map((g) => [g.id, 0]));
    this.generatorMultipliers = Object.fromEntries(generators.map((g) => [g.id, 1]));
    this.purchasedUpgrades = new Set();
    this.availableUpgrades = new Set();
    this.purchasedPrestigeUpgrades = new Set();
    this.prestigeGeneratorMultipliers = Object.fromEntries(generators.map((g) => [g.id, 1]));
  }

  // === Derived / Computed Values ===

  get prestigeMultiplier(): number {
    return 1 + this.championshipRings * 0.1;
  }

  get pucksPerClick(): number {
    return this.baseClickValue * this.clickMultiplier * this.prestigeClickMultiplier * this.prestigeMultiplier;
  }

  get pucksPerSecond(): number {
    let total = 0;
    for (const gen of generators) {
      total += this.generators[gen.id] * gen.basePps * this.generatorMultipliers[gen.id] * this.prestigeGeneratorMultipliers[gen.id];
    }
    return total * this.prestigeMultiplier;
  }

  get hasBulkBuy10(): boolean {
    return this.purchasedPrestigeUpgrades.has('buy-10');
  }

  get hasBuyMax(): boolean {
    return this.purchasedPrestigeUpgrades.has('buy-max');
  }

  nextGeneratorCost(id: GeneratorId): number {
    const gen = generatorsById.get(id);
    if (!gen) return Infinity;
    return gen.baseCost * Math.pow(1.15, this.generators[id]);
  }

  // === Bulk-Buy Helpers (T008) ===

  generatorBulkCost(id: GeneratorId, quantity: number): number {
    const gen = generatorsById.get(id);
    if (!gen) return Infinity;
    const owned = this.generators[id];
    // Geometric series: baseCost × 1.15^owned × (1.15^N − 1) / 0.15
    return gen.baseCost * Math.pow(1.15, owned) * (Math.pow(1.15, quantity) - 1) / 0.15;
  }

  generatorMaxAffordable(id: GeneratorId): number {
    if (this.generatorBulkCost(id, 1) > this.pucks) return 0;
    // Find upper bound via doubling
    let hi = 1;
    while (this.generatorBulkCost(id, hi) <= this.pucks) {
      hi *= 2;
    }
    // Binary search between hi/2 and hi
    let lo = Math.floor(hi / 2);
    while (lo < hi - 1) {
      const mid = Math.floor((lo + hi) / 2);
      if (this.generatorBulkCost(id, mid) <= this.pucks) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return lo;
  }

  buyGeneratorBulk(id: GeneratorId, quantity: number): boolean {
    if (quantity <= 0) return false;
    const cost = this.generatorBulkCost(id, quantity);
    if (!this.spendPucks(cost)) return false;
    this.generators[id] += quantity;
    this.checkUpgradeUnlocks();
    document.dispatchEvent(new CustomEvent('gamestate:purchase'));
    return true;
  }

  // === Ring Formula (T007) ===

  computeRingsFromPrestige(totalPucksEarned: number): number {
    return Math.max(1, Math.floor(Math.log10(totalPucksEarned) - 7));
  }

  get currentMilestone() {
    return milestones[this.milestoneIndex];
  }

  get nextMilestone() {
    return milestones[this.milestoneIndex + 1] ?? null;
  }

  // === Mutation Methods ===

  addPucks(amount: number): void {
    this.pucks = Math.max(0, this.pucks + amount);
  }

  spendPucks(amount: number): boolean {
    if (this.pucks < amount) return false;
    this.pucks -= amount;
    if (this.pucks < 0) this.pucks = 0; // guard against floating point
    return true;
  }

  addPucksFromClick(): void {
    this.totalClicks++;
    const earned = this.pucksPerClick;
    this.pucks += earned;
    this.totalPucksEarned += earned;
    this.checkMilestoneProgression();
    this.checkUpgradeUnlocks();
    document.dispatchEvent(new CustomEvent('gamestate:click'));
  }

  buyGenerator(id: GeneratorId): boolean {
    const cost = this.nextGeneratorCost(id);
    if (!this.spendPucks(cost)) return false;
    this.generators[id]++;
    this.checkUpgradeUnlocks();
    return true;
  }

  buyUpgrade(id: UpgradeId): boolean {
    if (this.purchasedUpgrades.has(id)) return false;
    const upgrade = upgradesById.get(id);
    if (!upgrade) return false;
    if (!this.spendPucks(upgrade.cost)) return false;
    this.purchasedUpgrades.add(id);
    this.availableUpgrades.delete(id);
    if (upgrade.type === 'click') {
      this.clickMultiplier *= upgrade.multiplier;
    } else if (upgrade.type === 'generator' && upgrade.targetId) {
      this.generatorMultipliers[upgrade.targetId] = (this.generatorMultipliers[upgrade.targetId] ?? 1) * upgrade.multiplier;
    }
    document.dispatchEvent(new CustomEvent('gamestate:purchase'));
    return true;
  }

  // === Prestige Upgrade Purchase (T009) ===

  buyPrestigeUpgrade(id: string): boolean {
    if (this.purchasedPrestigeUpgrades.has(id)) return false;
    const upgrade = prestigeUpgradesById.get(id);
    if (!upgrade) return false;
    if (this.championshipRings < upgrade.ringCost) return false;
    // Check generator ownership threshold for generator-tier upgrades
    if (upgrade.type === 'generator-tier' && upgrade.generatorOwnershipThreshold != null && upgrade.targetId) {
      if ((this.generators[upgrade.targetId] ?? 0) < upgrade.generatorOwnershipThreshold) return false;
    }
    this.championshipRings -= upgrade.ringCost;
    this.purchasedPrestigeUpgrades.add(id);
    // Apply effect
    if (upgrade.type === 'click-power' && upgrade.multiplier != null) {
      this.prestigeClickMultiplier *= upgrade.multiplier;
    } else if (upgrade.type === 'generator-tier' && upgrade.targetId != null && upgrade.multiplier != null) {
      this.prestigeGeneratorMultipliers[upgrade.targetId] =
        (this.prestigeGeneratorMultipliers[upgrade.targetId] ?? 1) * upgrade.multiplier;
    }
    // bulk-buy type has no immediate numeric effect — hasBulkBuy10/hasBuyMax getters handle UI
    document.dispatchEvent(new CustomEvent('gamestate:prestige-purchase'));
    return true;
  }

  checkUpgradeUnlocks(): void {
    let newUnlock = false;
    for (const upgrade of upgrades) {
      if (this.purchasedUpgrades.has(upgrade.id)) continue;
      if (this.availableUpgrades.has(upgrade.id)) continue;
      let unlocked = false;
      switch (upgrade.unlockType) {
        case 'totalClicks':
          unlocked = this.totalClicks >= upgrade.unlockValue;
          break;
        case 'totalPucks':
          unlocked = this.totalPucksEarned >= upgrade.unlockValue;
          break;
        case 'generatorOwned':
          unlocked = upgrade.targetId != null && this.generators[upgrade.targetId] >= upgrade.unlockValue;
          break;
      }
      if (unlocked) {
        this.availableUpgrades.add(upgrade.id);
        newUnlock = true;
      }
    }
    if (newUnlock) {
      document.dispatchEvent(new CustomEvent('gamestate:upgradeunlocked'));
    }
  }

  checkMilestoneProgression(): void {
    const next = this.nextMilestone;
    if (!next) return;
    if (this.totalPucksEarned >= next.threshold) {
      this.milestoneIndex++;
      document.dispatchEvent(new CustomEvent('gamestate:milestone', { detail: { milestone: this.currentMilestone, index: this.milestoneIndex } }));
      // Check again in case multiple thresholds were crossed
      this.checkMilestoneProgression();
    }
  }

  prestige(): boolean {
    if (this.milestoneIndex < 7) return false;
    const ringsEarned = this.computeRingsFromPrestige(this.totalPucksEarned);
    this.championshipRings += ringsEarned;
    this.pucks = 0;
    this.totalPucksEarned = 0;
    this.totalClicks = 0;
    this.generators = Object.fromEntries(generators.map((g) => [g.id, 0]));
    this.purchasedUpgrades = new Set();
    this.availableUpgrades = new Set();
    this.generatorMultipliers = Object.fromEntries(generators.map((g) => [g.id, 1]));
    this.clickMultiplier = 1;
    this.baseClickValue = 1;
    this.milestoneIndex = 0;
    this.hasEverPrestiged = true;
    // NOTE: purchasedPrestigeUpgrades, prestigeClickMultiplier, prestigeGeneratorMultipliers
    // are intentionally NOT reset — they persist across prestige resets.
    document.dispatchEvent(new CustomEvent('gamestate:prestige', { detail: { rings: this.championshipRings } }));
    return true;
  }

  // === Serialization ===

  serialize(): SerializedGameState {
    return {
      saveVersion: 2,
      pucks: this.pucks,
      totalPucksEarned: this.totalPucksEarned,
      totalClicks: this.totalClicks,
      baseClickValue: this.baseClickValue,
      clickMultiplier: this.clickMultiplier,
      generators: { ...this.generators },
      purchasedUpgrades: Array.from(this.purchasedUpgrades),
      milestoneIndex: this.milestoneIndex,
      championshipRings: this.championshipRings,
      generatorMultipliers: { ...this.generatorMultipliers },
      lastSaveTimestamp: Date.now(),
      purchasedPrestigeUpgrades: Array.from(this.purchasedPrestigeUpgrades),
      prestigeClickMultiplier: this.prestigeClickMultiplier,
      prestigeGeneratorMultipliers: { ...this.prestigeGeneratorMultipliers },
      hasEverPrestiged: this.hasEverPrestiged,
    };
  }

  static hydrate(data: Partial<SerializedGameState>): GameState {
    const state = new GameState();
    state.saveVersion = 2;
    state.pucks = data.pucks ?? 0;
    state.totalPucksEarned = data.totalPucksEarned ?? 0;
    state.totalClicks = data.totalClicks ?? 0;
    state.baseClickValue = data.baseClickValue ?? 1;
    state.clickMultiplier = data.clickMultiplier ?? 1;
    state.milestoneIndex = data.milestoneIndex ?? 0;
    state.championshipRings = data.championshipRings ?? 0;
    state.lastSaveTimestamp = data.lastSaveTimestamp ?? Date.now();

    if (data.generators) {
      for (const id of Object.keys(state.generators)) {
        state.generators[id] = data.generators[id] ?? 0;
      }
    }
    if (data.generatorMultipliers) {
      for (const id of Object.keys(state.generatorMultipliers)) {
        state.generatorMultipliers[id] = data.generatorMultipliers[id] ?? 1;
      }
    }
    if (data.purchasedUpgrades) {
      state.purchasedUpgrades = new Set(data.purchasedUpgrades);
    }

    // v2 prestige fields with safe defaults
    state.prestigeClickMultiplier = data.prestigeClickMultiplier ?? 1;
    if (data.purchasedPrestigeUpgrades) {
      state.purchasedPrestigeUpgrades = new Set(data.purchasedPrestigeUpgrades);
    }
    if (data.prestigeGeneratorMultipliers) {
      for (const id of Object.keys(state.prestigeGeneratorMultipliers)) {
        state.prestigeGeneratorMultipliers[id] = data.prestigeGeneratorMultipliers[id] ?? 1;
      }
    }

    // For old saves without this flag, infer from rings or purchases
    state.hasEverPrestiged = data.hasEverPrestiged
      ?? (state.championshipRings > 0 || state.purchasedPrestigeUpgrades.size > 0);

    // Recompute available upgrades from restored state
    state.checkUpgradeUnlocks();
    return state;
  }
}
