// Contrôleur de l'interface : état d'affichage, rendu, sauvegarde automatique,
// et mise en scène (sons, vibrations, animations) des événements de jeu.

import { createGame, dispatch as engineDispatch, stepKey } from '../engine/game.js';
import { categoryById } from '../engine/categories.js';
import * as store from '../storage.js';
import { sfx, setSoundEnabled, unlockAudio } from './sound.js';
import { haptic, setHapticsEnabled } from './haptics.js';
import { flash, rays, countUp, floatPoints, confetti, setReducedMotion } from './fx.js';
import { esc } from './widgets.js';

export const app = {
  bank: null,
  bankError: null,
  game: null,
  settings: store.loadSettings(),
  route: 'loading',
  ui: {}, // état local à l'étape en cours (thème sélectionné, votes d'arbitrage…)
  uiKey: '',
  fx: null, // événement à mettre en scène au prochain rendu
  overlay: null,
  modal: null,
};

applySettings();

const registry = {};
export function registerScreens(map) {
  Object.assign(registry, map);
}

let root = null;
export function mountRoot(el) {
  root = el;
  // L'audio d'iOS ne démarre qu'après un premier geste.
  const wake = () => {
    unlockAudio();
    window.removeEventListener('pointerdown', wake);
  };
  window.addEventListener('pointerdown', wake);
}

// ------------------------------------------------------------------ rendu

export function render() {
  if (!root) return;
  const screen = pickScreen();
  const overlay = app.overlay && registry['overlay_' + app.overlay] ? registry['overlay_' + app.overlay]() : null;
  const modal = app.modal ? modalScreen(app.modal) : null;
  const prevId = root.dataset.screen;
  root.innerHTML =
    screen.html +
    (overlay ? `<div data-scope="overlay">${overlay.html}</div>` : '') +
    (modal ? `<div data-scope="modal">${modal.html}</div>` : '');
  root.dataset.screen = screen.id || '';
  const el = root.querySelector('.screen');
  if (el && screen.id !== prevId) el.classList.add('enter');
  if (screen.mount && el) screen.mount(el);
  if (overlay && overlay.mount) overlay.mount(root.querySelector('[data-scope="overlay"]'));
  if (modal) modal.mount(root.querySelector('[data-scope="modal"]'));
  if (app.fx) {
    const fx = app.fx;
    app.fx = null;
    stage(fx);
  }
}

function pickScreen() {
  if (app.route === 'game' && app.game) {
    const kind = app.game.step.kind;
    return registry['step_' + kind](app.game);
  }
  return (registry[app.route] || registry.home)();
}

// ------------------------------------------------------------------ navigation

export function go(route) {
  app.route = route;
  app.overlay = null;
  render();
  window.scrollTo(0, 0);
}

export function openOverlay(name) {
  app.overlay = name;
  render();
}
export function closeOverlay() {
  app.overlay = null;
  render();
}

// ------------------------------------------------------------------ partie

export function startGame(config) {
  app.game = createGame(config, app.bank, { seen: store.loadSeen() });
  store.saveGame(app.game);
  store.saveLastSetup(config);
  resetUi();
  app.fx = { event: 'start' };
  go('game');
}

export function resumeGame() {
  const g = store.loadGame();
  if (!g) return;
  // Une partie dont une question a disparu de la banque ne peut pas reprendre.
  if (g.step.qid && !app.bank.byId.has(g.step.qid)) {
    toast('Cette partie utilise une ancienne version de la banque.');
    return;
  }
  app.game = g;
  resetUi();
  go('game');
}

export function quitGame({ erase = false } = {}) {
  if (erase) {
    store.clearGame();
    app.game = null;
  }
  go('home');
}

function resetUi() {
  app.ui = {};
  app.uiKey = app.game ? stepKey(app.game) : '';
}

// État local à l'étape : remis à zéro automatiquement quand l'étape change.
export function ui() {
  const key = app.game ? stepKey(app.game) : '';
  if (key !== app.uiKey) {
    app.ui = {};
    app.uiKey = key;
  }
  return app.ui;
}

// Applique une action du moteur, sauvegarde, puis met en scène le résultat.
export function play(action) {
  const before = app.game;
  let next;
  try {
    next = engineDispatch(before, action, app.bank);
  } catch (e) {
    toast(e.message || String(e));
    return false;
  }
  app.game = next;
  store.saveGame(next);
  if (next.step.kind === 'reveal') store.markSeen(next.step.qid);
  app.fx = describe(before, next);
  app.overlay = null;
  render();
  return true;
}

// Traduit une transition en événement de mise en scène.
function describe(before, next) {
  const b = before.step;
  const n = next.step;
  const base = { prevScores: before.teams.map((t) => t.score), cat: n.cat || b.cat, level: n.level || b.level };
  if (n.kind === 'reveal') {
    if (n.outcome === 'correct') return { ...base, event: 'correct', team: n.winner, points: n.points };
    if (n.outcome === 'vol') return { ...base, event: 'steal', team: n.winner, points: n.points };
    return { ...base, event: 'lost' };
  }
  if (n.kind === 'ask' && n.steal && !(b.kind === 'ask' && b.steal)) return { ...base, event: 'miss' };
  if (n.kind === 'ask' && n.precise && !b.precise) return { ...base, event: 'precise' };
  if (n.kind === 'arbitrage') return { ...base, event: 'arbitrage' };
  if (n.kind === 'turnEnd') return { ...base, event: 'turnEnd' };
  if (n.kind === 'over') return { ...base, event: 'over' };
  if (n.kind === 'choose' && before.active !== next.active) return { ...base, event: 'newTurn' };
  if (n.kind === 'ask' && b.kind === 'choose') return { ...base, event: 'pick' };
  return { ...base, event: 'none' };
}

function stage(fx) {
  const color = fx.cat ? categoryById(fx.cat).couleur : '#ffc94a';
  // Les compteurs repartent des anciens scores puis défilent.
  if (fx.prevScores && app.game) {
    document.querySelectorAll('[data-score]').forEach((el) => {
      const i = Number(el.dataset.score);
      countUp(el, fx.prevScores[i], app.game.teams[i].score);
    });
  }
  const scoreEl = fx.team != null ? document.querySelector(`[data-score="${fx.team}"]`) : null;
  switch (fx.event) {
    case 'correct':
      sfx('correct');
      haptic('success');
      flash(color, 'good');
      setTimeout(() => floatPoints(scoreEl, `+${fx.points}`, color), 120);
      break;
    case 'steal':
      sfx('steal');
      haptic('heavy');
      flash(color, 'good');
      rays(color);
      setTimeout(() => floatPoints(scoreEl, `+${fx.points}`, color), 160);
      break;
    case 'lost':
      sfx('reveal');
      haptic('light');
      break;
    case 'miss':
      sfx('wrong');
      haptic('warning');
      flash('#8a8fbf', 'bad');
      break;
    case 'precise':
    case 'arbitrage':
      sfx('turn');
      haptic('medium');
      break;
    case 'turnEnd':
    case 'newTurn':
      sfx('turn');
      haptic('light');
      break;
    case 'pick':
      sfx('select');
      haptic('light');
      break;
    case 'over':
      sfx('fanfare');
      haptic('heavy');
      setTimeout(() => confetti(['#ffd23f', '#ff4fa3', '#2fe0f0', '#22c98a', '#ff8a3d', '#b06cff']), 200);
      break;
    default:
  }
}

// ------------------------------------------------------------------ réglages

function applySettings() {
  setSoundEnabled(app.settings.sound);
  setHapticsEnabled(app.settings.haptics);
  setReducedMotion(app.settings.reduceMotion);
}

export function updateSettings(patch) {
  app.settings = { ...app.settings, ...patch };
  store.saveSettings(app.settings);
  applySettings();
  render();
}

// ------------------------------------------------------------------ confirmations et messages

export function confirmBox({ title, text, ok = 'Confirmer', cancel = 'Annuler', danger = false }) {
  return new Promise((resolve) => {
    app.modal = { title, text, ok, cancel, danger, resolve };
    render();
  });
}

function modalScreen(m) {
  const close = (v) => {
    app.modal = null;
    render();
    m.resolve(v);
  };
  return {
    html: `<div class="modal-back"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <h2 id="modal-title">${esc(m.title)}</h2><p>${m.text}</p>
      <div class="modal-actions">
        <button class="btn btn-ghost" data-act="no">${esc(m.cancel)}</button>
        <button class="btn ${m.danger ? 'btn-danger' : 'btn-primary'}" data-act="yes">${esc(m.ok)}</button>
      </div></div></div>`,
    mount(el) {
      el.querySelector('[data-act="no"]').onclick = () => close(false);
      el.querySelector('[data-act="yes"]').onclick = () => close(true);
      el.querySelector('.modal-back').onclick = (e) => {
        if (e.target === e.currentTarget) close(false);
      };
    },
  };
}

let toastTimer = null;
export function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

// Petit retour sonore et tactile sur les boutons.
export function tap() {
  sfx('tap');
  haptic('light');
}
