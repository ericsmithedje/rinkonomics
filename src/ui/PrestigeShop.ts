import type { GameState } from '../game/GameState';
import { prestigeUpgrades } from '../data/prestigeUpgrades';
import { format } from '../game/NumberFormatter';

const TYPE_ORDER = ['bulk-buy', 'click-power', 'generator-tier'] as const;
const TYPE_LABELS: Record<string, string> = {
  'bulk-buy': '🛒 Bulk-Buy Unlocks',
  'click-power': '🏒 Click Power',
  'generator-tier': '⚙️ Generator Tier-3',
};

export class PrestigeShop {
  private state: GameState;
  private modal: HTMLElement | null = null;
  private isOpen = false;

  constructor(state: GameState) {
    this.state = state;
    document.addEventListener('gamestate:prestige', () => {
      this.isOpen = true;
      this.render();
    });
    document.addEventListener('gamestate:prestige-purchase', () => this.render());
    document.addEventListener('gamestate:purchase', () => this.render());
  }

  mount(): void {
    this.modal = document.getElementById('prestige-shop-modal');

    // Button is a persistent DOM node (never replaced by StatsPanel) — wire directly
    const btn = document.getElementById('prestige-shop-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        this.isOpen = !this.isOpen;
        this.render();
      });
    }

    if (this.modal) {
      // All modal interactions wired once here via event delegation — never re-attached in render()
      this.modal.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        // Backdrop click
        if (target === this.modal) {
          this.isOpen = false;
          this.render();
          return;
        }
        // Close button
        if (target.closest('[data-action="close"]')) {
          this.isOpen = false;
          this.render();
          return;
        }
        // Buy buttons
        const buyBtn = target.closest<HTMLButtonElement>('.prestige-buy-btn:not([disabled])');
        if (buyBtn?.dataset.upgId) {
          this.state.buyPrestigeUpgrade(buyBtn.dataset.upgId);
        }
      });
    }
    this.render();
  }

  render(): void {
    if (!this.modal) return;

    if (!this.isOpen) {
      this.modal.hidden = true;
      return;
    }

    const { state } = this;
    const ringCount = state.championshipRings;
    const ringLabel = `🏆 ${format(ringCount)} ring${ringCount !== 1 ? 's' : ''}`;

    const grouped = TYPE_ORDER.map((type) => ({
      type,
      label: TYPE_LABELS[type],
      upgrades: prestigeUpgrades.filter((u) => u.type === type),
    }));

    const sections = grouped.map(({ label, upgrades: ups }) => {
      const rows = ups.map((upg) => {
        const owned = state.purchasedPrestigeUpgrades.has(upg.id);
        const canAfford = state.championshipRings >= upg.ringCost;

        let thresholdMet = true;
        let thresholdInfo = '';
        if (upg.type === 'generator-tier' && upg.generatorOwnershipThreshold != null && upg.targetId) {
          const currentOwned = state.generators[upg.targetId] ?? 0;
          thresholdMet = currentOwned >= upg.generatorOwnershipThreshold;
          if (!thresholdMet) {
            thresholdInfo = `<div class="prestige-upg-threshold">Requires ${upg.generatorOwnershipThreshold} owned (have ${currentOwned})</div>`;
          }
        }

        let stateClass = '';
        let disabled = false;
        if (owned) {
          stateClass = 'prestige-upg-owned';
          disabled = true;
        } else if (!thresholdMet) {
          stateClass = 'prestige-upg-locked';
          disabled = true;
        } else if (!canAfford) {
          stateClass = 'prestige-upg-unaffordable';
          disabled = true;
        }

        const ringBadge = `<span class="prestige-ring-cost">${upg.ringCost} 🏆</span>`;
        const statusLabel = owned ? '<span class="prestige-owned-label">✓ Owned</span>' : '';

        return `
          <div class="prestige-upg-row ${stateClass}" data-upg-id="${upg.id}">
            <div class="prestige-upg-info">
              <div class="prestige-upg-name">${upg.name}</div>
              <div class="prestige-upg-desc">${upg.description}</div>
              ${thresholdInfo}
            </div>
            <div class="prestige-upg-action">
              ${ringBadge}
              ${owned ? statusLabel : `<button class="prestige-buy-btn ${stateClass}" data-upg-id="${upg.id}" ${disabled ? 'disabled' : ''}>Buy</button>`}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="prestige-section">
          <h3 class="prestige-section-header">${label}</h3>
          ${rows}
        </div>
      `;
    }).join('');

    this.modal.hidden = false;
    this.modal.innerHTML = `
      <div class="prestige-shop-panel">
        <button class="prestige-modal-close" data-action="close" aria-label="Close prestige shop">✕</button>
        <h2>⭐ Prestige Shop</h2>
        <div class="prestige-ring-balance">${ringLabel} available</div>
        ${sections}
      </div>
    `;
  }
}
