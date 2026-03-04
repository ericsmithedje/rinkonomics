import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../../src/game/GameState';

describe('Purchase flow integration', () => {
  let state: GameState;

  beforeEach(() => {
    state = new GameState();
  });

  it('buy Stick Boy: balance drops, owned = 1, pps = 0.1', () => {
    state.pucks = 15;
    const result = state.buyGenerator('stick-boy');
    expect(result).toBe(true);
    expect(state.pucks).toBeCloseTo(0);
    expect(state.generators['stick-boy']).toBe(1);
    expect(state.pucksPerSecond).toBeCloseTo(0.1);
  });

  it('second Stick Boy costs more due to 1.15x scaling', () => {
    state.pucks = 15;
    state.buyGenerator('stick-boy');
    const secondCost = state.nextGeneratorCost('stick-boy');
    expect(secondCost).toBeCloseTo(15 * 1.15, 2);
  });

  it('buy upgrade after generator purchase', () => {
    state.pucks = 1000;
    state.generators['stick-boy'] = 1;
    state.checkUpgradeUnlocks();
    expect(state.availableUpgrades.has('assistant-stick-boy')).toBe(true);
    state.buyUpgrade('assistant-stick-boy');
    expect(state.purchasedUpgrades.has('assistant-stick-boy')).toBe(true);
    expect(state.generatorMultipliers['stick-boy']).toBe(2);
  });

  it('pps reflects generatorMultiplier after upgrade', () => {
    state.pucks = 2000;
    state.generators['stick-boy'] = 1;
    state.checkUpgradeUnlocks();
    const ppsBefore = state.pucksPerSecond;
    state.buyUpgrade('assistant-stick-boy');
    expect(state.pucksPerSecond).toBeCloseTo(ppsBefore * 2);
  });
});

describe('Purchase flow — affordability after upgrade spend (regression)', () => {
  it('buying an upgrade that drains pucks makes a previously-affordable generator unaffordable', () => {
    // Player has exactly 115 pucks: enough for composite-stick (100) AND stick-boy (15)
    const state = new GameState();
    state.pucks = 115;
    state.totalClicks = 10;
    state.checkUpgradeUnlocks();

    // Both should be affordable before the upgrade
    expect(state.pucks >= state.nextGeneratorCost('stick-boy')).toBe(true);
    expect(state.availableUpgrades.has('composite-stick')).toBe(true);

    // Buy the upgrade — spends 100 pucks, leaving 15
    const upgradeResult = state.buyUpgrade('composite-stick');
    expect(upgradeResult).toBe(true);
    expect(state.pucks).toBeCloseTo(15);

    // Stick Boy costs 15 exactly — still affordable
    expect(state.pucks >= state.nextGeneratorCost('stick-boy')).toBe(true);

    // Buy stick-boy too — now 0 pucks remain
    state.buyGenerator('stick-boy');
    expect(state.pucks).toBeCloseTo(0);

    // Second stick-boy costs 15 * 1.15 = 17.25 — no longer affordable
    expect(state.pucks >= state.nextGeneratorCost('stick-boy')).toBe(false);
    expect(state.buyGenerator('stick-boy')).toBe(false);
  });

  it('buying an upgrade that drops pucks below shop cost prevents generator purchase', () => {
    // Start with 110 pucks: upgrade costs 100, generator costs 15 → after upgrade only 10 left
    const state = new GameState();
    state.pucks = 110;
    state.totalClicks = 10;
    state.checkUpgradeUnlocks();

    // Before upgrade: can afford stick-boy (15)
    expect(state.pucks >= state.nextGeneratorCost('stick-boy')).toBe(true);

    // Buy upgrade: pucks drop from 110 → 10
    state.buyUpgrade('composite-stick');
    expect(state.pucks).toBeCloseTo(10);

    // After upgrade: cannot afford stick-boy (costs 15)
    expect(state.pucks >= state.nextGeneratorCost('stick-boy')).toBe(false);
    expect(state.buyGenerator('stick-boy')).toBe(false);
    expect(state.generators['stick-boy']).toBe(0);
  });

  it('buyUpgrade dispatches gamestate:purchase so Shop can refresh affordability', () => {
    const state = new GameState();
    state.pucks = 200;
    state.totalClicks = 10;
    state.checkUpgradeUnlocks();

    const events: string[] = [];
    document.addEventListener('gamestate:purchase', () => events.push('purchase'));

    state.buyUpgrade('composite-stick');
    expect(events).toContain('purchase');
  });
});
