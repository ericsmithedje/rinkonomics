import { GameState } from '../game/GameState';
import { generators } from '../data/generators';
import { format } from '../game/NumberFormatter';

export class Shop {
  private state: GameState;
  private container: HTMLElement | null = null;
  private dirtyAffordability = true;

  constructor(state: GameState) {
    this.state = state;
    document.addEventListener('gameloop:tick', () => {
      if (this.dirtyAffordability) {
        this.updateAffordability();
        this.dirtyAffordability = false;
      }
    });
    document.addEventListener('gamestate:click', () => { this.dirtyAffordability = true; });
    document.addEventListener('gamestate:milestone', () => this.render());
    document.addEventListener('gamestate:prestige', () => this.render());
  }

  mount(): void {
    this.container = document.getElementById('shop');
    this.render();
  }

  render(): void {
    if (!this.container) return;
    const { state } = this;

    const rows = generators
      .filter((g) => state.totalPucksEarned >= g.unlockThreshold || state.generators[g.id] > 0)
      .map((g) => {
        const cost = state.nextGeneratorCost(g.id);
        const owned = state.generators[g.id];
        const affordable = state.pucks >= cost;
        const ppsContrib = (owned * g.basePps * state.generatorMultipliers[g.id] * state.prestigeMultiplier);
        return `
          <div class="generator-row" data-gen-id="${g.id}">
            <div class="generator-info">
              <div class="gen-name">${g.name}</div>
              <div class="gen-detail" title="${g.flavor}">${format(ppsContrib)}/s · ${format(cost)} pucks</div>
            </div>
            <span class="generator-count">${owned}</span>
            <button class="buy-btn ${affordable ? '' : 'unaffordable'}"
              data-gen-id="${g.id}"
              ${affordable ? '' : 'disabled'}
              aria-label="Buy ${g.name}">Buy</button>
          </div>
        `;
      })
      .join('');

    this.container.innerHTML = `<h2>🛒 Shop</h2>${rows || '<p style="color:var(--text-dim);font-size:0.8rem;padding:0.5rem">Earn pucks to unlock generators.</p>'}`;

    // Attach click handlers
    this.container.querySelectorAll<HTMLButtonElement>('.buy-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.genId!;
        if (state.buyGenerator(id)) {
          this.render();
        }
      });
    });
  }

  private updateAffordability(): void {
    if (!this.container) return;
    this.container.querySelectorAll<HTMLButtonElement>('.buy-btn').forEach((btn) => {
      const id = btn.dataset.genId!;
      const cost = this.state.nextGeneratorCost(id);
      const affordable = this.state.pucks >= cost;
      btn.disabled = !affordable;
      btn.classList.toggle('unaffordable', !affordable);
    });
  }
}
