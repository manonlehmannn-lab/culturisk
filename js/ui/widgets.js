// Petits composants HTML partagés : échappement, pictogrammes, compteurs, tableau des thèmes.

import { LEVELS, categoryById, pointsFor } from '../engine/categories.js';
import { nextLevel, exhausted } from '../engine/game.js';

export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Texte échappé avec les espaces insécables de la typographie française (« ? », « ! », « : », guillemets).
export function typo(s) {
  return esc(s)
    .replace(/ ([?!:;»])/g, ' $1')
    .replace(/« /g, '« ');
}

// ------------------------------------------------------------------ pictogrammes (24 × 24, trait)

const PATHS = {
  sport: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5.5a2.5 2.5 0 0 0 2.6 3.6M16 6h2.5a2.5 2.5 0 0 1-2.6 3.6"/><path d="M12 13v3.5M8.5 20h7M9.5 16.5h5V20h-5z"/>',
  histoire: '<path d="M3.5 9 12 4.5 20.5 9z"/><path d="M5.5 9.5v8.5M9.8 9.5v8.5M14.2 9.5v8.5M18.5 9.5v8.5M3 20h18"/>',
  geographie: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5s-1.2 6.1-3.8 8.5c-2.6-2.4-3.8-5.2-3.8-8.5S9.4 5.9 12 3.5z"/>',
  sciences: '<ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
  litterature: '<path d="M12 6.5C10 5 7 4.6 3.5 5v13.5c3.5-.4 6.5 0 8.5 1.5 2-1.5 5-1.9 8.5-1.5V5C17 4.6 14 5 12 6.5z"/><path d="M12 6.5V20"/>',
  cinema: '<path d="M4 10.5h16v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="m4 10.5-.6-3.4 15.6-2.8.6 3.4z"/><path d="m8.2 6.3 2 3.2M13 5.4l2 3.3"/>',
  musique: '<path d="M9 17.5V5.5l10.5-2v12"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="17" cy="15.5" r="2.5"/><path d="M9 9.5l10.5-2"/>',
  internet: '<path d="M5 3.5 19 10l-6.2 1.8L10.5 18z"/><path d="m12.8 11.8 5 5"/>',
  religions: '<circle cx="12" cy="12" r="3.6"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  art: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-.9 2-1.8 0-1.2-1-1.5-1-2.5 0-.9.8-1.5 1.8-1.5h2.2a3.5 3.5 0 0 0 3.5-3.5c0-4.3-3.9-7.7-8.5-7.7z"/><circle cx="7.8" cy="11" r="1.2" fill="currentColor"/><circle cx="10.5" cy="7.3" r="1.2" fill="currentColor"/><circle cx="15" cy="7.5" r="1.2" fill="currentColor"/>',
  gastronomie: '<path d="M7 3v7.5a2 2 0 0 0 2 2V21M5 3v5a2 2 0 0 0 2 2M9 3v5a2 2 0 0 1-2 2"/><path d="M17.5 21V3c-2.2 1.6-3.3 4.4-3.3 8.2 0 1.3.9 2.3 2.2 2.3h1.1"/>',
  langue: '<path d="M20 3.5c-7.5.5-12.5 5.5-13.5 13l-2 4"/><path d="M20 3.5c.3 6.5-4.4 11.6-11.6 12.6"/><path d="M8.5 11.5h5M11 8h5.5"/>',
  animaux: '<circle cx="6.5" cy="10" r="1.9"/><circle cx="10" cy="5.8" r="1.9"/><circle cx="14.5" cy="5.8" r="1.9"/><circle cx="18" cy="10" r="1.9"/><path d="M12.2 11.5c-3 0-5.7 3.5-5.7 6 0 1.6 1.2 2.5 2.7 2.5 1.2 0 2-.6 3-.6s1.8.6 3 .6c1.5 0 2.7-.9 2.7-2.5 0-2.5-2.7-6-5.7-6z"/>',
  bd: '<path d="M4 4.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-9.5L6 20v-4.5H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z"/><circle cx="8.5" cy="10" r=".9" fill="currentColor"/><circle cx="12" cy="10" r=".9" fill="currentColor"/><circle cx="15.5" cy="10" r=".9" fill="currentColor"/>',
  jeux: '<rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><circle cx="8.3" cy="8.3" r="1.2" fill="currentColor"/><circle cx="15.7" cy="8.3" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="8.3" cy="15.7" r="1.2" fill="currentColor"/><circle cx="15.7" cy="15.7" r="1.2" fill="currentColor"/>',
  inventions: '<path d="M9 17.5h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.8 10.6c.6.6.8 1.2.8 2v1.9h6v-1.9c0-.8.2-1.4.8-2A6 6 0 0 0 12 3z"/><path d="M12 7.5v3l1.5 1.5"/>',
  television: '<rect x="3" y="7.5" width="18" height="12.5" rx="2"/><path d="m8 3 4 4.5L16 3"/><path d="M17.5 11v5"/>',
  marques: '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7a1 1 0 0 1 .7.3l8.2 8.2a1 1 0 0 1 0 1.4l-7.7 7.7a1 1 0 0 1-1.4 0l-8.2-8.2a1 1 0 0 1-.3-.7z"/><circle cx="8.3" cy="8.3" r="1.6"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  cross: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  mute: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  swap: '<path d="M7 7h11l-3-3M17 17H6l3 3"/>',
  bolt: '<path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9l-5.4 2.9 1.1-6.1-4.5-4.3 6.1-.8z"/>',
};

export function icon(name, cls = '') {
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || ''}</svg>`;
}

// Style d'une catégorie (variables CSS de couleur).
export function catStyle(cat) {
  const c = categoryById(cat);
  return `--c:${c.couleur};--c-ink:${c.encre}`;
}

export function catChip(cat, { short = false } = {}) {
  const c = categoryById(cat);
  return `<span class="cat-chip" style="${catStyle(cat)}">${icon(c.icone)}<span>${esc(short ? c.court : c.nom)}</span></span>`;
}

// ------------------------------------------------------------------ compteur digital (7 segments)

export function digits(value, { width = 4, cls = '', attr = '' } = {}) {
  const v = String(Math.max(0, Math.round(value)));
  const ghost = '8'.repeat(Math.max(width, v.length));
  return `<span class="digits ${cls}" ${attr}><span class="ghost" aria-hidden="true">${ghost}</span><span class="val">${v.padStart(Math.max(width, v.length), '!')}</span></span>`;
}

// ------------------------------------------------------------------ tableau des thèmes

// Échelle de 10 segments : joués (illuminés ou atténués), prochain niveau, à venir.
function ladder(game, cat, { flash = null } = {}) {
  const played = game.board[cat];
  const next = nextLevel(game, cat);
  const done = exhausted(game, cat);
  let html = '';
  for (let lv = 1; lv <= LEVELS; lv++) {
    const cell = played[lv - 1];
    let cls = 'seg';
    if (cell) cls += cell.winner == null ? ' seg-lost' : ` seg-won seg-t${cell.winner}`;
    else if (lv === next && !done) cls += ' seg-next';
    if (flash && flash.cat === cat && flash.level === lv) cls += ' seg-flash';
    html += `<span class="${cls}" data-lv="${lv}">${cell && cell.steal ? '<i>×2</i>' : ''}</span>`;
  }
  return html;
}

// Grand tableau (écran de choix) : une ligne par thème, sélectionnable.
export function boardRows(game, { selectable = [], selected = null, current = null } = {}) {
  return game.categories.map((cat) => {
    const c = categoryById(cat);
    const done = exhausted(game, cat);
    const locked = game.turn.left.includes(cat);
    const can = selectable.includes(cat);
    const lv = nextLevel(game, cat);
    let state = '';
    if (done) state = '<span class="row-state">Complet</span>';
    else if (locked) state = `<span class="row-state locked">${icon('lock')}Verrouillé ce tour</span>`;
    else if (cat === current) state = '<span class="row-state live">En cours</span>';
    const pts = done ? '' : `<span class="row-pts">${pointsFor(lv)}<small>pts</small></span>`;
    return `<button class="cat-row${done ? ' is-done' : ''}${locked ? ' is-locked' : ''}${cat === selected ? ' is-selected' : ''}${cat === current ? ' is-current' : ''}"
      style="${catStyle(cat)}" data-cat="${cat}" ${can ? '' : 'disabled'} aria-pressed="${cat === selected}"
      aria-label="${esc(c.nom)}${done ? ', complet' : `, niveau ${lv}, ${pointsFor(lv)} points`}${locked ? ', verrouillé pour ce tour' : ''}">
      <span class="row-ico">${icon(c.icone)}</span>
      <span class="row-main">
        <span class="row-name">${esc(c.nom)}${state}</span>
        <span class="ladder">${ladder(game, cat)}</span>
      </span>
      ${pts}
    </button>`;
  }).join('');
}

// Tableau compact (pendant une question, en fin de tour) : 10 colonnes de 10 segments.
export function miniBoard(game, { active = null, flash = null } = {}) {
  const n = game.categories.length;
  // Au-delà de 10 thèmes, le tableau passe sur deux rangées pour rester lisible.
  const perRow = Math.ceil(n / Math.ceil(n / 10));
  const cols = game.categories.map((cat) => {
    const c = categoryById(cat);
    const locked = game.turn.left.includes(cat);
    const done = exhausted(game, cat);
    return `<div class="mini-col${cat === active ? ' is-active' : ''}${locked ? ' is-locked' : ''}${done ? ' is-done' : ''}" style="${catStyle(cat)}" title="${esc(c.nom)}">
      <span class="mini-ico">${locked ? icon('lock') : icon(c.icone)}</span>
      <span class="mini-ladder">${ladder(game, cat, { flash })}</span>
    </div>`;
  }).join('');
  return `<div class="mini-board" style="--cols:${perRow}" role="img" aria-label="Progression des ${n} thèmes">${cols}</div>`;
}

// ------------------------------------------------------------------ pupitres des équipes

export function scoreboard(game, { scores = null, highlight = null } = {}) {
  const shown = scores || game.teams.map((t) => t.score);
  const answering = game.step.kind === 'ask' || game.step.kind === 'arbitrage' ? game.step.team : game.active;
  const pupitre = (i) => {
    const t = game.teams[i];
    const isTurn = i === game.active;
    const isAnswering = i === answering;
    let tag = '';
    const stealing = (game.step.kind === 'ask' || game.step.kind === 'arbitrage') && game.step.steal;
    if (game.step.kind === 'over') tag = '';
    else if (stealing) tag = isAnswering ? '<span class="tag tag-steal">Interception</span>' : '';
    else if (isTurn) tag = '<span class="tag">À vous</span>';
    return `<div class="pupitre t${i}${isAnswering && game.step.kind !== 'over' ? ' is-live' : ''}${highlight === i ? ' is-bump' : ''}" data-team="${i}">
      <span class="pupitre-name">${esc(t.name)}</span>
      ${digits(shown[i], { attr: `data-score="${i}" data-to="${t.score}"` })}
      ${tag}
      <span class="bulbs" aria-hidden="true"></span>
    </div>`;
  };
  return `<header class="scoreboard">${pupitre(0)}<span class="vs" aria-hidden="true">VS</span>${pupitre(1)}</header>`;
}

export function roundBanner(game, extra = '') {
  const m = game.manches ? `Manche ${game.manche}<small>/${game.manches}</small>` : `Manche ${game.manche}`;
  return `<div class="round-banner"><span class="rb-manche">${m}</span><span class="rb-sep"></span><span class="rb-turn">${extra || `Tour : <b class="t${game.active}-ink">${esc(game.teams[game.active].name)}</b>`}</span></div>`;
}
