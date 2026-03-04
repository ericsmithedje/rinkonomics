import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SaveManager } from '../../src/game/SaveManager';
import { GameState } from '../../src/game/GameState';

const SAVE_KEY = 'rinkonomics_save';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('SaveManager', () => {
  beforeEach(() => localStorageMock.clear());

  it('save round-trip: serialize then deserialize restores fields', () => {
    const state = new GameState();
    state.pucks = 42;
    state.totalPucksEarned = 100;
    state.totalClicks = 7;
    state.generators['stick-boy'] = 3;
    SaveManager.save(state);

    const loaded = SaveManager.load();
    expect(loaded.pucks).toBeCloseTo(42);
    expect(loaded.totalPucksEarned).toBeCloseTo(100);
    expect(loaded.totalClicks).toBe(7);
    expect(loaded.generators['stick-boy']).toBe(3);
  });

  it('load with empty localStorage returns fresh state', () => {
    const state = SaveManager.load();
    expect(state.pucks).toBe(0);
    expect(state.totalClicks).toBe(0);
    expect(state.championshipRings).toBe(0);
  });

  it('clear removes save from localStorage', () => {
    const state = new GameState();
    SaveManager.save(state);
    SaveManager.clear();
    expect(localStorageMock.getItem(SAVE_KEY)).toBeNull();
  });

  it('load with saveVersion mismatch returns fresh state', () => {
    localStorageMock.setItem(SAVE_KEY, JSON.stringify({ saveVersion: 0, pucks: 999 }));
    const state = SaveManager.load();
    expect(state.pucks).toBe(0); // fresh state, not the saved value
  });

  it('load handles corrupted JSON gracefully', () => {
    localStorageMock.setItem(SAVE_KEY, 'NOT_VALID_JSON{{{');
    expect(() => SaveManager.load()).not.toThrow();
    const state = SaveManager.load();
    expect(state.pucks).toBe(0);
  });
});
