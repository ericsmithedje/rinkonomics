import { generators, generatorsById } from '../data/generators';
import { upgrades, upgradesById } from '../data/upgrades';
import { milestones } from '../data/milestones';

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
}

export class GameState {
  saveVersion = 1;
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

  constructor() {
    this.generators = Object.fromEntries(generators.map((g) => [g.id, 0]));
    this.generatorMultipliers = Object.fromEntries(generators.map((g) => [g.id, 1]));
    this.purchasedUpgrades = new Set();
    this.availableUpgrades = new Set();
  }

  // === Derived / Computed Values ===

  get prestigeMultiplier(): number {
    return 1 + this.championshipRings * 0.1;
  }

  get pucksPerClick(): number {
    return this.baseClickValue * this.clickMultiplier * this.prestigeMultiplier;
  }

  get pucksPerSecond(): number {
    let total = 0;
    for (const gen of generators) {
      total += this.generators[gen.id] * gen.basePps * this.generatorMultipliers[gen.id];
    }
    return total * this.prestigeMultiplier;
  }

  nextGeneratorCost(id: GeneratorId): number {
    const gen = generatorsById.get(id);
    if (!gen) return Infinity;
    return gen.baseCost * Math.pow(1.15, this.generators[id]);
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
    this.championshipRings++;
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
    document.dispatchEvent(new CustomEvent('gamestate:prestige', { detail: { rings: this.championshipRings } }));
    return true;
  }

  // === Serialization ===

  serialize(): SerializedGameState {
    return {
      saveVersion: this.saveVersion,
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
    };
  }

  static hydrate(data: Partial<SerializedGameState>): GameState {
    const state = new GameState();
    state.saveVersion = data.saveVersion ?? 1;
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

    // Recompute available upgrades from restored state
    state.checkUpgradeUnlocks();
    return state;
  }
}
