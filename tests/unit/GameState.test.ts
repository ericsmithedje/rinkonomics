import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState } from '../../src/game/GameState';

describe('GameState — core mutations', () => {
  let state: GameState;

  beforeEach(() => {
    state = new GameState();
  });

  it('click adds pucksPerClick to balance and totalPucksEarned', () => {
    const ppc = state.pucksPerClick;
    state.addPucksFromClick();
    expect(state.pucks).toBeCloseTo(ppc);
    expect(state.totalPucksEarned).toBeCloseTo(ppc);
    expect(state.totalClicks).toBe(1);
  });

  it('buyGenerator deducts cost and increases pps', () => {
    state.pucks = 15;
    const result = state.buyGenerator('stick-boy');
    expect(result).toBe(true);
    expect(state.pucks).toBeCloseTo(0);
    expect(state.generators['stick-boy']).toBe(1);
    expect(state.pucksPerSecond).toBeCloseTo(0.1);
  });

  it('buyGenerator fails when insufficient pucks', () => {
    state.pucks = 10;
    const result = state.buyGenerator('stick-boy');
    expect(result).toBe(false);
    expect(state.generators['stick-boy']).toBe(0);
    expect(state.pucks).toBe(10);
  });

  it('buyUpgrade (click type) doubles clickMultiplier', () => {
    state.pucks = 200;
    state.totalClicks = 10;
    state.checkUpgradeUnlocks();
    const before = state.clickMultiplier;
    state.buyUpgrade('composite-stick');
    expect(state.clickMultiplier).toBe(before * 2);
  });

  it('buyUpgrade (generator type) doubles generatorMultipliers for targetId', () => {
    state.pucks = 300;
    state.generators['stick-boy'] = 1;
    state.checkUpgradeUnlocks();
    const before = state.generatorMultipliers['stick-boy'];
    state.buyUpgrade('assistant-stick-boy');
    expect(state.generatorMultipliers['stick-boy']).toBe(before * 2);
  });

  it('spendPucks never goes below zero', () => {
    state.pucks = 5;
    state.spendPucks(10);
    expect(state.pucks).toBe(5); // unchanged — failed spend
  });

  it('buyUpgrade deducts puck cost from balance', () => {
    state.pucks = 500;
    state.totalClicks = 10;
    state.checkUpgradeUnlocks();
    state.buyUpgrade('composite-stick'); // costs 100
    expect(state.pucks).toBeCloseTo(400);
  });

  it('buyUpgrade dispatches gamestate:purchase event', () => {
    state.pucks = 500;
    state.totalClicks = 10;
    state.checkUpgradeUnlocks();
    const listener = vi.fn();
    document.addEventListener('gamestate:purchase', listener, { once: true });
    state.buyUpgrade('composite-stick');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('buyUpgrade returns false and does not deduct pucks when unaffordable', () => {
    state.pucks = 50; // composite-stick costs 100
    state.totalClicks = 10;
    state.checkUpgradeUnlocks();
    const result = state.buyUpgrade('composite-stick');
    expect(result).toBe(false);
    expect(state.pucks).toBe(50);
    expect(state.purchasedUpgrades.has('composite-stick')).toBe(false);
  });
});

describe('GameState — prestige', () => {
  it('prestige increments championshipRings and resets run state', () => {
    const state = new GameState();
    state.milestoneIndex = 7;
    state.pucks = 999;
    state.totalPucksEarned = 100000000;
    state.generators['stick-boy'] = 5;
    state.prestige();
    expect(state.championshipRings).toBe(1);
    expect(state.pucks).toBe(0);
    expect(state.totalPucksEarned).toBe(0);
    expect(state.generators['stick-boy']).toBe(0);
    expect(state.milestoneIndex).toBe(0);
  });

  it('prestigeMultiplier is 1.1 after first prestige', () => {
    const state = new GameState();
    state.milestoneIndex = 7;
    state.prestige();
    expect(state.prestigeMultiplier).toBeCloseTo(1.1);
  });

  it('prestigeMultiplier is 1.2 after second prestige', () => {
    const state = new GameState();
    state.milestoneIndex = 7;
    state.prestige();
    state.milestoneIndex = 7;
    state.prestige();
    expect(state.prestigeMultiplier).toBeCloseTo(1.2);
  });

  it('prestige fails when milestoneIndex < 7', () => {
    const state = new GameState();
    state.milestoneIndex = 6;
    expect(state.prestige()).toBe(false);
    expect(state.championshipRings).toBe(0);
  });

  it('prestige preserves purchasedPrestigeUpgrades', () => {
    const state = new GameState();
    state.milestoneIndex = 7;
    state.championshipRings = 5;
    state.buyPrestigeUpgrade('buy-10');
    state.prestige();
    expect(state.purchasedPrestigeUpgrades.has('buy-10')).toBe(true);
  });

  it('prestige preserves prestigeClickMultiplier', () => {
    const state = new GameState();
    state.milestoneIndex = 7;
    state.championshipRings = 10;
    state.buyPrestigeUpgrade('power-wrist-shot');
    expect(state.prestigeClickMultiplier).toBe(2);
    state.prestige();
    expect(state.prestigeClickMultiplier).toBe(2);
  });

  it('prestige preserves prestigeGeneratorMultipliers', () => {
    const state = new GameState();
    state.generators['stick-boy'] = 50;
    state.championshipRings = 5;
    state.buyPrestigeUpgrade('tier3-stick-boy');
    expect(state.prestigeGeneratorMultipliers['stick-boy']).toBe(2);
    state.milestoneIndex = 7;
    state.prestige();
    expect(state.prestigeGeneratorMultipliers['stick-boy']).toBe(2);
  });
});

describe('GameState — prestige multipliers in derived values', () => {
  it('pucksPerClick includes prestigeClickMultiplier', () => {
    const state = new GameState();
    const basePpc = state.pucksPerClick;
    state.prestigeClickMultiplier = 2;
    expect(state.pucksPerClick).toBeCloseTo(basePpc * 2);
  });

  it('pucksPerClick stacks prestigeClickMultiplier with clickMultiplier', () => {
    const state = new GameState();
    state.clickMultiplier = 3;
    state.prestigeClickMultiplier = 2;
    // baseClickValue(1) * clickMultiplier(3) * prestigeClickMultiplier(2) * prestigeMultiplier(1)
    expect(state.pucksPerClick).toBeCloseTo(6);
  });

  it('pucksPerSecond includes prestigeGeneratorMultipliers', () => {
    const state = new GameState();
    state.generators['stick-boy'] = 1; // 0.1 pps base
    const ppsBefore = state.pucksPerSecond;
    state.prestigeGeneratorMultipliers['stick-boy'] = 2;
    expect(state.pucksPerSecond).toBeCloseTo(ppsBefore * 2);
  });
});

describe('GameState — buyPrestigeUpgrade', () => {
  it('deducts rings and adds to purchasedPrestigeUpgrades', () => {
    const state = new GameState();
    state.championshipRings = 3;
    const result = state.buyPrestigeUpgrade('buy-10');
    expect(result).toBe(true);
    expect(state.championshipRings).toBe(2); // 3 - 1 = 2
    expect(state.purchasedPrestigeUpgrades.has('buy-10')).toBe(true);
  });

  it('applies click multiplier for click-power upgrades', () => {
    const state = new GameState();
    state.championshipRings = 5;
    state.buyPrestigeUpgrade('power-wrist-shot');
    expect(state.prestigeClickMultiplier).toBe(2);
  });

  it('dispatches gamestate:prestige-purchase event', () => {
    const state = new GameState();
    state.championshipRings = 5;
    const listener = vi.fn();
    document.addEventListener('gamestate:prestige-purchase', listener, { once: true });
    state.buyPrestigeUpgrade('buy-10');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('returns false and does not deduct rings when insufficient', () => {
    const state = new GameState();
    state.championshipRings = 0;
    const result = state.buyPrestigeUpgrade('buy-10'); // costs 1
    expect(result).toBe(false);
    expect(state.championshipRings).toBe(0);
  });

  it('returns false if already owned', () => {
    const state = new GameState();
    state.championshipRings = 10;
    state.buyPrestigeUpgrade('buy-10');
    const secondResult = state.buyPrestigeUpgrade('buy-10');
    expect(secondResult).toBe(false);
    expect(state.championshipRings).toBe(9); // only deducted once
  });

  it('returns false for generator-tier upgrade when below ownership threshold', () => {
    const state = new GameState();
    state.championshipRings = 10;
    state.generators['stick-boy'] = 49; // needs 50
    const result = state.buyPrestigeUpgrade('tier3-stick-boy');
    expect(result).toBe(false);
    expect(state.championshipRings).toBe(10); // no rings deducted
  });

  it('applies generator multiplier for generator-tier upgrades', () => {
    const state = new GameState();
    state.generators['stick-boy'] = 50;
    state.championshipRings = 5;
    state.buyPrestigeUpgrade('tier3-stick-boy');
    expect(state.prestigeGeneratorMultipliers['stick-boy']).toBe(2);
  });

  it('hasBulkBuy10 becomes true after buying buy-10', () => {
    const state = new GameState();
    expect(state.hasBulkBuy10).toBe(false);
    state.championshipRings = 5;
    state.buyPrestigeUpgrade('buy-10');
    expect(state.hasBulkBuy10).toBe(true);
  });

  it('hasBuyMax becomes true after buying buy-max', () => {
    const state = new GameState();
    expect(state.hasBuyMax).toBe(false);
    state.championshipRings = 5;
    state.buyPrestigeUpgrade('buy-max');
    expect(state.hasBuyMax).toBe(true);
  });
});
