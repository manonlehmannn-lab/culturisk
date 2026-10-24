// Contrôle qualité de la banque de questions : structure, ambiguïtés, explications, formulations datées.
// Partagé par tools/verifier.mjs (Node, CI) et tools/verifier.html (navigateur).

import { CATEGORIES, CATEGORY_IDS, LEVELS } from '../js/engine/categories.js';
import { indexBank } from '../js/engine/bank.js';
import { validate, surnameOf } from '../js/engine/validation.js';
import { normalize, strip, compact, wordCount } from '../js/engine/text.js';
import { damerau, tolerance } from '../js/engine/distance.js';

const PREFIXES = {
  sport: 'spo', histoire: 'his', geographie: 'geo', sciences: 'sci', litterature: 'lit',
  cinema: 'cin', musique: 'mus', internet: 'web', religions: 'rel', art: 'art',
  gastronomie: 'gas', langue: 'lan', animaux: 'ani', bd: 'bdm', jeux: 'jeu',
  inventions: 'inv', television: 'tel', marques: 'mar',
};
const MIN_PAR_NIVEAU = 4;
const TEMPS = /\b(actuellement|aujourd'hui|aujourd’hui|en ce moment|récemment|recemment|le plus récent|la plus récente|de nos jours|à ce jour)\b/i;
const FORMULES = /^(saviez-vous|le saviez-vous|fait fascinant|il est intéressant de noter|fun fact|anecdote :)/i;
const STATUTS = ['a_verifier', 'relue', 'verifiee'];

const keyOf = (s) => compact(strip(normalize(s)));

export function verifyBank(files) {
  const issues = [];
  const add = (level, qid, cat, message) => issues.push({ level, qid, cat, message });
  const bank = indexBank(files);
  const { ctx } = bank;
  const seenIds = new Map();

  for (const file of files) {
    const cat = file.categorie;
    if (!CATEGORY_IDS.includes(cat)) add('erreur', '-', cat, `Thème inconnu : ${cat}`);
    const answersInCat = new Map();
    for (const q of file.questions || []) {
      const id = q.id || '(sans id)';
      const E = (m) => add('erreur', id, cat, m);
      const W = (m) => add('attention', id, cat, m);

      // --- Structure
      for (const f of ['id', 'categorie', 'niveau', 'question', 'reponse', 'variantes', 'validation', 'explication', 'verification']) {
        if (q[f] == null) E(`Champ manquant : ${f}`);
      }
      if (seenIds.has(id)) E(`Identifiant en double (aussi dans ${seenIds.get(id)})`);
      seenIds.set(id, cat);
      if (q.categorie !== cat) E(`Catégorie « ${q.categorie} » dans le fichier « ${cat} »`);
      if (!Number.isInteger(q.niveau) || q.niveau < 1 || q.niveau > LEVELS) E(`Niveau invalide : ${q.niveau}`);
      const m = /^([a-z]{3})-(\d\d)-\d+$/.exec(id);
      if (!m) E("Format d'identifiant attendu : xxx-NN-n");
      else {
        if (m[1] !== PREFIXES[cat]) E(`Préfixe attendu : ${PREFIXES[cat]}`);
        if (Number(m[2]) !== q.niveau) E("Le niveau de l'identifiant ne correspond pas au champ niveau");
      }
      if (!Array.isArray(q.variantes)) E('variantes doit être une liste');
      const v = q.validation || {};
      if (v.type && !['texte', 'personne', 'nombre'].includes(v.type)) E(`Type de validation inconnu : ${v.type}`);
      if (v.type === 'nombre' && typeof v.valeur !== 'number') E('Type nombre sans valeur numérique');
      const statut = q.verification && q.verification.statut;
      if (!STATUTS.includes(statut)) E(`Statut de vérification invalide : ${statut}`);
      if (!q.source) W('Source de vérification absente');

      // --- Énoncé
      const question = String(q.question || '');
      if (!question.trim().endsWith('?')) W('La question ne se termine pas par « ? »');
      if (TEMPS.test(question) && !/\b(1[0-9]{3}|20[0-9]{2})\b/.test(question)) {
        W('Formulation sensible au temps sans date (préférer « En 2024… »)');
      }
      const repKey = keyOf(q.reponse || '');
      if (repKey.length >= 4 && compact(normalize(question)).includes(repKey)) W("La réponse apparaît dans l'énoncé");
      if (String(q.reponse || '').split(/\s+/).length > 5) W(`Réponse longue à taper : « ${q.reponse} »`);
      if (wordCount(question) > 30) W(`Énoncé long (${wordCount(question)} mots)`);

      // --- Explication
      const n = wordCount(q.explication);
      if (n < 40 || n > 80) E(`Explication de ${n} mots (attendu : 40 à 80)`);
      if (FORMULES.test(String(q.explication || '').trim())) W('Explication qui commence par une formule toute faite');
      if (q.anecdote && wordCount(q.anecdote) > 35) W(`Anecdote de ${wordCount(q.anecdote)} mots (35 maximum)`);
      if (repKey && keyOf(q.explication || '') === repKey) E("L'explication se contente de reformuler la réponse");

      if (!q.reponse) continue;

      // --- Cohérence de la validation : la banque doit accepter ses propres réponses…
      const self = validate(q, q.reponse, ctx);
      if (self.verdict !== 'correct') E(`La réponse principale n'est pas acceptée (${self.verdict})`);
      for (const alt of q.variantes || []) {
        const r = validate(q, alt, ctx);
        if (r.verdict !== 'correct') E(`Variante « ${alt} » non acceptée (${r.verdict} : ${r.raison})`);
      }
      // … et refuser ses pièges.
      const accepted = new Set([q.reponse, ...(q.variantes || [])].map(keyOf));
      for (const p of v.pieges || []) {
        if (accepted.has(keyOf(p))) {
          E(`Piège « ${p} » identique à une réponse acceptée`);
          continue;
        }
        const r = validate(q, p, ctx);
        if (r.verdict === 'correct') E(`Ambiguïté : le piège « ${p} » serait accepté`);
      }
      if (v.type === 'nombre' && typeof v.valeur === 'number') {
        const r = validate(q, String(v.valeur), ctx);
        if (r.verdict !== 'correct') E(`La valeur ${v.valeur} n'est pas acceptée`);
      }

      // --- Noms de famille partagés par plusieurs personnalités connues.
      // (nomSeul: true explicite = la question lève elle-même l'ambiguïté.)
      if (v.type === 'personne' && v.nomSeul === undefined) {
        const nom = surnameOf(q);
        if (nom && ctx.homonymes(keyOf(nom)) > 1) {
          W(`Le nom « ${nom} » est porté par plusieurs personnalités : vérifier si la question exige nomSeul: false`);
        }
      }
      if (v.type === 'personne' && String(q.reponse).trim().split(/\s+/).length < 2 && !v.nom) {
        W('Type personne avec un seul mot : préférer le type texte');
      }

      // --- Réponse très proche d'une autre entité connue sans piège déclaré : les fautes iront en arbitrage.
      // (Un chiffre différent n'est jamais pris pour une faute : « 2007 » ne concurrence pas « 2001 ».)
      if (!(v.pieges || []).length && !v.exact && v.type !== 'nombre') {
        const tol = tolerance(repKey.length);
        const digits = repKey.replace(/\D/g, '');
        const close = ctx.distractors.find(
          (f) =>
            !accepted.has(f.key) &&
            f.key.replace(/\D/g, '') === digits &&
            ctx.entity(f.key) !== ctx.entity(repKey) &&
            damerau(repKey, f.key, tol) <= tol,
        );
        if (close) W(`Réponse proche de « ${close.raw} » : envisager un piège ou exact: true`);
      }

      // --- Doublons de réponse dans un même thème.
      const ent = ctx.entity(repKey);
      // (Deux nombres identiques désignent normalement deux faits différents : « 3 » touches, « 3 » points.)
      if (v.type === 'nombre' || /^\d+$/.test(repKey)) continue;
      if (answersInCat.has(ent)) W(`Même réponse que ${answersInCat.get(ent)} : vérifier qu'il ne s'agit pas du même fait`);
      else answersInCat.set(ent, id);
    }
  }

  // --- Énoncés en double ou quasi identiques dans toute la banque (mots communs ≥ 85 %).
  const all = bank.questions.map((q) => ({ q, toks: new Set(normalize(q.question || '').split(' ').filter((t) => t.length > 2)) }));
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i].toks;
      const b = all[j].toks;
      if (!a.size || !b.size) continue;
      let common = 0;
      for (const t of a) if (b.has(t)) common++;
      const sim = common / Math.max(a.size, b.size);
      if (sim === 1 && a.size === b.size) add('erreur', all[j].q.id, all[j].q.categorie, `Énoncé identique à ${all[i].q.id}`);
      else if (sim >= 0.85) add('attention', all[j].q.id, all[j].q.categorie, `Énoncé très proche de ${all[i].q.id}`);
    }
  }

  // --- Couverture des niveaux.
  for (const cat of CATEGORY_IDS) {
    if (!files.some((f) => f.categorie === cat)) {
      add('erreur', '-', cat, 'Fichier de thème absent');
      continue;
    }
    for (let lv = 1; lv <= LEVELS; lv++) {
      const n = bank.grid[cat][lv - 1].length;
      if (!n) add('erreur', '-', cat, `Aucune question de niveau ${lv}`);
      else if (n < MIN_PAR_NIVEAU) add('attention', '-', cat, `Seulement ${n} question(s) de niveau ${lv} (${MIN_PAR_NIVEAU} conseillées)`);
    }
  }

  const statuts = {};
  for (const q of bank.questions) {
    const st = (q.verification && q.verification.statut) || '?';
    statuts[st] = (statuts[st] || 0) + 1;
  }
  const parTheme = Object.fromEntries(CATEGORIES.map((c) => [c.id, bank.questions.filter((q) => q.categorie === c.id).length]));
  return {
    issues,
    stats: { total: bank.questions.length, statuts, parTheme },
    errors: issues.filter((i) => i.level === 'erreur').length,
    warnings: issues.filter((i) => i.level === 'attention').length,
  };
}

export function formatReport(report) {
  const lines = [];
  const { stats } = report;
  lines.push(`Banque Culturisk : ${stats.total} questions`);
  lines.push(`  par thème : ${Object.entries(stats.parTheme).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
  lines.push(`  vérification : ${Object.entries(stats.statuts).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
  if (stats.statuts.a_verifier) lines.push(`  → ${stats.statuts.a_verifier} question(s) n'ont encore été relues par personne.`);
  if (!stats.statuts.verifiee) lines.push('  → Aucune question n’est marquée « verifiee » (vérification humaine à partir de la source).');
  lines.push('');
  for (const level of ['erreur', 'attention']) {
    const list = report.issues.filter((i) => i.level === level);
    if (!list.length) continue;
    lines.push(level === 'erreur' ? `ERREURS (${list.length})` : `POINTS D'ATTENTION (${list.length})`);
    for (const i of list) lines.push(`  [${i.cat}] ${i.qid} — ${i.message}`);
    lines.push('');
  }
  lines.push(report.errors ? `${report.errors} erreur(s), ${report.warnings} point(s) d'attention.` : `Aucune erreur, ${report.warnings} point(s) d'attention.`);
  return lines.join('\n');
}
