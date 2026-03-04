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
});
