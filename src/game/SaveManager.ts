import { GameState, type SerializedGameState } from './GameState';

const SAVE_KEY = 'rinkonomics_save';
const CURRENT_VERSION = 1;

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
      // Version migration stub
      if ((data.saveVersion ?? 0) < CURRENT_VERSION) {
        console.info('[SaveManager] Save version too old, loading fresh state');
        return new GameState();
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
