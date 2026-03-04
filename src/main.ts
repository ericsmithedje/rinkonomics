import './styles/main.css';
import { SaveManager } from './game/SaveManager';
import { GameLoop } from './game/GameLoop';

const state = SaveManager.load();
const loop = new GameLoop(state);

async function initUI() {
  const [
    { ClickTarget },
    { StatsPanel },
    { Shop },
    { UpgradesPanel },
    { MilestoneDisplay },
    { PrestigeModal },
  ] = await Promise.all([
    import('./ui/ClickTarget'),
    import('./ui/StatsPanel'),
    import('./ui/Shop'),
    import('./ui/UpgradesPanel'),
    import('./ui/MilestoneDisplay'),
    import('./ui/PrestigeModal'),
  ]);

  new ClickTarget(state).mount();
  new StatsPanel(state).mount();
  new Shop(state).mount();
  new UpgradesPanel(state).mount();
  new MilestoneDisplay(state).mount();
  new PrestigeModal(state).mount();

  if (state.totalClicks === 0 && state.totalPucksEarned === 0) {
    const tooltip = document.createElement('div');
    tooltip.className = 'welcome-tooltip';
    tooltip.textContent = 'Click the puck to get started! 🏒';
    document.getElementById('click-area')?.appendChild(tooltip);
    document.addEventListener('gamestate:click', () => tooltip.remove(), { once: true });
  }
}

loop.start();
initUI();

window.addEventListener('beforeunload', () => SaveManager.save(state));

if (import.meta.env.DEV) {
  (window as any).debug = {
    state,
    addPucks: (n: number) => { state.pucks += n; state.totalPucksEarned += n; },
    clearSave: () => SaveManager.clear(),
  };
}
