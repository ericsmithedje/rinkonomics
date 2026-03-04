import { GameState } from '../game/GameState';
import { format } from '../game/NumberFormatter';
import { milestones } from '../data/milestones';

export class MilestoneDisplay {
  private state: GameState;
  private container: HTMLElement | null = null;

  constructor(state: GameState) {
    this.state = state;
    document.addEventListener('gameloop:tick', () => this.updateProgress());
    document.addEventListener('gamestate:milestone', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      this.render();
      showToast(detail.milestone.notification);
    });
    document.addEventListener('gamestate:prestige', () => this.render());
  }

  mount(): void {
    this.container = document.getElementById('milestone-display');
    this.render();
  }

  render(): void {
    if (!this.container) return;
    const { state } = this;
    const current = state.currentMilestone;
    const next = state.nextMilestone;
    const pct = next
      ? Math.min(100, (state.totalPucksEarned / next.threshold) * 100)
      : 100;

    this.container.innerHTML = `
      <span class="milestone-title">🏒 ${current.title}</span>
      <div class="milestone-progress-wrap">
        <div class="milestone-next">${next ? `Next: ${next.title} (${format(next.threshold)} pucks)` : 'Max rank achieved!'}</div>
        <div class="milestone-progress-bar">
          <div class="milestone-progress-fill" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }

  private updateProgress(): void {
    if (!this.container) return;
    const fill = this.container.querySelector<HTMLElement>('.milestone-progress-fill');
    if (!fill) return;
    const next = this.state.nextMilestone;
    if (!next) { fill.style.width = '100%'; return; }
    const pct = Math.min(100, (this.state.totalPucksEarned / next.threshold) * 100);
    fill.style.width = pct + '%';
  }
}

export function showToast(message: string): void {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3100);
}

// Expose milestones list for other uses
export { milestones };
