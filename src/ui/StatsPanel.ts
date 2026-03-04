import { GameState } from '../game/GameState';
import { format } from '../game/NumberFormatter';

export class StatsPanel {
  private state: GameState;
  private container: HTMLElement | null = null;

  constructor(state: GameState) {
    this.state = state;
    document.addEventListener('gameloop:tick', this.render.bind(this));
    document.addEventListener('gamestate:click', this.render.bind(this));
    document.addEventListener('gamestate:prestige', this.render.bind(this));
  }

  mount(): void {
    this.container = document.getElementById('stats-bar');
    this.render();
  }

  private render(): void {
    if (!this.container) return;
    const { pucks, pucksPerClick, pucksPerSecond, championshipRings } = this.state;
    const milestone = this.state.currentMilestone;
    const ppcDisplay = format(pucksPerClick);
    const ppsDisplay = format(pucksPerSecond);

    this.container.innerHTML = `
      <div class="stat">
        <span class="stat-label">Pucks</span>
        <span class="stat-value">${format(pucks)}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Per click</span>
        <span class="stat-value">${ppcDisplay}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Per second</span>
        <span class="stat-value">${ppsDisplay}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Career</span>
        <span class="stat-value" style="font-size:0.85rem">${milestone.title}</span>
      </div>
      ${championshipRings > 0 ? `<span class="prestige-badge">🏆 ×${(1 + championshipRings * 0.1).toFixed(1)}</span>` : ''}
    `;
  }
}
