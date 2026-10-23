// Écrans d'information : règles, réglages, banque de questions.

import { app, go, updateSettings, confirmBox, toast, tap } from '../core.js';
import { CATEGORIES, LEVELS } from '../../engine/categories.js';
import { clearSeen } from '../../storage.js';
import { esc, icon, catStyle } from '../widgets.js';

function page(id, title, body, { back = 'home' } = {}) {
  return {
    id,
    html: `<main class="screen page">
      <header class="page-head">
        <button class="icon-btn" data-act="back" aria-label="Retour">${icon('back')}</button>
        <h1>${title}</h1>
      </header>
      <div class="scroll">${body}</div>
    </main>`,
    back,
  };
}

function withBack(scr, extra) {
  scr.mount = (el) => {
    el.querySelector('[data-act="back"]').onclick = () => {
      tap();
      go(scr.back);
    };
    if (extra) extra(el);
  };
  return scr;
}

// ------------------------------------------------------------------ règles

export function rulesContent() {
  return `
    <section class="rule-block">
      <h2>Le principe</h2>
      <p>Deux équipes s'affrontent autour d'un seul téléphone sur <b>10 thèmes</b>, chacun gravi du niveau 1 au niveau 10.
      Le tableau est commun : un niveau joué est consommé pour tout le monde.</p>
    </section>
    <section class="rule-block">
      <h2>Votre tour</h2>
      <ol class="rule-list">
        <li>Choisissez un thème : vous jouez son <b>prochain niveau</b>, qui vaut <b>10 points par niveau</b> (niveau 4 = 40 pts).</li>
        <li>Bonne réponse : les points sont à vous et <b>vous continuez</b>. Montez dans le même thème, changez de thème ou <b>passez la main</b> pour mettre vos points à l'abri.</li>
        <li>Un thème que vous quittez est <b>verrouillé jusqu'à la fin de votre tour</b> (il redevient disponible ensuite).</li>
        <li>Mauvaise réponse (ou « Je passe ») : votre tour s'arrête.</li>
      </ol>
    </section>
    <section class="rule-block rule-steal">
      <h2>${icon('bolt')} L'interception</h2>
      <p>Après une erreur, l'équipe adverse a un <b>droit de réponse gratuit</b> sur la même question, sans connaître la solution.
      Bonne réponse : elle marque <b>le double des points</b>. Sinon, personne ne marque. Dans les deux cas, la question est consommée,
      la réponse est révélée, puis c'est à elle de jouer.</p>
    </section>
    <section class="rule-block">
      <h2>Le culturisque</h2>
      <p>Plus vous enchaînez, plus les questions valent cher… et plus une erreur offre de points à l'adversaire. Savoir s'arrêter fait partie du jeu.</p>
    </section>
    <section class="rule-block">
      <h2>Les réponses</h2>
      <ul class="rule-list">
        <li>Accents, majuscules, tirets et petites fautes de frappe sont tolérés : « Einstien » vaut « Einstein ».</li>
        <li>Pour une personnalité, le nom de famille suffit, sauf s'il est ambigu : l'application demande alors de préciser.</li>
        <li>Une réponse proche d'une autre (« Autriche » pour « Australie ») n'est jamais acceptée par ressemblance.</li>
        <li>En cas de doute, <b>les deux équipes arbitrent</b> sans voir la solution : la réponse n'est acceptée que si elles sont d'accord.</li>
      </ul>
    </section>
    <section class="rule-block">
      <h2>Fin de partie</h2>
      <p>Après le nombre de manches choisi (chaque équipe joue un tour par manche), ou quand les 100 cases du tableau sont jouées.
      L'équipe qui a le plus de points l'emporte.</p>
    </section>
    <section class="rule-block">
      <h2>Le saviez-vous ?</h2>
      <p>Chaque question résolue dévoile sa réponse et une courte explication. On joue pour gagner… et pour repartir plus cultivé.</p>
    </section>`;
}

export function rules() {
  return withBack(page('rules', 'Règles du jeu', rulesContent()));
}

// ------------------------------------------------------------------ réglages

const toggle = (key, label, sub) => `<label class="setting">
    <span><b>${label}</b><small>${sub}</small></span>
    <input type="checkbox" class="switch" data-set="${key}" ${app.settings[key] ? 'checked' : ''}>
  </label>`;

export function settings() {
  const body = `
    <section class="settings-list">
      ${toggle('sound', 'Son', 'Courts jingles de jeu télé, jamais de musique continue.')}
      ${toggle('haptics', 'Vibrations', 'Retour tactile si le téléphone le permet.')}
      ${toggle('reduceMotion', 'Animations réduites', 'Supprime éclairs, confettis et défilements.')}
    </section>
    <section class="settings-list">
      <button class="menu-item" data-act="seen">${icon('swap')}Réinitialiser les questions déjà vues</button>
      <button class="menu-item" data-act="bank">${icon('litterature')}La banque de questions</button>
    </section>
    <p class="fineprint">Culturisk fonctionne entièrement hors ligne. Les parties et réglages restent sur cet appareil.</p>`;
  return withBack(page('settings', 'Réglages', body), (el) => {
    el.querySelectorAll('[data-set]').forEach((inp) => {
      inp.onchange = () => updateSettings({ [inp.dataset.set]: inp.checked });
    });
    el.querySelector('[data-act="seen"]').onclick = async () => {
      const ok = await confirmBox({
        title: 'Réinitialiser ?',
        text: 'Les prochaines parties pourront à nouveau tirer des questions déjà posées.',
        ok: 'Réinitialiser',
      });
      if (ok) {
        clearSeen();
        toast('Historique des questions effacé.');
      }
    };
    el.querySelector('[data-act="bank"]').onclick = () => go('bank');
  });
}

// ------------------------------------------------------------------ banque

const STATUTS = {
  a_verifier: ['À vérifier', 'générée, pas encore relue'],
  relue: ['Relue', 'relue par une seconde passe indépendante (IA), pas par une personne'],
  verifiee: ['Vérifiée', 'vérifiée par une personne à partir de la source'],
};

export function bank() {
  const qs = app.bank.questions;
  const counts = {};
  for (const q of qs) {
    const st = (q.verification && q.verification.statut) || 'a_verifier';
    counts[st] = (counts[st] || 0) + 1;
  }
  const rows = CATEGORIES.map((c) => {
    const cells = Array.from({ length: LEVELS }, (_, i) => app.bank.grid[c.id][i].length);
    return `<tr style="${catStyle(c.id)}"><th scope="row"><span class="dot"></span>${esc(c.court)}</th>${cells.map((n) => `<td>${n}</td>`).join('')}<td class="tot">${cells.reduce((a, b) => a + b, 0)}</td></tr>`;
  }).join('');
  const body = `
    <p class="lead-sub">${qs.length} questions, générées et contrôlées avant l'installation. Aucune génération pendant la partie.</p>
    <div class="table-wrap"><table class="bank-table">
      <thead><tr><th scope="col">Niveau</th>${Array.from({ length: LEVELS }, (_, i) => `<th scope="col">${i + 1}</th>`).join('')}<th scope="col">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <h2 class="section-title">Vérification</h2>
    <ul class="status-list">
      ${Object.keys(STATUTS).map((k) => `<li class="st-${k}"><b>${counts[k] || 0}</b><span><strong>${STATUTS[k][0]}</strong> — ${STATUTS[k][1]}</span></li>`).join('')}
    </ul>
    <p class="fineprint">Les sources indiquées sur chaque carte « Le saviez-vous ? » permettent de vérifier les informations.
    Le rapport détaillé (ambiguïtés, explications, formulations datées) est produit par l'outil <code>tools/verifier</code>.</p>`;
  return withBack(page('bank', 'La banque', body, { back: 'settings' }));
}
