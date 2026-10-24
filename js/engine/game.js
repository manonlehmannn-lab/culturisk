// Moteur de partie : état sérialisable + transitions pures (dispatch).
//
// Déroulement d'un tour :
//   choose  → l'équipe active choisit un thème (prochain niveau disponible) ou passe la main ;
//   ask     → elle répond ; la solution n'est jamais montrée à ce stade ;
//   arbitrage → réponse douteuse : les deux équipes tranchent, décision enregistrée d'abord ;
//   ask (interception) → en cas d'erreur, l'adversaire répond gratuitement pour le double des points ;
//   reveal  → question définitivement résolue : réponse + « Le saviez-vous ? » ;
//   turnEnd → résumé du tour, puis la main passe à l'autre équipe.

import { CATEGORY_IDS, CLASSIQUES, MIN_CATEGORIES, LEVELS, pointsFor } from './categories.js';
import { validate } from './validation.js';

export const SCHEMA = 2; // 2 : thèmes choisis par partie (state.categories)

const clone = (o) => JSON.parse(JSON.stringify(o));
const other = (team) => 1 - team;

// ------------------------------------------------------------------ création

// Tire une question par thème et par niveau, en évitant celles déjà vues dans les parties précédentes.
function drawQuestions(bank, categories, seen, rng) {
  const seenSet = new Set(seen);
  const draw = {};
  for (const cat of categories) {
    draw[cat] = bank.grid[cat].map((ids) => {
      if (!ids.length) return null;
      const fresh = ids.filter((id) => !seenSet.has(id));
      const pool = fresh.length ? fresh : ids;
      return pool[Math.floor(rng() * pool.length)];
    });
  }
  return draw;
}

export function createGame(config, bank, { seen = [], rng = Math.random, now = Date.now() } = {}) {
  const names = (config.teams || []).map((t, i) => String(t || '').trim() || `Équipe ${i + 1}`);
  if (names.length !== 2) throw new Error('Il faut deux équipes.');
  const starter = config.starter === 1 ? 1 : 0;
  // Thèmes de la partie, dans l'ordre officiel ; les 10 classiques par défaut.
  const wanted = new Set(config.categories || CLASSIQUES);
  const categories = CATEGORY_IDS.filter((cat) => wanted.has(cat) && bank.grid[cat].some((ids) => ids.length));
  if (categories.length < MIN_CATEGORIES) throw new Error(`Choisissez au moins ${MIN_CATEGORIES} thèmes.`);
  const board = {};
  for (const cat of categories) board[cat] = [];
  return {
    schema: SCHEMA,
    id: `p${now.toString(36)}`,
    createdAt: now,
    teams: names.map((name) => ({ name, score: 0 })),
    manches: Math.max(0, config.manches | 0), // 0 = jusqu'à épuisement du plateau
    manche: 1,
    starter,
    active: starter,
    categories,
    board,
    draw: drawQuestions(bank, categories, seen, rng),
    turn: freshTurn(starter),
    step: { kind: 'choose' },
    history: [],
    arbitrages: [],
  };
}

// Reprise d'une partie sauvegardée par une version précédente de l'application.
export function upgrade(state) {
  if (!state || !state.step) return null;
  if (state.schema === 1) return { ...state, schema: SCHEMA, categories: CLASSIQUES.slice() };
  return state.schema === SCHEMA && Array.isArray(state.categories) ? state : null;
}

function freshTurn(team) {
  return { team, current: null, left: [], log: [] };
}

// ------------------------------------------------------------------ lecture

export const nextLevel = (state, cat) => state.board[cat].length + 1;
export const exhausted = (state, cat) => nextLevel(state, cat) > LEVELS || !state.draw[cat][nextLevel(state, cat) - 1];
export const boardDone = (state) => state.categories.every((cat) => exhausted(state, cat));

// Thèmes jouables par l'équipe active : ni épuisés, ni quittés pendant ce tour.
export function available(state) {
  return state.categories.filter((cat) => !exhausted(state, cat) && !state.turn.left.includes(cat));
}

export const questionOf = (state, bank) => (state.step.qid ? bank.byId.get(state.step.qid) : null);

// Clé unique d'étape (brouillons, animations).
export function stepKey(state) {
  const s = state.step;
  return [s.kind, s.cat || '', s.level || '', s.team == null ? '' : s.team, s.steal ? 'v' : '', state.history.length].join(':');
}

// ------------------------------------------------------------------ transitions

export function dispatch(state, action, bank) {
  const s = clone(state);
  const step = s.step;
  switch (action.type) {
    case 'pick': {
      if (step.kind !== 'choose') throw new Error("Ce n'est pas le moment de choisir un thème.");
      const cat = action.cat;
      if (!available(s).includes(cat)) throw new Error('Ce thème est indisponible pour ce tour.');
      if (s.turn.current && s.turn.current !== cat) s.turn.left.push(s.turn.current);
      s.turn.current = cat;
      const level = nextLevel(s, cat);
      s.step = { kind: 'ask', cat, level, qid: s.draw[cat][level - 1], team: s.active, steal: false, missed: null, precise: false };
      return s;
    }

    case 'endTurn': {
      if (step.kind !== 'choose') throw new Error("Impossible de passer la main maintenant.");
      if (!s.turn.log.length) throw new Error('Répondez au moins à une question avant de passer la main.');
      s.step = { kind: 'turnEnd', team: s.active, reason: 'passe' };
      return s;
    }

    case 'answer':
    case 'pass': {
      if (step.kind !== 'ask') throw new Error("Aucune question en cours.");
      const q = bank.byId.get(step.qid);
      const text = action.type === 'pass' ? '' : String(action.text || '');
      if (action.type === 'answer' && !text.trim()) throw new Error('Saisissez une réponse.');
      const res = action.type === 'pass' ? { verdict: 'incorrect', raison: 'passe' } : validate(q, text, bank.ctx);
      if (res.verdict === 'imprecis' && !step.precise) {
        s.step = { ...step, precise: true, lastInput: text };
        return s;
      }
      if (res.verdict === 'douteux') {
        s.step = { kind: 'arbitrage', cat: step.cat, level: step.level, qid: step.qid, team: step.team, steal: step.steal, missed: step.missed, saisie: text, raison: res.raison };
        return s;
      }
      return resolve(s, res.verdict === 'correct', text);
    }

    case 'arbitrate': {
      if (step.kind !== 'arbitrage') throw new Error('Aucun arbitrage en cours.');
      const votes = action.votes;
      if (!Array.isArray(votes) || votes.length !== 2 || votes.some((v) => typeof v !== 'boolean')) {
        throw new Error('Les deux équipes doivent se prononcer.');
      }
      // Acceptée seulement si les deux équipes l'acceptent ; la décision est enregistrée avant les points.
      const accepted = votes[0] && votes[1];
      s.arbitrages.push({ qid: step.qid, team: step.team, steal: step.steal, saisie: step.saisie, raison: step.raison, votes, accepted });
      s.step = { kind: 'ask', cat: step.cat, level: step.level, qid: step.qid, team: step.team, steal: step.steal, missed: step.missed };
      return resolve(s, accepted, step.saisie);
    }

    case 'continue': {
      if (step.kind === 'reveal') {
        if (boardDone(s)) {
          s.step = { kind: 'over', reason: 'plateau' };
          return s;
        }
        if (step.outcome === 'correct') {
          s.step = available(s).length ? { kind: 'choose' } : { kind: 'turnEnd', team: s.active, reason: 'bloque' };
        } else {
          s.step = { kind: 'turnEnd', team: s.active, reason: step.outcome === 'vol' ? 'vol' : 'rate' };
        }
        return s;
      }
      if (step.kind === 'turnEnd') {
        const next = other(s.active);
        if (next === s.starter) {
          if (s.manches && s.manche >= s.manches) {
            s.step = { kind: 'over', reason: 'manches' };
            return s;
          }
          s.manche += 1;
        }
        s.active = next;
        s.turn = freshTurn(next);
        s.step = { kind: 'choose' };
        return s;
      }
      throw new Error('Rien à continuer.');
    }

    case 'finish': {
      s.step = { kind: 'over', reason: 'manuel' };
      return s;
    }

    default:
      throw new Error(`Action inconnue : ${action.type}`);
  }
}

// Applique le verdict définitif d'une réponse (après validation automatique ou arbitrage).
function resolve(s, correct, text) {
  const step = s.step;
  const base = pointsFor(step.level);
  const entry = { cat: step.cat, level: step.level, qid: step.qid };

  if (!step.steal) {
    if (correct) {
      s.teams[step.team].score += base;
      s.board[step.cat].push({ ...entry, winner: step.team, steal: false });
      s.turn.log.push({ ...entry, outcome: 'correct', team: step.team, points: base });
      s.history.push({ ...entry, by: step.team, outcome: 'correct', winner: step.team, points: base });
      s.step = { kind: 'reveal', ...entry, outcome: 'correct', winner: step.team, points: base, saisie: text };
      return s;
    }
    // Raté : droit de réponse gratuit pour l'adversaire, sans rien révéler.
    s.step = { kind: 'ask', ...entry, team: other(step.team), steal: true, missed: text, precise: false };
    return s;
  }

  const by = other(step.team);
  if (correct) {
    const pts = base * 2;
    s.teams[step.team].score += pts;
    s.board[step.cat].push({ ...entry, winner: step.team, steal: true });
    s.turn.log.push({ ...entry, outcome: 'vol', team: step.team, points: pts });
    s.history.push({ ...entry, by, outcome: 'vol', winner: step.team, points: pts });
    s.step = { kind: 'reveal', ...entry, outcome: 'vol', winner: step.team, points: pts, saisie: text, missed: step.missed };
    return s;
  }
  s.board[step.cat].push({ ...entry, winner: null, steal: false });
  s.turn.log.push({ ...entry, outcome: 'perdu', team: null, points: 0 });
  s.history.push({ ...entry, by, outcome: 'perdu', winner: null, points: 0 });
  s.step = { kind: 'reveal', ...entry, outcome: 'perdu', winner: null, points: 0, saisie: text, missed: step.missed };
  return s;
}

// ------------------------------------------------------------------ bilans

export function standings(state) {
  const [a, b] = state.teams.map((t) => t.score);
  return { winner: a === b ? null : a > b ? 0 : 1, scores: [a, b] };
}

// Récapitulatif de fin de partie : points par thème et par équipe, interceptions, plus haut niveau réussi.
export function recap(state) {
  const perCat = {};
  for (const cat of state.categories) perCat[cat] = { points: [0, 0], played: state.board[cat].length };
  const steals = [0, 0];
  const best = [null, null];
  for (const h of state.history) {
    if (h.winner == null) continue;
    perCat[h.cat].points[h.winner] += h.points;
    if (h.outcome === 'vol') steals[h.winner] += 1;
    const b = best[h.winner];
    if (!b || h.level > b.level) best[h.winner] = { cat: h.cat, level: h.level };
  }
  const favorite = [0, 1].map((t) => {
    let top = null;
    for (const cat of state.categories) {
      const p = perCat[cat].points[t];
      if (p > 0 && (!top || p > top.points)) top = { cat, points: p };
    }
    return top;
  });
  return { perCat, steals, best, favorite, played: state.history.length };
}
