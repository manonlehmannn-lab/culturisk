// Accueil, chargement et préparation de la partie.

import { app, go, render, startGame, resumeGame, confirmBox, tap } from '../core.js';
import { CATEGORIES, CATEGORY_IDS, CLASSIQUES, MIN_CATEGORIES } from '../../engine/categories.js';
import * as store from '../../storage.js';
import { logoMark, wordmark } from '../art.js';
import { esc, icon, catStyle } from '../widgets.js';

export function loading() {
  const err = app.bankError;
  return {
    id: 'loading',
    html: `<main class="screen home is-loading">
      <div class="home-hero">${logoMark({ size: 168 })}${wordmark()}</div>
      <p class="lead-sub">${err ? `Impossible de charger la banque de questions.<br><small>${esc(err)}</small>` : 'Mise en place du plateau…'}</p>
    </main>`,
  };
}

export function home() {
  const saved = store.loadGame();
  const savedOk = saved && saved.step.kind !== 'over';
  const resume = savedOk
    ? `<button class="btn btn-primary btn-xl" data-act="resume">
        <span class="bp-txt"><span>Reprendre la partie</span><small>${esc(saved.teams[0].name)} ${saved.teams[0].score} – ${saved.teams[1].score} ${esc(saved.teams[1].name)}</small></span>${icon('arrow')}
      </button>`
    : '';
  return {
    id: 'home',
    html: `<main class="screen home">
      <div class="home-spot" aria-hidden="true"></div>
      <div class="home-hero">
        ${logoMark({ size: 196 })}
        ${wordmark()}
        <p class="tagline">Le grand quiz de culture générale<br>où chaque bonne réponse est un pari.</p>
      </div>
      <nav class="home-actions">
        ${resume}
        <button class="btn ${savedOk ? 'btn-ghost' : 'btn-primary btn-xl'}" data-act="new">${icon('star')}Nouvelle partie</button>
        <button class="btn btn-ghost" data-act="rules">${icon('litterature')}Règles du jeu</button>
      </nav>
      <footer class="home-foot">
        <button class="link-btn" data-act="settings">Réglages</button>
        <span>·</span>
        <button class="link-btn" data-act="bank">${app.bank ? app.bank.questions.length : ''} questions</button>
      </footer>
    </main>`,
    mount(el) {
      const on = (act, fn) => {
        const b = el.querySelector(`[data-act="${act}"]`);
        if (b) b.onclick = () => {
          tap();
          fn();
        };
      };
      on('resume', resumeGame);
      on('new', async () => {
        if (savedOk) {
          const ok = await confirmBox({
            title: 'Nouvelle partie ?',
            text: 'La partie en cours sera remplacée.',
            ok: 'Nouvelle partie',
            danger: true,
          });
          if (!ok) return;
        }
        go('setup');
      });
      on('rules', () => go('rules'));
      on('settings', () => go('settings'));
      on('bank', () => go('bank'));
    },
  };
}

// ------------------------------------------------------------------ préparation

const NOMS = ['Les Hiboux', 'Les Renards', 'Les Comètes', 'Les Lynx', 'Les Phares', 'Les Érudits', 'Les Météores', 'Les Sphinx', 'Les Boussoles', 'Les Astres'];
const DUREES = [
  { manches: 3, label: '3 manches', sub: '≈ 20 min' },
  { manches: 5, label: '5 manches', sub: '≈ 35 min' },
  { manches: 8, label: '8 manches', sub: '≈ 1 h' },
  { manches: 0, label: 'Tableau complet', sub: (n) => `${n * 10} questions` },
];

function suggestNames() {
  const pool = [...NOMS];
  const pick = () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
  return [pick(), pick()];
}

// Thèmes jouables : ceux pour lesquels la banque contient des questions.
const playable = () => CATEGORY_IDS.filter((id) => app.bank.grid[id].some((ids) => ids.length));

function randomPick(n) {
  const pool = playable();
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return CATEGORY_IDS.filter((id) => out.includes(id));
}

export function setup() {
  if (!app.setup) {
    const last = store.loadLastSetup();
    const ok = playable();
    const cats = last && Array.isArray(last.categories) ? last.categories.filter((c) => ok.includes(c)) : CLASSIQUES.filter((c) => ok.includes(c));
    app.setup = {
      teams: last ? last.teams.slice() : suggestNames(),
      manches: last ? last.manches : 5,
      starter: 0,
      categories: cats.length >= MIN_CATEGORIES ? cats : CLASSIQUES.slice(),
    };
  }
  const s = app.setup;
  const ok = playable();
  const n = s.categories.length;
  const enough = n >= MIN_CATEGORIES;
  const team = (i) => `<div class="team-field t${i}">
      <label for="team-${i}">Équipe ${i + 1}</label>
      <input id="team-${i}" data-team="${i}" type="text" maxlength="18" autocapitalize="words" autocorrect="off" spellcheck="false" enterkeyhint="done" value="${esc(s.teams[i])}">
      <button class="starter${s.starter === i ? ' on' : ''}" data-starter="${i}" aria-pressed="${s.starter === i}">${s.starter === i ? 'Commence' : 'Commencer'}</button>
    </div>`;
  const sameAs = (list) => list.length === n && list.every((c) => s.categories.includes(c));
  const presets = [
    { act: 'classiques', label: 'Les 10 classiques', on: sameAs(CLASSIQUES) },
    { act: 'tous', label: `Tous (${ok.length})`, on: sameAs(ok) },
    { act: 'hasard', label: '10 au hasard', on: false },
  ];
  const chips = CATEGORIES.map((c) => {
    const on = s.categories.includes(c.id);
    const dis = !ok.includes(c.id);
    return `<button class="cat-pick${on ? ' on' : ''}" style="${catStyle(c.id)}" data-cat="${c.id}" aria-pressed="${on}" ${dis ? 'disabled' : ''}>
        <span class="cp-ico">${icon(c.icone)}</span><span class="cp-name">${esc(c.nom)}</span><span class="cp-check">${icon('check')}</span>
      </button>`;
  }).join('');
  return {
    id: 'setup',
    html: `<main class="screen page setup">
      <header class="page-head">
        <button class="icon-btn" data-act="back" aria-label="Retour">${icon('back')}</button>
        <h1>Nouvelle partie</h1>
      </header>
      <div class="scroll">
        <section class="setup-teams">${team(0)}<span class="vs">VS</span>${team(1)}
          <button class="link-btn" data-act="shuffle">${icon('swap')}Autres noms</button>
        </section>
        <div class="section-row"><h2 class="section-title">Thèmes</h2><span class="cat-count${enough ? '' : ' warn'}">${n} sélectionné${n > 1 ? 's' : ''} · ${n * 10} cases</span></div>
        <div class="presets">${presets.map((p) => `<button class="preset${p.on ? ' on' : ''}" data-preset="${p.act}">${p.label}</button>`).join('')}</div>
        <div class="cat-picker" role="group" aria-label="Thèmes de la partie">${chips}</div>
        ${enough ? '' : `<p class="notice notice-precise">${icon('star')} Choisissez au moins ${MIN_CATEGORIES} thèmes.</p>`}
        <h2 class="section-title">Durée</h2>
        <div class="duration">${DUREES.map((d) => `<button class="dur${s.manches === d.manches ? ' on' : ''}" data-manches="${d.manches}" aria-pressed="${s.manches === d.manches}"><b>${d.label}</b><small>${typeof d.sub === 'function' ? d.sub(n) : d.sub}</small></button>`).join('')}</div>
        <p class="fineprint">Une manche = un tour pour chaque équipe. Un tour dure tant que l'équipe répond juste… ou choisit de passer la main.</p>
      </div>
      <footer class="actionbar"><button class="btn btn-primary btn-xl" data-act="go" ${enough ? '' : 'disabled'}>Lancer la partie${icon('arrow')}</button></footer>
    </main>`,
    mount(el) {
      el.querySelector('[data-act="back"]').onclick = () => {
        app.setup = null;
        go('home');
      };
      el.querySelectorAll('[data-team]').forEach((inp) => {
        inp.oninput = () => {
          s.teams[Number(inp.dataset.team)] = inp.value;
        };
        inp.onkeydown = (e) => {
          if (e.key === 'Enter') inp.blur();
        };
      });
      // Les réglages se mettent à jour sur place, sans remonter en haut de l'écran.
      const update = (fn) => {
        tap();
        fn();
        render();
      };
      el.querySelectorAll('[data-starter]').forEach((b) => {
        b.onclick = () => update(() => (s.starter = Number(b.dataset.starter)));
      });
      el.querySelectorAll('[data-manches]').forEach((b) => {
        b.onclick = () => update(() => (s.manches = Number(b.dataset.manches)));
      });
      el.querySelectorAll('[data-cat]').forEach((b) => {
        b.onclick = () =>
          update(() => {
            const id = b.dataset.cat;
            const set = new Set(s.categories);
            if (set.has(id)) set.delete(id);
            else set.add(id);
            s.categories = CATEGORY_IDS.filter((c) => set.has(c));
          });
      });
      el.querySelectorAll('[data-preset]').forEach((b) => {
        b.onclick = () =>
          update(() => {
            const p = b.dataset.preset;
            s.categories = p === 'classiques' ? CLASSIQUES.filter((c) => ok.includes(c)) : p === 'tous' ? ok.slice() : randomPick(10);
          });
      });
      el.querySelector('[data-act="shuffle"]').onclick = () => update(() => (s.teams = suggestNames()));
      el.querySelector('[data-act="go"]').onclick = () => {
        if (!enough) return;
        const teams = s.teams.map((t, i) => t.trim() || `Équipe ${i + 1}`);
        if (teams[0].toLowerCase() === teams[1].toLowerCase()) teams[1] += ' 2';
        app.setup = null;
        startGame({ teams, manches: s.manches, starter: s.starter, categories: s.categories });
      };
    },
  };
}
