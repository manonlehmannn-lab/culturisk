// Écrans de la partie : choix du thème, question, arbitrage, « Le saviez-vous ? », fin de tour, fin de partie.

import { app, play, ui, render, openOverlay, closeOverlay, confirmBox, go, quitGame, updateSettings, tap } from '../core.js';
import { available, nextLevel, recap, standings } from '../../engine/game.js';
import { CATEGORIES, categoryById, pointsFor } from '../../engine/categories.js';
import { RAISONS } from '../../engine/validation.js';
import { sfx } from '../sound.js';
import { esc, typo, icon, catStyle, catChip, digits, boardRows, miniBoard, scoreboard, roundBanner } from '../widgets.js';
import { rulesContent } from './info.js';

const teamName = (g, i) => esc(g.teams[i].name);
const teamTag = (g, i) => `<b class="t${i}-ink">${teamName(g, i)}</b>`;

function frame(g, { id, cls = '', style = '', body, actions = '', banner = '' }) {
  return {
    id,
    html: `<main class="screen game ${cls}" style="${style}">
      ${scoreboard(g)}
      <div class="banner-row">${banner || roundBanner(g)}<button class="icon-btn" data-act="menu" aria-label="Menu">${icon('menu')}</button></div>
      <div class="scroll">${body}</div>
      ${actions ? `<footer class="actionbar">${actions}</footer>` : ''}
    </main>`,
  };
}

function bindMenu(el) {
  const b = el.querySelector('[data-act="menu"]');
  if (b) b.onclick = () => {
    tap();
    openOverlay('menu');
  };
}

// ------------------------------------------------------------------ choix du thème

export function step_choose(g) {
  const s = ui();
  const can = available(g);
  const current = g.turn.current;
  if (s.selected === undefined) s.selected = current && can.includes(current) ? current : null;
  const sel = s.selected;
  const turnPts = g.turn.log.reduce((n, e) => n + (e.team === g.active ? e.points : 0), 0);

  let lead;
  if (!g.turn.log.length) {
    lead = `<h2 class="lead-title">À vous, ${teamTag(g, g.active)} !</h2><p class="lead-sub">Choisissez un thème : vous jouerez son prochain niveau.</p>`;
  } else {
    lead = `<h2 class="lead-title">On continue ?</h2>
      <p class="lead-sub">Ce tour : <b class="t${g.active}-ink">+${turnPts} pts</b>. Montez d'un niveau, changez de thème ou passez la main pour mettre vos points à l'abri.</p>`;
  }
  let hint = '';
  if (sel && current && sel !== current && can.includes(current)) {
    hint = `<p class="switch-hint">${icon('lock')} Quitter <b>${esc(categoryById(current).nom)}</b> la verrouillera jusqu'à la fin de votre tour.</p>`;
  }
  const selCat = sel && categoryById(sel);
  const lv = sel ? nextLevel(g, sel) : 0;
  const playBtn = sel
    ? `<button class="btn btn-primary btn-play" data-act="play" style="${catStyle(sel)}">
        <span class="bp-ico">${icon(selCat.icone)}</span>
        <span class="bp-txt"><span>Jouer ${esc(selCat.court)}</span><small>Niveau ${lv} · ${pointsFor(lv)} pts</small></span>
      </button>`
    : '<button class="btn btn-primary btn-play" disabled><span class="bp-txt"><span>Choisissez un thème</span></span></button>';
  const passBtn = g.turn.log.length ? `<button class="btn btn-ghost" data-act="pass-turn">${icon('swap')}Passer la main</button>` : '';

  const scr = frame(g, {
    id: 'choose',
    body: `<section class="lead">${lead}</section>
      <div class="board" role="group" aria-label="Les 10 thèmes">${boardRows(g, { selectable: can, selected: sel, current })}</div>
      ${hint}`,
    actions: `${passBtn}${playBtn}`,
  });
  scr.mount = (el) => {
    bindMenu(el);
    el.querySelectorAll('.cat-row').forEach((b) => {
      b.onclick = () => {
        if (b.disabled) return;
        s.selected = b.dataset.cat;
        sfx('select');
        render();
      };
    });
    const p = el.querySelector('[data-act="play"]');
    if (p) p.onclick = () => play({ type: 'pick', cat: sel });
    const pt = el.querySelector('[data-act="pass-turn"]');
    if (pt) pt.onclick = async () => {
      tap();
      const ok = await confirmBox({
        title: 'Passer la main ?',
        text: `Vos <b>${turnPts} points</b> de ce tour sont acquis. La main passe ensuite à ${teamTag(g, 1 - g.active)}.`,
        ok: 'Passer la main',
      });
      if (ok) play({ type: 'endTurn' });
    };
  };
  return scr;
}

// ------------------------------------------------------------------ question

function qHeader(g, st, q) {
  const c = categoryById(st.cat);
  const pts = st.steal ? pointsFor(st.level) * 2 : pointsFor(st.level);
  return `<div class="q-head" style="${catStyle(st.cat)}">
    ${catChip(st.cat)}
    <span class="q-level"><small>Niveau</small><b>${st.level}</b></span>
    <span class="q-pts${st.steal ? ' is-double' : ''}">${st.steal ? '<em>×2</em>' : ''}${digits(pts, { width: 3, cls: 'digits-sm' })}<small>pts</small></span>
  </div>`;
}

export function step_ask(g) {
  const st = g.step;
  const q = app.bank.byId.get(st.qid);
  const s = ui();
  const v = q.validation || {};
  const team = st.team;
  const steal = st.steal;

  const stealBanner = steal
    ? `<div class="steal-banner t${team}">
        <span class="sb-kicker">${icon('bolt')} Droit de réponse</span>
        <span class="sb-title">${teamName(g, team)}</span>
        <span class="sb-sub">${st.missed ? `Réponse refusée\u202f: «\u202f${esc(st.missed)}\u202f»` : 'Question passée'} · répondez gratuitement pour doubler les points</span>
      </div>`
    : '';
  const precise = st.precise
    ? `<p class="notice notice-precise" role="alert">${icon('star')} ${RAISONS['nom-ambigu']} Une seule précision possible.</p>`
    : '';

  const inputMode = v.type === 'nombre' ? 'decimal' : 'text';
  const autocap = v.type === 'personne' ? 'words' : 'off';
  const body = `
    ${stealBanner}
    ${qHeader(g, st, q)}
    <article class="q-card" style="${catStyle(st.cat)}">
      <p class="q-text">${typo(q.question)}</p>
    </article>
    ${precise}
    <form class="answer t${team}" autocomplete="off" novalidate>
      <label for="answer-input" class="answer-label">Réponse de ${teamTag(g, team)}</label>
      <div class="answer-field">
        <input id="answer-input" name="answer" type="text" inputmode="${inputMode}" autocapitalize="${autocap}"
          autocorrect="off" autocomplete="off" spellcheck="false" enterkeyhint="done" maxlength="80"
          placeholder="${v.type === 'nombre' ? 'Un nombre…' : 'Votre réponse…'}" value="${esc(s.draft || '')}">
        <button type="button" class="clear-btn" data-act="clear" aria-label="Effacer">${icon('close')}</button>
      </div>
      <p class="answer-help">Les accents et petites fautes de frappe sont tolérés.</p>
    </form>
    <section class="mini-wrap"><h3 class="mini-title">Le tableau</h3>${miniBoard(g, { active: st.cat })}</section>`;

  const scr = frame(g, {
    id: `ask-${st.cat}-${st.level}-${steal ? 's' : 'n'}`,
    cls: `step-ask t${team}${steal ? ' is-steal' : ''}`,
    style: catStyle(st.cat),
    body,
    actions: `<button class="btn btn-ghost" data-act="skip">Je passe</button>
      <button class="btn btn-primary btn-buzz" data-act="submit" disabled>${icon('check')}Valider</button>`,
  });

  scr.mount = (el) => {
    bindMenu(el);
    const input = el.querySelector('#answer-input');
    const submit = el.querySelector('[data-act="submit"]');
    const form = el.querySelector('form');
    let busy = false;
    // Délai de garde : un double-tap venant de l'écran précédent ne peut pas valider.
    const armedAt = performance.now() + 500;
    const sync = () => {
      s.draft = input.value;
      submit.disabled = !input.value.trim() || busy;
      el.querySelector('.answer-field').classList.toggle('has-text', !!input.value);
    };
    input.addEventListener('input', sync);
    sync();
    // « Entrée » ferme le clavier sans envoyer : la validation se fait toujours avec le bouton.
    form.onsubmit = (e) => {
      e.preventDefault();
      input.blur();
      if (!submit.disabled) {
        submit.classList.remove('nudge');
        void submit.offsetWidth;
        submit.classList.add('nudge');
      }
    };
    el.querySelector('[data-act="clear"]').onclick = () => {
      input.value = '';
      sync();
      input.focus();
    };
    submit.onclick = () => {
      if (busy || performance.now() < armedAt || !input.value.trim()) return;
      busy = true;
      input.blur();
      submit.disabled = true;
      submit.classList.add('is-checking');
      submit.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>Vérification';
      sfx('validate');
      setTimeout(() => play({ type: 'answer', text: input.value }), app.settings.reduceMotion ? 150 : 650);
    };
    el.querySelector('[data-act="skip"]').onclick = async () => {
      tap();
      const ok = await confirmBox({
        title: 'Passer cette question ?',
        text: steal
          ? "Personne ne marquera de points et la réponse sera révélée."
          : `La question sera comptée comme ratée et l’équipe adverse (${teamTag(g, 1 - team)}) pourra intercepter.`,
        ok: 'Je passe',
      });
      if (ok) play({ type: 'pass' });
    };
    // Sur iPhone, on garde le champ visible au-dessus du clavier.
    input.addEventListener('focus', () => setTimeout(() => input.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250));
  };
  return scr;
}

// ------------------------------------------------------------------ arbitrage

export function step_arbitrage(g) {
  const st = g.step;
  const s = ui();
  if (!s.votes) s.votes = [null, null];
  const q = app.bank.byId.get(st.qid);
  const both = s.votes.every((x) => x !== null);
  const agree = both && s.votes[0] === s.votes[1];
  let verdict = '';
  if (both) {
    verdict = agree
      ? `<p class="arb-result ${s.votes[0] ? 'ok' : 'ko'}">Décision commune : réponse ${s.votes[0] ? 'acceptée' : 'refusée'}.</p>`
      : '<p class="arb-result ko">Désaccord : la réponse sera refusée.</p>';
  }
  const voteBlock = (i) => `<div class="arb-team t${i}">
      <span class="arb-name">${teamName(g, i)}${i === st.team ? ' <small>(a répondu)</small>' : ''}</span>
      <div class="seg-toggle" role="radiogroup" aria-label="Avis de ${teamName(g, i)}">
        <button role="radio" aria-checked="${s.votes[i] === true}" class="${s.votes[i] === true ? 'on yes' : ''}" data-vote="${i}:1">${icon('check')}Accepter</button>
        <button role="radio" aria-checked="${s.votes[i] === false}" class="${s.votes[i] === false ? 'on no' : ''}" data-vote="${i}:0">${icon('cross')}Refuser</button>
      </div>
    </div>`;

  const scr = frame(g, {
    id: 'arbitrage',
    cls: 'step-arbitrage',
    style: catStyle(st.cat),
    body: `
      ${qHeader(g, st, q)}
      <article class="q-card is-quiet" style="${catStyle(st.cat)}"><p class="q-text">${typo(q.question)}</p></article>
      <section class="arb-card">
        <span class="arb-kicker">Validation manuelle</span>
        <p class="arb-answer"><small>Réponse proposée par ${teamTag(g, st.team)}</small>« ${esc(st.saisie)} »</p>
        <p class="arb-reason">${esc(RAISONS[st.raison] || "Cette réponse n'a pas pu être validée automatiquement.")}</p>
        <p class="arb-rule">La solution reste cachée. Débattez, puis chaque équipe donne son avis : la réponse n'est acceptée que si <b>les deux équipes</b> l'acceptent.</p>
        ${voteBlock(0)}${voteBlock(1)}
        ${verdict}
      </section>`,
    actions: `<button class="btn btn-primary" data-act="decide" ${both ? '' : 'disabled'}>Enregistrer la décision</button>`,
  });
  scr.mount = (el) => {
    bindMenu(el);
    el.querySelectorAll('[data-vote]').forEach((b) => {
      b.onclick = () => {
        const [i, val] = b.dataset.vote.split(':');
        s.votes[Number(i)] = val === '1';
        tap();
        render();
      };
    });
    el.querySelector('[data-act="decide"]').onclick = () => {
      if (!both) return;
      play({ type: 'arbitrate', votes: s.votes.slice() });
    };
  };
  return scr;
}

// ------------------------------------------------------------------ révélation + « Le saviez-vous ? »

export function learnCard(q, cat) {
  const c = categoryById(cat);
  return `<article class="learn" style="${catStyle(cat)}">
    <header class="learn-head">
      <span class="learn-ico">${icon(c.icone)}</span>
      <span class="learn-kicker">${esc(c.nom)}</span>
      <h2 class="learn-title">Le saviez-vous ?</h2>
    </header>
    <p class="learn-q">${typo(q.question)}</p>
    <p class="learn-answer"><small>Réponse</small>${esc(q.reponse)}</p>
    <p class="learn-text">${typo(q.explication)}</p>
    ${q.anecdote ? `<aside class="learn-fact"><span>${icon('star')} Fait surprenant</span><p>${typo(q.anecdote)}</p></aside>` : ''}
    ${q.source ? `<p class="learn-src">Source : ${esc(q.source)}</p>` : ''}
  </article>`;
}

export function step_reveal(g) {
  const st = g.step;
  const q = app.bank.byId.get(st.qid);
  let ribbon;
  if (st.outcome === 'correct') {
    ribbon = `<div class="verdict good" style="${catStyle(st.cat)}"><span class="v-icon">${icon('check')}</span>
      <span class="v-text"><b>Bonne réponse\u202f!</b><small>« ${esc(st.saisie)} »</small></span><span class="v-pts t${st.winner}-ink">+${st.points}</span></div>`;
  } else if (st.outcome === 'vol') {
    ribbon = `<div class="verdict steal t${st.winner}" style="${catStyle(st.cat)}"><span class="v-icon">${icon('bolt')}</span>
      <span class="v-text"><b>Interception\u202f!</b><small>Retournement pour ${teamName(g, st.winner)}</small></span><span class="v-pts"><em>×2</em> +${st.points}</span></div>`;
  } else {
    ribbon = `<div class="verdict lost"><span class="v-icon">${icon('cross')}</span>
      <span class="v-text"><b>Personne ne marque</b><small>La question est consommée</small></span><span class="v-pts">0</span></div>`;
  }
  const next =
    st.outcome === 'correct'
      ? 'Continuer'
      : 'Voir le bilan du tour';
  const scr = frame(g, {
    id: `reveal-${st.qid}`,
    cls: 'step-reveal',
    style: catStyle(st.cat),
    body: `${ribbon}${learnCard(q, st.cat)}
      <section class="mini-wrap"><h3 class="mini-title">Le tableau</h3>${miniBoard(g, { active: st.cat, flash: { cat: st.cat, level: st.level } })}</section>`,
    actions: `<button class="btn btn-primary" data-act="continue">${next}${icon('arrow')}</button>`,
  });
  scr.mount = (el) => {
    bindMenu(el);
    el.querySelector('[data-act="continue"]').onclick = () => play({ type: 'continue' });
  };
  return scr;
}

// ------------------------------------------------------------------ fin de tour

export function step_turnEnd(g) {
  const st = g.step;
  const t = st.team;
  const other = 1 - t;
  const log = g.turn.log;
  const own = log.filter((e) => e.team === t).reduce((n, e) => n + e.points, 0);
  const stolen = log.filter((e) => e.team === other).reduce((n, e) => n + e.points, 0);
  const why = {
    passe: 'Main passée pour mettre les points à l’abri.',
    rate: 'Une erreur a mis fin au tour.',
    vol: `Dernière question interceptée par ${teamName(g, other)}.`,
    bloque: 'Plus aucun thème disponible pour ce tour.',
  }[st.reason];
  const rows = log
    .map((e, i) => {
      let res = `<span class="tl-res ko">${icon('cross')}0</span>`;
      if (e.outcome === 'correct') res = `<span class="tl-res ok">${icon('check')}+${e.points}</span>`;
      if (e.outcome === 'vol') res = `<span class="tl-res steal t${e.team}-ink">${icon('bolt')}+${e.points} <small>${teamName(g, e.team)}</small></span>`;
      return `<li style="${catStyle(e.cat)};--d:${i * 70}ms">${catChip(e.cat, { short: true })}<span class="tl-lv">Niv. ${e.level}</span>${res}</li>`;
    })
    .join('');
  const lastOfManche = 1 - t === g.starter;
  const endsGame = lastOfManche && g.manches && g.manche >= g.manches;
  const scr = frame(g, {
    id: 'turnEnd',
    cls: 'step-turnend',
    body: `<section class="turn-card t${t}">
        <span class="kicker">Fin du tour</span>
        <h2>${teamName(g, t)}</h2>
        <p class="turn-why">${why}</p>
        <ol class="turn-log">${rows}</ol>
        <div class="turn-total"><span>Points marqués</span><b class="t${t}-ink">+${own}</b></div>
        ${stolen ? `<div class="turn-total"><span>Interceptés par ${teamName(g, other)}</span><b class="t${other}-ink">+${stolen}</b></div>` : ''}
      </section>
      <section class="mini-wrap"><h3 class="mini-title">Progression des thèmes</h3>${miniBoard(g)}</section>
      ${endsGame ? '<p class="next-team">Dernier tour joué : place au verdict !</p>' : `<p class="next-team"><small>${lastOfManche ? `Manche ${g.manche + 1} · ` : ''}la main passe à</small><b class="t${other}-ink">${teamName(g, other)}</b></p>`}`,
    actions: `<button class="btn btn-primary" data-act="continue">${endsGame ? 'Résultats' : `À vous, ${teamName(g, other)}`}${icon('arrow')}</button>`,
  });
  scr.mount = (el) => {
    bindMenu(el);
    el.querySelector('[data-act="continue"]').onclick = () => play({ type: 'continue' });
  };
  return scr;
}

// ------------------------------------------------------------------ fin de partie

export function step_over(g) {
  const { winner, scores } = standings(g);
  const r = recap(g);
  const title = winner == null ? 'Égalité parfaite\u202f!' : `<small>Victoire</small>${teamName(g, winner)}`;
  const fav = (i) => {
    const f = r.favorite[i];
    return f ? `${catChip(f.cat, { short: true })}<b>${f.points} pts</b>` : '<span class="muted">—</span>';
  };
  const best = (i) => {
    const b = r.best[i];
    return b ? `${catChip(b.cat, { short: true })}<b>Niv. ${b.level}</b>` : '<span class="muted">—</span>';
  };
  const maxCat = Math.max(1, ...CATEGORIES.map((c) => Math.max(...r.perCat[c.id].points)));
  const catRows = CATEGORIES.filter((c) => r.perCat[c.id].played)
    .map((c) => {
      const [a, b] = r.perCat[c.id].points;
      return `<li style="${catStyle(c.id)}"><span class="cr-ico">${icon(c.icone)}</span><span class="cr-name">${esc(c.court)}</span>
        <span class="cr-bar t0"><i style="width:${(a / maxCat) * 100}%"></i><b>${a}</b></span>
        <span class="cr-bar t1"><i style="width:${(b / maxCat) * 100}%"></i><b>${b}</b></span></li>`;
    })
    .join('');
  const scr = {
    id: 'over',
    html: `<main class="screen over">
      <div class="scroll">
        <section class="podium${winner == null ? ' is-tie' : ` win-t${winner}`}">
          <div class="podium-rays" aria-hidden="true"></div>
          <span class="kicker">Fin de partie</span>
          <h1 class="podium-title">${title}</h1>
          <div class="final-scores">
            ${[0, 1].map((i) => `<div class="final t${i}${winner === i ? ' is-winner' : ''}"><span>${teamName(g, i)}</span>${digits(scores[i])}${winner === i ? `<em>${icon('star')}</em>` : ''}</div>`).join('')}
          </div>
          <p class="podium-sub">${r.played} question${r.played > 1 ? 's' : ''} jouée${r.played > 1 ? 's' : ''} · ${g.arbitrages.length} arbitrage${g.arbitrages.length > 1 ? 's' : ''}</p>
        </section>
        <section class="recap">
          <h2 class="section-title">Les moments forts</h2>
          <div class="recap-grid">
            <span></span><b class="t0-ink">${teamName(g, 0)}</b><b class="t1-ink">${teamName(g, 1)}</b>
            <span>Thème fétiche</span><span>${fav(0)}</span><span>${fav(1)}</span>
            <span>Plus haut niveau réussi</span><span>${best(0)}</span><span>${best(1)}</span>
            <span>Interceptions</span><span><b>${r.steals[0]}</b></span><span><b>${r.steals[1]}</b></span>
          </div>
          ${catRows ? `<h2 class="section-title">Points par thème</h2><ul class="cat-recap">${catRows}</ul>` : ''}
          <h2 class="section-title">Le tableau final</h2>
          ${miniBoard(g)}
        </section>
      </div>
      <footer class="actionbar">
        <button class="btn btn-ghost" data-act="home">Accueil</button>
        <button class="btn btn-primary" data-act="again">Nouvelle partie</button>
      </footer>
    </main>`,
    mount(el) {
      el.querySelector('[data-act="home"]').onclick = () => quitGame({ erase: true });
      el.querySelector('[data-act="again"]').onclick = () => {
        quitGame({ erase: true });
        go('setup');
      };
    },
  };
  return scr;
}

// ------------------------------------------------------------------ menu de partie

export function overlay_menu() {
  const g = app.game;
  return {
    html: `<div class="drawer-back" data-act="close"><aside class="drawer" role="dialog" aria-modal="true" aria-label="Menu">
      <header class="drawer-head"><h2>Menu</h2><button class="icon-btn" data-act="close" aria-label="Fermer">${icon('close')}</button></header>
      <div class="scroll">
        <button class="menu-item" data-act="close">${icon('arrow')}Reprendre la partie</button>
        <button class="menu-item" data-act="sound">${icon(app.settings.sound ? 'sound' : 'mute')}Son : ${app.settings.sound ? 'activé' : 'coupé'}</button>
        <button class="menu-item" data-act="rules">${icon('litterature')}Règles du jeu</button>
        <button class="menu-item" data-act="home">${icon('back')}Accueil (partie sauvegardée)</button>
        <button class="menu-item danger" data-act="finish">${icon('star')}Terminer la partie maintenant</button>
        <div class="drawer-rules" hidden>${rulesContent()}</div>
      </div>
    </aside></div>`,
    mount(el) {
      el.querySelectorAll('[data-act="close"]').forEach((b) => {
        b.onclick = (e) => {
          if (b.classList.contains('drawer-back') && e.target !== b) return;
          closeOverlay();
        };
      });
      el.querySelector('[data-act="sound"]').onclick = () => updateSettings({ sound: !app.settings.sound });
      el.querySelector('[data-act="rules"]').onclick = () => {
        const r = el.querySelector('.drawer-rules');
        r.hidden = !r.hidden;
        if (!r.hidden) r.scrollIntoView({ behavior: 'smooth' });
      };
      el.querySelector('[data-act="home"]').onclick = () => quitGame();
      el.querySelector('[data-act="finish"]').onclick = async () => {
        const ok = await confirmBox({
          title: 'Terminer la partie ?',
          text: "Les scores actuels deviennent définitifs. Une question en cours n'est pas comptée.",
          ok: 'Terminer',
          danger: true,
        });
        if (ok) play({ type: 'finish' });
      };
    },
  };
}
