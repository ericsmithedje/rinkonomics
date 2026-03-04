import { GameState } from '../game/GameState';
import { SaveManager } from '../game/SaveManager';

export class PrestigeModal {
  private state: GameState;
  private modal: HTMLElement | null = null;
  private newSeasonBtn: HTMLButtonElement | null = null;

  constructor(state: GameState) {
    this.state = state;
    document.addEventListener('gamestate:milestone', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.index === 7) {
        this.showNewSeasonButton();
      }
    });
    document.addEventListener('gamestate:prestige', () => {
      this.hideModal();
      this.hideNewSeasonButton();
    });
  }

  mount(): void {
    // New Season button
    const area = document.getElementById('prestige-area');
    if (area) {
      const btn = document.createElement('button');
      btn.id = 'new-season-btn';
      btn.textContent = '🏆 New Season';
      btn.addEventListener('click', () => this.showModal());
      area.appendChild(btn);
      this.newSeasonBtn = btn;
    }

    // Modal
    const container = document.getElementById('prestige-modal-container');
    if (container) {
      container.innerHTML = `
        <div id="prestige-modal" role="dialog" aria-modal="true" aria-labelledby="prestige-modal-title">
          <div class="modal-box">
            <h2 id="prestige-modal-title">🏆 Start a New Season?</h2>
            <p>You've achieved Hockey Legend status! Start fresh and carry your legacy forward.</p>
            <p class="modal-resets">❌ Resets: Pucks, generators, upgrades, milestones</p>
            <p class="modal-keeps">✅ Keeps: Championship Rings &amp; production multiplier</p>
            <p id="prestige-multiplier-preview"></p>
            <div class="modal-actions">
              <button class="confirm-btn">Start New Season</button>
              <button class="cancel-btn">Keep Playing</button>
            </div>
          </div>
        </div>
      `;
      this.modal = container.querySelector('#prestige-modal');
      this.modal?.querySelector('.confirm-btn')?.addEventListener('click', () => this.confirmPrestige());
      this.modal?.querySelector('.cancel-btn')?.addEventListener('click', () => this.hideModal());
    }

    // Show button if already at max milestone on load
    if (this.state.milestoneIndex === 7) {
      this.showNewSeasonButton();
    }
  }

  showModal(): void {
    if (!this.modal) return;
    const preview = this.modal.querySelector<HTMLElement>('#prestige-multiplier-preview');
    if (preview) {
      const newRings = this.state.championshipRings + 1;
      const newMult = 1 + newRings * 0.1;
      preview.textContent = `After this reset: ×${newMult.toFixed(1)} production multiplier (${newRings} ring${newRings !== 1 ? 's' : ''})`;
      preview.style.cssText = 'color: var(--gold); font-size: 0.85rem; margin-bottom: 1rem;';
    }
    this.modal.classList.add('open');
  }

  hideModal(): void {
    this.modal?.classList.remove('open');
  }

  showNewSeasonButton(): void {
    this.newSeasonBtn?.classList.add('visible');
  }

  hideNewSeasonButton(): void {
    this.newSeasonBtn?.classList.remove('visible');
  }

  private confirmPrestige(): void {
    if (this.state.prestige()) {
      SaveManager.save(this.state);
      this.hideModal();
    }
  }
}
