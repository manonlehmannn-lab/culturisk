// Déroulement d'une partie : tours, interception, arbitrage, verrouillage des thèmes, fin de partie.

import { test, eq, ok, throws } from './harness.js';
import { createGame, dispatch, available, recap, boardDone } from '../js/engine/game.js';
import { indexBank } from '../js/engine/bank.js';
import { CATEGORY_IDS } from '../js/engine/categories.js';

// Banque factice : une question par thème et par niveau, réponse « R<thème><niveau> ».
function fakeBank() {
  const files = CATEGORY_IDS.map((cat) => ({
    categorie: cat,
    questions: Array.from({ length: 10 }, (_, i) => ({
      id: `${cat}-${i + 1}`,
      categorie: cat,
      niveau: i + 1,
      question: `Question ${cat} ${i + 1} ?`,
      reponse: `Réponse ${cat} numéro ${i + 1}`,
      variantes: [],
      validation: { type: 'texte' },
      explication: '…',
    })),
  }));
  const bank = indexBank(files);
  // Le lexique réel ne doit pas interférer avec ces réponses factices.
  return bank;
}

const bank = fakeBank();
const good = (cat, level) => `Réponse ${cat} numéro ${level}`;
const newGame = (manches = 2) => createGame({ teams: ['Les Hiboux', 'Les Renards'], manches }, bank, { rng: () => 0, now: 1 });
const act = (g, a) => dispatch(g, a, bank);

test('Création : scores nuls, plateau vierge, équipe 1 commence', () => {
  const g = newGame();
  eq(g.teams.map((t) => t.score), [0, 0]);
  eq(g.active, 0);
  eq(g.step.kind, 'choose');
  eq(available(g).length, 10);
});

test('Bonne réponse : points du niveau, révélation, le tour continue', () => {
  let g = act(newGame(), { type: 'pick', cat: 'sport' });
  eq(g.step.kind, 'ask');
  eq(g.step.level, 1);
  g = act(g, { type: 'answer', text: good('sport', 1) });
  eq(g.step.kind, 'reveal');
  eq(g.step.outcome, 'correct');
  eq(g.teams[0].score, 10);
  g = act(g, { type: 'continue' });
  eq(g.step.kind, 'choose');
  eq(g.active, 0);
  g = act(g, { type: 'pick', cat: 'sport' });
  eq(g.step.level, 2);
});

test('Changer de thème verrouille le précédent pour le reste du tour seulement', () => {
  let g = act(newGame(), { type: 'pick', cat: 'sport' });
  g = act(act(g, { type: 'answer', text: good('sport', 1) }), { type: 'continue' });
  g = act(g, { type: 'pick', cat: 'musique' });
  ok(g.turn.left.includes('sport'), 'sport verrouillé');
  g = act(act(g, { type: 'answer', text: good('musique', 1) }), { type: 'continue' });
  ok(!available(g).includes('sport'), 'sport indisponible');
  throws(() => act(g, { type: 'pick', cat: 'sport' }));
  g = act(g, { type: 'endTurn' });
  g = act(g, { type: 'continue' });
  eq(g.active, 1);
  ok(available(g).includes('sport'), "sport de nouveau disponible pour l'autre équipe");
});

test('Erreur : interception gratuite, rien n’est révélé, double des points', () => {
  let g = act(newGame(), { type: 'pick', cat: 'histoire' });
  g = act(g, { type: 'answer', text: 'nimporte quoi du tout' });
  eq(g.step.kind, 'ask');
  ok(g.step.steal, 'interception');
  eq(g.step.team, 1);
  eq(g.board.histoire.length, 0, 'question pas encore consommée');
  g = act(g, { type: 'answer', text: good('histoire', 1) });
  eq(g.step.kind, 'reveal');
  eq(g.step.outcome, 'vol');
  eq(g.teams[1].score, 20);
  eq(g.board.histoire.length, 1);
  g = act(g, { type: 'continue' });
  eq(g.step.kind, 'turnEnd');
  g = act(g, { type: 'continue' });
  eq(g.active, 1);
  eq(g.step.kind, 'choose');
});

test('Interception ratée : personne ne marque, question consommée', () => {
  let g = act(newGame(), { type: 'pick', cat: 'art' });
  g = act(g, { type: 'pass' });
  g = act(g, { type: 'pass' });
  eq(g.step.kind, 'reveal');
  eq(g.step.outcome, 'perdu');
  eq(g.teams.map((t) => t.score), [0, 0]);
  eq(g.board.art.length, 1);
});

test('Arbitrage : décision des deux équipes enregistrée avant les points', () => {
  let g = act(newGame(), { type: 'pick', cat: 'cinema' });
  g = act(g, { type: 'answer', text: `c'est ${good('cinema', 1)} voilà` });
  eq(g.step.kind, 'arbitrage');
  eq(g.teams[0].score, 0);
  throws(() => act(g, { type: 'arbitrate', votes: [true] }));
  const accepted = act(g, { type: 'arbitrate', votes: [true, true] });
  eq(accepted.arbitrages.length, 1);
  eq(accepted.step.outcome, 'correct');
  eq(accepted.teams[0].score, 10);
  const refused = act(g, { type: 'arbitrate', votes: [true, false] });
  eq(refused.arbitrages[0].accepted, false);
  eq(refused.step.kind, 'ask');
  ok(refused.step.steal, 'désaccord = réponse refusée, interception');
});

test('Passer la main exige au moins une question jouée', () => {
  const g = newGame();
  throws(() => act(g, { type: 'endTurn' }));
});

test('Fin de partie après le nombre de manches choisi', () => {
  let g = newGame(1);
  g = act(act(g, { type: 'pick', cat: 'sport' }), { type: 'answer', text: good('sport', 1) });
  g = act(act(g, { type: 'continue' }), { type: 'endTurn' });
  g = act(g, { type: 'continue' });
  eq(g.active, 1);
  g = act(act(g, { type: 'pick', cat: 'sport' }), { type: 'answer', text: good('sport', 2) });
  g = act(act(g, { type: 'continue' }), { type: 'endTurn' });
  g = act(g, { type: 'continue' });
  eq(g.step.kind, 'over');
  eq(g.teams.map((t) => t.score), [10, 20]);
});

test('Plateau épuisé : la partie se termine', () => {
  let g = newGame(0);
  for (const cat of CATEGORY_IDS) {
    for (let level = 1; level <= 10; level++) {
      if (g.step.kind === 'turnEnd') g = act(g, { type: 'continue' });
      g = act(g, { type: 'pick', cat });
      g = act(g, { type: 'answer', text: good(cat, level) });
      if (boardDone(g)) break;
      g = act(g, { type: 'continue' });
      if (g.step.kind === 'choose' && level === 10) {
        g = act(g, { type: 'endTurn' });
      }
    }
  }
  g = act(g, { type: 'continue' });
  eq(g.step.kind, 'over');
  const r = recap(g);
  eq(r.played, 100);
});

test('Nom ambigu : une seule demande de précision, puis refus', () => {
  const files = [{ categorie: 'sciences', questions: [{ id: 'sci-01-1', categorie: 'sciences', niveau: 1, question: '?', reponse: 'Marie Curie', variantes: [], validation: { type: 'personne', nomSeul: false } }] }];
  const b = indexBank(files);
  let g = createGame({ teams: ['A', 'B'], manches: 0 }, b, { rng: () => 0 });
  g = dispatch(g, { type: 'pick', cat: 'sciences' }, b);
  g = dispatch(g, { type: 'answer', text: 'Curie' }, b);
  eq(g.step.kind, 'ask');
  ok(g.step.precise, 'précision demandée');
  g = dispatch(g, { type: 'answer', text: 'Curie' }, b);
  ok(g.step.steal, 'refusée au second essai');
});
