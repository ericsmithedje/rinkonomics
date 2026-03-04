import { GameState } from '../game/GameState';
import { format } from '../game/NumberFormatter';

export class ClickTarget {
  private state: GameState;
  private container: HTMLElement | null = null;

  constructor(state: GameState) {
    this.state = state;
  }

  mount(): void {
    this.container = document.getElementById('click-area');
    if (!this.container) return;

    const btn = document.createElement('button');
    btn.id = 'puck';
    btn.textContent = '🏒';
    btn.setAttribute('aria-label', 'Click the puck');
    btn.addEventListener('click', this.onClick.bind(this));
    this.container.prepend(btn);
  }

  private onClick(e: MouseEvent): void {
    this.state.addPucksFromClick();
    this.showFloatLabel(e);
  }

  private showFloatLabel(e: MouseEvent): void {
    if (!this.container) return;
    const label = document.createElement('span');
    label.className = 'click-float';
    label.textContent = '+' + format(this.state.pucksPerClick);

    const rect = this.container.getBoundingClientRect();
    const x = e.clientX - rect.left - 20;
    const y = e.clientY - rect.top - 20;
    label.style.left = x + 'px';
    label.style.top = y + 'px';

    this.container.appendChild(label);
    label.addEventListener('animationend', () => label.remove(), { once: true });
  }
}
