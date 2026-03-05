import { GameState, type SerializedGameState } from './GameState';

const SAVE_KEY = 'rinkonomics_save';
const CURRENT_VERSION = 2;

export const SaveManager = {
  save(state: GameState): void {
    try {
      const data = state.serialize();
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[SaveManager] Save failed:', e);
    }
  },

  load(): GameState {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return new GameState();
      const data: Partial<SerializedGameState> = JSON.parse(raw);
      const version = data.saveVersion ?? 0;

      if (version < 1) {
        // Pre-v1: too old to migrate, start fresh
        console.info('[SaveManager] Save version too old, loading fresh state');
        return new GameState();
      }

      if (version < CURRENT_VERSION) {
        // v1 → v2: add prestige fields with safe defaults
        console.info(`[SaveManager] Migrating save from v${version} to v${CURRENT_VERSION}`);
        data.saveVersion = CURRENT_VERSION;
        data.purchasedPrestigeUpgrades = data.purchasedPrestigeUpgrades ?? [];
        data.prestigeClickMultiplier = data.prestigeClickMultiplier ?? 1;
        // prestigeGeneratorMultipliers defaults are handled inside hydrate()
      }

      return GameState.hydrate(data);
    } catch (e) {
      console.warn('[SaveManager] Load failed, starting fresh:', e);
      return new GameState();
    }
  },

  clear(): void {
    localStorage.removeItem(SAVE_KEY);
  },
};
