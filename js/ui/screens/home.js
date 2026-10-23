// Accueil, chargement et préparation de la partie.

import { app, go, startGame, resumeGame, confirmBox, tap } from '../core.js';
import * as store from '../../storage.js';
import { logoMark, wordmark } from '../art.js';
import { esc, icon } from '../widgets.js';

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
  { manches: 0, label: 'Tableau complet', sub: '100 questions' },
];

function suggestNames() {
  const pool = [...NOMS];
  const pick = () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
  return [pick(), pick()];
}

export function setup() {
  if (!app.setup) {
    const last = store.loadLastSetup();
    app.setup = { teams: last ? last.teams.slice() : suggestNames(), manches: last ? last.manches : 5, starter: 0 };
  }
  const s = app.setup;
  const team = (i) => `<div class="team-field t${i}">
      <label for="team-${i}">Équipe ${i + 1}</label>
      <input id="team-${i}" data-team="${i}" type="text" maxlength="18" autocapitalize="words" autocorrect="off" spellcheck="false" enterkeyhint="done" value="${esc(s.teams[i])}">
      <button class="starter${s.starter === i ? ' on' : ''}" data-starter="${i}" aria-pressed="${s.starter === i}">${s.starter === i ? 'Commence' : 'Commencer'}</button>
    </div>`;
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
        <h2 class="section-title">Durée</h2>
        <div class="duration">${DUREES.map((d) => `<button class="dur${s.manches === d.manches ? ' on' : ''}" data-manches="${d.manches}" aria-pressed="${s.manches === d.manches}"><b>${d.label}</b><small>${d.sub}</small></button>`).join('')}</div>
        <p class="fineprint">Une manche = un tour pour chaque équipe. Un tour dure tant que l'équipe répond juste… ou choisit de passer la main.</p>
      </div>
      <footer class="actionbar"><button class="btn btn-primary btn-xl" data-act="go">Lancer la partie${icon('arrow')}</button></footer>
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
      const rerender = () => go('setup');
      el.querySelectorAll('[data-starter]').forEach((b) => {
        b.onclick = () => {
          tap();
          s.starter = Number(b.dataset.starter);
          rerender();
        };
      });
      el.querySelectorAll('[data-manches]').forEach((b) => {
        b.onclick = () => {
          tap();
          s.manches = Number(b.dataset.manches);
          rerender();
        };
      });
      el.querySelector('[data-act="shuffle"]').onclick = () => {
        tap();
        s.teams = suggestNames();
        rerender();
      };
      el.querySelector('[data-act="go"]').onclick = () => {
        const teams = s.teams.map((t, i) => t.trim() || `Équipe ${i + 1}`);
        if (teams[0].toLowerCase() === teams[1].toLowerCase()) teams[1] += ' 2';
        app.setup = null;
        startGame({ teams, manches: s.manches, starter: s.starter });
      };
    },
  };
}
