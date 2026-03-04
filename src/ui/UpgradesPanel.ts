import { GameState } from '../game/GameState';
import { upgradesById } from '../data/upgrades';
import { format } from '../game/NumberFormatter';

export class UpgradesPanel {
  private state: GameState;
  private container: HTMLElement | null = null;

  constructor(state: GameState) {
    this.state = state;
    document.addEventListener('gamestate:upgradeunlocked', () => this.render());
    document.addEventListener('gamestate:prestige', () => this.render());
    document.addEventListener('gameloop:tick', () => this.updateAffordability());
  }

  mount(): void {
    this.container = document.getElementById('upgrades-panel');
    this.render();
  }

  render(): void {
    if (!this.container) return;
    const { state } = this;
    const available = Array.from(state.availableUpgrades)
      .map((id) => upgradesById.get(id))
      .filter(Boolean);

    const cards = available.map((u) => {
      const affordable = state.pucks >= u!.cost;
      return `
        <div class="upgrade-card ${affordable ? '' : 'unaffordable'}" data-upg-id="${u!.id}">
          <div class="upg-name">${u!.name}</div>
          <div class="upg-desc">${u!.description}</div>
          <div class="upg-cost">🏒 ${format(u!.cost)}</div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `<h2>⚡ Upgrades</h2>${cards || '<p style="color:var(--text-dim);font-size:0.8rem;padding:0.5rem">No upgrades available yet.</p>'}`;

    this.container.querySelectorAll<HTMLElement>('.upgrade-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.dataset.upgId!;
        const upgrade = upgradesById.get(id);
        if (!upgrade || state.pucks < upgrade.cost) return;
        if (state.buyUpgrade(id)) {
          this.render();
        }
      });
    });
  }

  private updateAffordability(): void {
    if (!this.container) return;
    this.container.querySelectorAll<HTMLElement>('.upgrade-card').forEach((card) => {
      const id = card.dataset.upgId!;
      const upgrade = upgradesById.get(id);
      if (!upgrade) return;
      card.classList.toggle('unaffordable', this.state.pucks < upgrade.cost);
    });
  }
}
