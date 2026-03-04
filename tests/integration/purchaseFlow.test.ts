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
