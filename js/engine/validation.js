// Validation souple et prudente des réponses, 100 % hors ligne.
//
// Étapes :
//   1. normalisation (casse, accents, ponctuation, espaces, articles, ordinaux) ;
//   2. comparaison exacte avec la réponse principale et les variantes acceptées ;
//   3. gestion contextuelle des noms de famille (nom seul accepté sauf homonymie) ;
//   4. rejet des pièges et des autres réponses connues (pays, capitales, personnalités…) ;
//   5. similarité de Damerau-Levenshtein avec seuils prudents, jamais suffisante à elle seule
//      lorsqu'une autre réponse plausible est aussi proche ;
//   6. tout cas limite part en arbitrage manuel (« douteux ») plutôt que d'être tranché au hasard.
//
// Verdicts : 'correct' | 'incorrect' | 'douteux' (arbitrage) | 'imprecis' (préciser la réponse).

import { normalize, strip, compact } from './text.js';
import { damerau, tolerance } from './distance.js';
import { readNumbers } from './numbers.js';

export const RAISONS = {
  ecart: "La saisie s'écarte sensiblement de l'orthographe attendue.",
  'proche-autre': 'La saisie pourrait aussi désigner une autre réponse.',
  formulation: 'La saisie contient des mots en plus de la réponse.',
  partielle: 'La saisie semble incomplète.',
  plusieurs: 'La saisie contient plusieurs propositions.',
  'nom-ambigu': 'Plusieurs personnalités portent ce nom : précisez (prénom, numéro…).',
};

function prepare(raw) {
  const norm = normalize(raw);
  const s = strip(norm);
  return { raw, norm, s, key: compact(s), full: compact(norm), toks: s.split(' ').filter(Boolean) };
}

const digitsOf = (k) => k.replace(/[^0-9]/g, '');
const ORDINAL_TAIL = /^(\d+|[ivx]+(e|er)?)$/;

// Nom de famille déduit de la réponse principale (« Marie Curie » → « Curie »).
export function surnameOf(q) {
  const v = q.validation || {};
  if (v.nom) return v.nom;
  const toks = String(q.reponse).trim().split(/\s+/);
  if (toks.length < 2) return null;
  let last = toks[toks.length - 1];
  if (ORDINAL_TAIL.test(normalize(last)) && toks.length > 2) last = toks[toks.length - 2];
  return last;
}

export function firstNameOf(q) {
  const v = q.validation || {};
  if (v.prenom) return v.prenom;
  const toks = String(q.reponse).trim().split(/\s+/);
  return toks.length >= 2 ? toks[0] : null;
}

// Formes acceptées telles qu'écrites dans la banque (réponse + variantes).
function declaredForms(q) {
  return [q.reponse, ...(q.variantes || [])].filter((x) => x != null && String(x).trim());
}

// ------------------------------------------------------------------ contexte

// Le contexte regroupe toutes les réponses connues (banque + lexique) en entités :
// deux graphies d'une même entité ne se font jamais concurrence, deux entités différentes oui.
export function buildContext(questions = [], lexique = [], personnes = []) {
  const parent = new Map();
  const find = (k) => {
    while (parent.get(k) !== k) {
      parent.set(k, parent.get(parent.get(k)));
      k = parent.get(k);
    }
    return k;
  };
  const add = (k) => {
    if (!parent.has(k)) parent.set(k, k);
  };
  const union = (a, b) => {
    add(a);
    add(b);
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  const group = (list) => {
    const keys = list.map((x) => prepare(x).key).filter(Boolean);
    keys.forEach(add);
    for (let i = 1; i < keys.length; i++) union(keys[0], keys[i]);
  };

  for (const q of questions) group(declaredForms(q));
  for (const entry of lexique) group(Array.isArray(entry) ? entry : [entry]);
  const people = [];
  for (const p of personnes) {
    const [prenom, nom] = p.split('|');
    const full = `${prenom} ${nom}`;
    group([full]);
    people.push({ full: prepare(full).key, nom: prepare(nom).key });
  }

  // Liste des formes « autres réponses possibles », avec leur entité.
  const seen = new Set();
  const distractors = [];
  const push = (raw) => {
    const f = prepare(raw);
    if (!f.key || seen.has(f.key)) return;
    seen.add(f.key);
    distractors.push(f);
  };
  for (const q of questions) declaredForms(q).forEach(push);
  for (const entry of lexique) (Array.isArray(entry) ? entry : [entry]).forEach(push);
  for (const p of personnes) push(p.replace('|', ' '));

  // Noms de famille portés par plusieurs entités distinctes (Curie, Bach, Dumas…).
  const surnames = new Map();
  const noteSurname = (nomKey, fullKey) => {
    if (!nomKey) return;
    if (!surnames.has(nomKey)) surnames.set(nomKey, new Set());
    surnames.get(nomKey).add(fullKey);
  };
  for (const q of questions) {
    if ((q.validation || {}).type !== 'personne') continue;
    const nom = surnameOf(q);
    if (nom) noteSurname(prepare(nom).key, prepare(q.reponse).key);
  }
  for (const p of people) noteSurname(p.nom, p.full);

  const entity = (key) => (parent.has(key) ? find(key) : key);
  const homonymes = (nomKey) => {
    const set = surnames.get(nomKey);
    if (!set) return 0;
    return new Set([...set].map(entity)).size;
  };
  return { distractors, entity, homonymes };
}

const EMPTY_CTX = buildContext();

// ------------------------------------------------------------------ validation

function result(verdict, raison, extra = {}) {
  return { verdict, raison, ...extra };
}

export function validate(q, input, ctx = EMPTY_CTX) {
  const v = q.validation || {};
  const inp = prepare(input);
  if (!inp.key) return result('incorrect', 'vide');

  // Plusieurs propositions (« Iran ou Irak ») : jamais acceptées automatiquement.
  // (« or » n'est pas retenu : c'est aussi le métal, comme dans « Palme d'or ».)
  const multi = /\bou\b|[/;]/.test(String(input).toLowerCase()) && inp.toks.length > 2;

  // Réponses numériques : on lit le nombre plutôt que de comparer des lettres.
  if (v.type === 'nombre' && v.valeur != null) {
    const nums = readNumbers(input);
    const tol = v.tolerance || 0;
    const ok = nums.filter((n) => Math.abs(n - v.valeur) <= tol);
    if (nums.length === 1) return ok.length ? result('correct', 'nombre') : result('incorrect', 'nombre');
    if (nums.length > 1) return ok.length ? result('douteux', 'plusieurs') : result('incorrect', 'nombre');
  }

  // Formes acceptées.
  const correct = declaredForms(q).map((raw, i) => ({ ...prepare(raw), via: i === 0 ? 'exacte' : 'variante' }));
  const imprecise = [];
  if (v.type === 'personne') {
    const nom = surnameOf(q);
    const prenom = firstNameOf(q);
    if (nom) {
      const nomForm = prepare(nom);
      // Le nom seul suffit, sauf si la question elle-même le rend ambigu (Pierre ou Marie Curie ?).
      // Les homonymies connues sont signalées par l'outil de vérification de la banque.
      if (v.nomSeul === false) imprecise.push(nomForm);
      else correct.push({ ...nomForm, via: 'nom' });
      if (prenom) correct.push({ ...prepare(`${nom} ${prenom}`), via: 'variante' });
    }
    if (prenom && v.prenomSeul === true) correct.push({ ...prepare(prenom), via: 'prenom' });
  }
  const correctKeys = new Set(correct.flatMap((f) => [f.key, f.full]));
  const entities = new Set(correct.map((f) => ctx.entity(f.key)));

  // Autres réponses plausibles : pièges explicites + réponses connues d'autres entités.
  const pieges = (v.pieges || []).map(prepare).filter((f) => f.key && !correctKeys.has(f.key));
  const others = ctx.distractors.filter((f) => !correctKeys.has(f.key) && !entities.has(ctx.entity(f.key)));
  const wrong = [...pieges, ...others];

  // 1. Correspondance exacte (y compris un titre en « X ou Y » comme « Candide ou l'Optimisme »).
  const exact = correct.find((f) => f.key === inp.key || f.full === inp.full);
  if (exact) return result('correct', exact.via);

  // 2. Nom de famille seul alors qu'il est ambigu.
  if (imprecise.some((f) => f.key === inp.key)) return result('imprecis', 'nom-ambigu');

  // 3. Une autre réponse connue, écrite telle quelle.
  if (wrong.some((f) => f.key === inp.key || f.full === inp.full)) return result('incorrect', 'autre-reponse');
  if (multi) return correct.some((f) => inp.s.includes(f.s)) ? result('douteux', 'plusieurs') : result('incorrect', 'eloignee');

  // 4. Similarité : distance à la réponse la plus proche, comparée aux autres réponses plausibles.
  const strict = v.exact === true;
  let best = { d: Infinity, f: null };
  for (const f of correct) {
    if (digitsOf(f.key) !== digitsOf(inp.key)) continue; // « Apollo 11 » ≠ « Apollo 12 »
    const d = damerau(inp.key, f.key, 6);
    if (d < best.d) best = { d, f };
  }
  if (best.f && !strict) {
    const tol = tolerance(best.f.key.length);
    let dw = Infinity;
    for (const f of wrong) {
      const d = damerau(inp.key, f.key, best.d);
      if (d < dw) dw = d;
      if (dw === 0) break;
    }
    const firstLetterChanged = inp.key[0] !== best.f.key[0];
    if (best.d <= tol) {
      if (dw <= best.d) return result('douteux', 'proche-autre', { distance: best.d });
      if (firstLetterChanged) return result('douteux', 'ecart', { distance: best.d });
      return result('correct', 'faute', { distance: best.d });
    }
    if (best.d === tol + 1 && best.f.key.length >= 6 && dw > best.d && !firstLetterChanged) {
      return result('douteux', 'ecart', { distance: best.d });
    }
  }

  // 5. Nom de famille ambigu mal orthographié : on redemande une précision.
  for (const f of imprecise) {
    if (!strict && damerau(inp.key, f.key, 3) <= tolerance(f.key.length) && inp.key[0] === f.key[0]) {
      return result('imprecis', 'nom-ambigu');
    }
  }

  // 6. La bonne réponse noyée dans une phrase, ou une réponse partielle : arbitrage.
  if (!pieges.some((f) => containsTokens(inp.toks, f.toks))) {
    const inside = correct.find((f) => f.key.length >= 4 && containsTokens(inp.toks, f.toks));
    if (inside && inp.toks.length - inside.toks.length <= 3) return result('douteux', 'formulation');
    // (Pour une personne, nom et prénom seuls sont déjà réglés par nomSeul / prenomSeul.)
    if (!strict && v.type !== 'personne' && inp.key.length >= 4) {
      const part = correct.find(
        (f) => f.toks.length > 1 && containsTokens(f.toks, inp.toks) && inp.key.length / f.key.length >= 0.5,
      );
      if (part) return result('douteux', 'partielle');
    }
  }

  return result('incorrect', best.f ? 'eloignee' : 'nombre');
}

// Vrai si la suite de mots `needle` apparaît d'un seul tenant dans `hay`.
function containsTokens(hay, needle) {
  if (!needle.length || needle.length > hay.length) return false;
  outer: for (let i = 0; i + needle.length <= hay.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
}
