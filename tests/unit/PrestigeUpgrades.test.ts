import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../../src/game/GameState';

describe('computeRingsFromPrestige — ring formula', () => {
  let state: GameState;

  beforeEach(() => {
    state = new GameState();
  });

  it('returns 1 for exactly 100M pucks', () => {
    expect(state.computeRingsFromPrestige(100_000_000)).toBe(1);
  });

  it('returns 2 for exactly 1B pucks', () => {
    expect(state.computeRingsFromPrestige(1_000_000_000)).toBe(2);
  });

  it('returns 3 for exactly 10B pucks', () => {
    expect(state.computeRingsFromPrestige(10_000_000_000)).toBe(3);
  });

  it('returns 4 for exactly 100B pucks', () => {
    expect(state.computeRingsFromPrestige(100_000_000_000)).toBe(4);
  });

  it('returns at least 1 for 0 pucks (Math.max guard)', () => {
    expect(state.computeRingsFromPrestige(0)).toBeGreaterThanOrEqual(1);
  });

  it('returns at least 1 for small values below threshold', () => {
    expect(state.computeRingsFromPrestige(1)).toBeGreaterThanOrEqual(1);
    expect(state.computeRingsFromPrestige(1_000)).toBeGreaterThanOrEqual(1);
  });
});

describe('generatorBulkCost — geometric series formula', () => {
  let state: GameState;

  beforeEach(() => {
    state = new GameState();
  });

  it('matches the geometric series formula exactly for 0 owned, N=10', () => {
    // cost = baseCost × 1.15^owned × (1.15^N − 1) / 0.15
    const baseCost = 15; // stick-boy
    const owned = 0;
    const qty = 10;
    const expected = baseCost * Math.pow(1.15, owned) * (Math.pow(1.15, qty) - 1) / 0.15;
    expect(state.generatorBulkCost('stick-boy', 10)).toBeCloseTo(expected, 5);
  });

  it('single-unit cost matches nextGeneratorCost', () => {
    const bulkCostFor1 = state.generatorBulkCost('stick-boy', 1);
    const singleCost = state.nextGeneratorCost('stick-boy');
    expect(bulkCostFor1).toBeCloseTo(singleCost, 5);
  });

  it('cost increases when more generators are already owned', () => {
    const cost0 = state.generatorBulkCost('stick-boy', 10);
    state.generators['stick-boy'] = 5;
    const cost5 = state.generatorBulkCost('stick-boy', 10);
    expect(cost5).toBeGreaterThan(cost0);
  });

  it('buying N individually costs the same as bulk N (geometric sum consistency)', () => {
    // Sum of N sequential single costs should equal the bulk cost for N
    const N = 5;
    let sumOfSingles = 0;
    for (let i = 0; i < N; i++) {
      state.generators['stick-boy'] = i;
      sumOfSingles += state.generatorBulkCost('stick-boy', 1);
    }
    state.generators['stick-boy'] = 0;
    const bulkCost = state.generatorBulkCost('stick-boy', N);
    expect(bulkCost).toBeCloseTo(sumOfSingles, 3);
  });

  it('returns Infinity for unknown generator id', () => {
    expect(state.generatorBulkCost('nonexistent', 5)).toBe(Infinity);
  });
});

describe('generatorMaxAffordable — boundary conditions', () => {
  let state: GameState;

  beforeEach(() => {
    state = new GameState();
  });

  it('returns 0 when pucks is 0', () => {
    state.pucks = 0;
    expect(state.generatorMaxAffordable('stick-boy')).toBe(0);
  });

  it('returns 0 when pucks < cost of 1', () => {
    state.pucks = 14; // stick-boy costs 15
    expect(state.generatorMaxAffordable('stick-boy')).toBe(0);
  });

  it('returns 1 when pucks exactly covers 1 but not 2', () => {
    // Cost of 1 stick-boy = 15; cost of 2 = 15 + 15*1.15 = 32.25
    state.pucks = 15;
    expect(state.generatorMaxAffordable('stick-boy')).toBe(1);
  });

  it('max affordable never over-spends', () => {
    state.pucks = 1000;
    const max = state.generatorMaxAffordable('stick-boy');
    expect(max).toBeGreaterThan(0);
    expect(state.generatorBulkCost('stick-boy', max)).toBeLessThanOrEqual(1000);
  });

  it('max affordable + 1 is unaffordable', () => {
    state.pucks = 1000;
    const max = state.generatorMaxAffordable('stick-boy');
    if (max > 0) {
      expect(state.generatorBulkCost('stick-boy', max + 1)).toBeGreaterThan(1000);
    }
  });

  it('returns correct max for large puck balance', () => {
    state.pucks = 1_000_000;
    const max = state.generatorMaxAffordable('stick-boy');
    expect(max).toBeGreaterThan(10);
    expect(state.generatorBulkCost('stick-boy', max)).toBeLessThanOrEqual(1_000_000);
    expect(state.generatorBulkCost('stick-boy', max + 1)).toBeGreaterThan(1_000_000);
  });
});
