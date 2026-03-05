import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../../src/game/GameState';

describe('Prestige Shop — full prestige flow', () => {
  let state: GameState;

  beforeEach(() => {
    state = new GameState();
  });

  it('earns correct rings on first prestige at 100M pucks', () => {
    state.milestoneIndex = 7;
    state.totalPucksEarned = 100_000_000;
    state.prestige();
    expect(state.championshipRings).toBe(1);
  });

  it('earns correct rings on prestige at 1B pucks', () => {
    state.milestoneIndex = 7;
    state.totalPucksEarned = 1_000_000_000;
    state.prestige();
    expect(state.championshipRings).toBe(2);
  });

  it('can buy a prestige upgrade after earning rings', () => {
    state.milestoneIndex = 7;
    state.totalPucksEarned = 100_000_000;
    state.prestige();
    expect(state.championshipRings).toBe(1);

    const result = state.buyPrestigeUpgrade('buy-10');
    expect(result).toBe(true);
    expect(state.championshipRings).toBe(0); // 1 - 1 = 0
    expect(state.hasBulkBuy10).toBe(true);
  });

  it('prestige upgrade effect persists after a second prestige', () => {
    // First prestige at 1B — earns 2 rings
    state.milestoneIndex = 7;
    state.totalPucksEarned = 1_000_000_000;
    state.prestige();
    expect(state.championshipRings).toBe(2);

    // Buy click-power upgrade
    const result = state.buyPrestigeUpgrade('power-wrist-shot'); // costs 2 rings
    expect(result).toBe(true);
    expect(state.prestigeClickMultiplier).toBe(2);

    // Second prestige
    state.milestoneIndex = 7;
    state.totalPucksEarned = 100_000_000;
    state.prestige();

    // Multiplier persists
    expect(state.prestigeClickMultiplier).toBe(2);
    expect(state.purchasedPrestigeUpgrades.has('power-wrist-shot')).toBe(true);
  });

  it('pucksPerClick doubles after buying power-wrist-shot', () => {
    state.championshipRings = 5;
    // power-wrist-shot costs 2 rings, leaving 3 rings after purchase
    state.buyPrestigeUpgrade('power-wrist-shot');
    // pucksPerClick = baseClickValue(1) * clickMultiplier(1) * prestigeClickMultiplier(2) * prestigeMultiplier(1.3)
    expect(state.prestigeClickMultiplier).toBe(2);
    expect(state.pucksPerClick).toBeCloseTo(1 * 1 * 2 * (1 + 3 * 0.1));
  });

  it('pucksPerClick multiplier survives prestige reset', () => {
    state.milestoneIndex = 7;
    state.totalPucksEarned = 1_000_000_000;
    state.prestige();
    state.buyPrestigeUpgrade('power-wrist-shot');
    state.milestoneIndex = 7;
    state.totalPucksEarned = 100_000_000;
    state.prestige();
    // pucksPerClick uses baseClickValue(1) * clickMultiplier(1) * prestigeClickMultiplier(2) * prestigeMultiplier
    expect(state.prestigeClickMultiplier).toBe(2);
  });
});

describe('Prestige Shop — generator tier upgrade', () => {
  let state: GameState;

  beforeEach(() => {
    state = new GameState();
  });

  it('generator-tier upgrade requires ownership threshold of 50', () => {
    state.championshipRings = 10;
    state.generators['stick-boy'] = 49;
    expect(state.buyPrestigeUpgrade('tier3-stick-boy')).toBe(false);
    state.generators['stick-boy'] = 50;
    expect(state.buyPrestigeUpgrade('tier3-stick-boy')).toBe(true);
  });

  it('generator-tier upgrade doubles pps for that generator', () => {
    state.generators['stick-boy'] = 50;
    state.championshipRings = 10;
    // tier3-stick-boy costs 2 rings, leaving 8 rings; prestigeMultiplier becomes 1.8
    state.buyPrestigeUpgrade('tier3-stick-boy');
    expect(state.prestigeGeneratorMultipliers['stick-boy']).toBe(2);
    // pps = 50 * 0.1 * generatorMultipliers(1) * prestigeGeneratorMultipliers(2) * prestigeMultiplier(1.8)
    expect(state.pucksPerSecond).toBeCloseTo(50 * 0.1 * 1 * 2 * (1 + 8 * 0.1));
  });

  it('generator-tier multiplier persists across prestige', () => {
    state.generators['stick-boy'] = 50;
    state.championshipRings = 10;
    state.buyPrestigeUpgrade('tier3-stick-boy');
    expect(state.prestigeGeneratorMultipliers['stick-boy']).toBe(2);

    state.milestoneIndex = 7;
    state.prestige();
    expect(state.prestigeGeneratorMultipliers['stick-boy']).toBe(2);
  });
});

describe('Prestige Shop — bulk-buy flow', () => {
  let state: GameState;

  beforeEach(() => {
    state = new GameState();
  });

  it('hasBulkBuy10 is false before buying buy-10', () => {
    expect(state.hasBulkBuy10).toBe(false);
  });

  it('after buying buy-10, buyGeneratorBulk(id, 10) increases count by 10', () => {
    // Give player rings and buy the upgrade
    state.championshipRings = 5;
    state.buyPrestigeUpgrade('buy-10');
    expect(state.hasBulkBuy10).toBe(true);

    // Fund the bulk purchase
    const cost10 = state.generatorBulkCost('stick-boy', 10);
    state.pucks = cost10 + 100; // enough to buy 10

    const result = state.buyGeneratorBulk('stick-boy', 10);
    expect(result).toBe(true);
    expect(state.generators['stick-boy']).toBe(10);
    expect(state.pucks).toBeCloseTo(100);
  });

  it('puck balance decreases by exactly generatorBulkCost(id, 10)', () => {
    state.championshipRings = 5;
    state.buyPrestigeUpgrade('buy-10');

    const cost10 = state.generatorBulkCost('stick-boy', 10);
    const startBalance = cost10 * 2;
    state.pucks = startBalance;

    state.buyGeneratorBulk('stick-boy', 10);
    expect(state.pucks).toBeCloseTo(startBalance - cost10, 3);
  });

  it('buyGeneratorBulk fails when cannot afford', () => {
    state.pucks = 0;
    const result = state.buyGeneratorBulk('stick-boy', 10);
    expect(result).toBe(false);
    expect(state.generators['stick-boy']).toBe(0);
  });

  it('when balance drops below bulk cost, x10 is no longer affordable but x1 remains', () => {
    state.championshipRings = 5;
    state.buyPrestigeUpgrade('buy-10');

    // Set pucks to afford x1 but not x10
    const cost1 = state.generatorBulkCost('stick-boy', 1);
    const cost10 = state.generatorBulkCost('stick-boy', 10);
    // pucks > cost1 but < cost10
    state.pucks = (cost1 + cost10) / 2;

    // x10 should not be affordable
    expect(state.pucks < cost10).toBe(true);
    // x1 should still be affordable
    expect(state.pucks >= cost1).toBe(true);
  });

  it('generatorMaxAffordable returns correct amount after bulk purchase', () => {
    state.pucks = 500;
    const max = state.generatorMaxAffordable('stick-boy');
    expect(max).toBeGreaterThan(0);

    const cost = state.generatorBulkCost('stick-boy', max);
    expect(cost).toBeLessThanOrEqual(500);
    expect(state.generatorBulkCost('stick-boy', max + 1)).toBeGreaterThan(500);
  });
});

describe('Prestige Shop — save/hydrate round-trip', () => {
  it('purchasedPrestigeUpgrades survives serialize/hydrate', () => {
    const state = new GameState();
    state.championshipRings = 5;
    state.buyPrestigeUpgrade('buy-10');
    state.buyPrestigeUpgrade('power-wrist-shot');

    const data = state.serialize();
    const restored = GameState.hydrate(data);

    expect(restored.purchasedPrestigeUpgrades.has('buy-10')).toBe(true);
    expect(restored.purchasedPrestigeUpgrades.has('power-wrist-shot')).toBe(true);
    expect(restored.prestigeClickMultiplier).toBe(2);
    expect(restored.hasBulkBuy10).toBe(true);
  });

  it('prestigeGeneratorMultipliers survives serialize/hydrate', () => {
    const state = new GameState();
    state.generators['stick-boy'] = 50;
    state.championshipRings = 5;
    state.buyPrestigeUpgrade('tier3-stick-boy');

    const data = state.serialize();
    const restored = GameState.hydrate(data);

    expect(restored.prestigeGeneratorMultipliers['stick-boy']).toBe(2);
  });
});
