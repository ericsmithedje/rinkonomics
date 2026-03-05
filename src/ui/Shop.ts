import { GameState } from '../game/GameState';
import { generators } from '../data/generators';
import { format } from '../game/NumberFormatter';

export class Shop {
  private state: GameState;
  private container: HTMLElement | null = null;
  private lastPucksForAffordability = -1;

  constructor(state: GameState) {
    this.state = state;
    document.addEventListener('gameloop:tick', () => {
      this.updateAffordability();
    });
    document.addEventListener('gamestate:purchase', () => this.render());
    document.addEventListener('gamestate:milestone', () => this.render());
    document.addEventListener('gamestate:prestige', () => this.render());
    document.addEventListener('gamestate:prestige-purchase', () => this.render());
  }

  mount(): void {
    this.container = document.getElementById('shop');
    this.render();
  }

  render(): void {
    if (!this.container) return;
    const { state } = this;
    const hasBulk10 = state.hasBulkBuy10;
    const hasBulkMax = state.hasBuyMax;

    const rows = generators
      .filter((g) => state.totalPucksEarned >= g.unlockThreshold || state.generators[g.id] > 0)
      .map((g) => {
        const cost = state.nextGeneratorCost(g.id);
        const owned = state.generators[g.id];
        const affordable = state.pucks >= cost;
        const ppsContrib = owned * g.basePps * state.generatorMultipliers[g.id] * state.prestigeGeneratorMultipliers[g.id] * state.prestigeMultiplier;

        const cost10 = hasBulk10 ? state.generatorBulkCost(g.id, 10) : 0;
        const affordable10 = hasBulk10 && state.pucks >= cost10;

        const maxQty = hasBulkMax ? state.generatorMaxAffordable(g.id) : 0;
        const costMax = hasBulkMax && maxQty > 0 ? state.generatorBulkCost(g.id, maxQty) : 0;
        const affordableMax = hasBulkMax && maxQty > 0;

        const bulk10Btn = hasBulk10 ? `
          <button class="buy-btn buy-btn-bulk ${affordable10 ? '' : 'unaffordable'}"
            data-gen-id="${g.id}"
            data-bulk="10"
            ${affordable10 ? '' : 'disabled'}
            aria-label="Buy 10 ${g.name} for ${format(cost10)} pucks">×10<br><span class="bulk-cost">${format(cost10)}</span></button>
        ` : '';

        const bulkMaxBtn = hasBulkMax ? `
          <button class="buy-btn buy-btn-bulk buy-btn-max ${affordableMax ? '' : 'unaffordable'}"
            data-gen-id="${g.id}"
            data-bulk="max"
            ${affordableMax ? '' : 'disabled'}
            aria-label="Buy max ${g.name} for ${format(costMax)} pucks">×Max<br><span class="bulk-cost">${affordableMax ? format(costMax) : '0'}</span></button>
        ` : '';

        return `
          <div class="generator-row" data-gen-id="${g.id}">
            <div class="generator-info">
              <div class="gen-name">${g.name}</div>
              <div class="gen-detail" title="${g.flavor}">${format(ppsContrib)}/s · ${format(cost)} pucks</div>
            </div>
            <span class="generator-count">${owned}</span>
            <div class="generator-buy-actions">
              <button class="buy-btn ${affordable ? '' : 'unaffordable'}"
                data-gen-id="${g.id}"
                ${affordable ? '' : 'disabled'}
                aria-label="Buy ${g.name}">Buy</button>
              ${bulk10Btn}
              ${bulkMaxBtn}
            </div>
          </div>
        `;
      })
      .join('');

    this.container.innerHTML = `<h2>🛒 Shop</h2>${rows || '<p style="color:var(--text-dim);font-size:0.8rem;padding:0.5rem">Earn pucks to unlock generators.</p>'}`;

    // Attach click handlers for ×1 buy buttons
    this.container.querySelectorAll<HTMLButtonElement>('.buy-btn:not(.buy-btn-bulk)').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.genId!;
        if (state.buyGenerator(id)) {
          this.render();
        }
      });
    });

    // Attach click handlers for ×10 buy buttons
    this.container.querySelectorAll<HTMLButtonElement>('.buy-btn-bulk[data-bulk="10"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.genId!;
        if (state.buyGeneratorBulk(id, 10)) {
          this.render();
        }
      });
    });

    // Attach click handlers for ×Max buy buttons
    this.container.querySelectorAll<HTMLButtonElement>('.buy-btn-bulk[data-bulk="max"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.genId!;
        const qty = state.generatorMaxAffordable(id);
        if (qty > 0 && state.buyGeneratorBulk(id, qty)) {
          this.render();
        }
      });
    });
  }

  private updateAffordability(): void {
    if (!this.container) return;
    const { state } = this;
    if (state.pucks === this.lastPucksForAffordability) return;
    this.lastPucksForAffordability = state.pucks;

    // Update ×1 buttons
    this.container.querySelectorAll<HTMLButtonElement>('.buy-btn:not(.buy-btn-bulk)').forEach((btn) => {
      const id = btn.dataset.genId!;
      const cost = state.nextGeneratorCost(id);
      const affordable = state.pucks >= cost;
      btn.disabled = !affordable;
      btn.classList.toggle('unaffordable', !affordable);
    });

    // Update ×10 buttons
    this.container.querySelectorAll<HTMLButtonElement>('.buy-btn-bulk[data-bulk="10"]').forEach((btn) => {
      const id = btn.dataset.genId!;
      const cost10 = state.generatorBulkCost(id, 10);
      const affordable = state.pucks >= cost10;
      btn.disabled = !affordable;
      btn.classList.toggle('unaffordable', !affordable);
      const costSpan = btn.querySelector('.bulk-cost');
      if (costSpan) costSpan.textContent = format(cost10);
    });

    // Update ×Max buttons
    this.container.querySelectorAll<HTMLButtonElement>('.buy-btn-bulk[data-bulk="max"]').forEach((btn) => {
      const id = btn.dataset.genId!;
      const maxQty = state.generatorMaxAffordable(id);
      const affordable = maxQty > 0;
      btn.disabled = !affordable;
      btn.classList.toggle('unaffordable', !affordable);
      const costSpan = btn.querySelector('.bulk-cost');
      if (costSpan) {
        costSpan.textContent = affordable ? format(state.generatorBulkCost(id, maxQty)) : '0';
      }
    });
  }
}
