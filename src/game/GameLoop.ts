import { GameState } from './GameState';
import { SaveManager } from './SaveManager';

const AUTO_SAVE_INTERVAL_MS = 30_000;

export class GameLoop {
  private state: GameState;
  private rafId: number | null = null;
  private lastTimestamp: number | null = null;
  private autoSaveAccumulator = 0;

  constructor(state: GameState) {
    this.state = state;
  }

  start(): void {
    if (this.rafId !== null) return;
    this.lastTimestamp = null;
    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick(timestamp: number): void {
    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
    }
    const deltaMs = Math.min(timestamp - this.lastTimestamp, 1000); // cap at 1s to avoid huge jumps
    const deltaSeconds = deltaMs / 1000;
    this.lastTimestamp = timestamp;

    // Accumulate pps
    const pps = this.state.pucksPerSecond;
    if (pps > 0) {
      this.state.addPucks(pps * deltaSeconds);
    }

    // Auto-save
    this.autoSaveAccumulator += deltaMs;
    if (this.autoSaveAccumulator >= AUTO_SAVE_INTERVAL_MS) {
      SaveManager.save(this.state);
      this.autoSaveAccumulator = 0;
    }

    // Notify UI
    document.dispatchEvent(new CustomEvent('gameloop:tick'));

    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }
}
