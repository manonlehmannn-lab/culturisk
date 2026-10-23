// Normalisation des réponses : casse, accents, ponctuation, espaces, articles,
// ordinaux et chiffres romains. Les deux côtés (saisie et réponse attendue)
// passent par les mêmes fonctions, ce qui rend les comparaisons cohérentes.

const LIGATURES = { 'œ': 'oe', 'æ': 'ae', 'ß': 'ss', 'ø': 'o', 'đ': 'd', 'ł': 'l' };

// Articles et petits mots retirés en tête de réponse (« la Seine », « l'Australie », « the Beatles »).
const ARTICLES = new Set(['le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'd', 'the', 'a', 'au', 'aux', 'en']);

// Formules d'introduction que les joueurs ajoutent spontanément.
const FILLERS = [
  'c est', 'c etait', 'ce sont', 'ce serait', 'il s agit de', 'il s agit d', 'il s agit du', 'il s agit des',
  'je dirais', 'je pense', 'je crois', 'reponse', 'ma reponse', 'peut etre', 'euh',
];

const ORDINAUX = {
  premier: '1', premiere: '1', '1er': '1', '1re': '1', '1ere': '1', ier: '1', ire: '1',
  second: '2', seconde: '2', deuxieme: '2', '2e': '2', '2eme': '2', '2nd': '2', '2nde': '2',
  troisieme: '3', '3e': '3', '3eme': '3',
  quatrieme: '4', '4e': '4', '4eme': '4',
  cinquieme: '5', '5e': '5', '5eme': '5',
};

const ROMAINS = { i: 1, v: 5, x: 10 };
const MOTS_PAS_ROMAINS = new Set(['vie', 'xi']);

// « XIXe », « IV », « VIIIe » → nombre ; renvoie null si le jeton n'est pas un chiffre romain plausible.
function romanToken(tok) {
  if (MOTS_PAS_ROMAINS.has(tok)) return null;
  const m = /^([ivx]+)(e|er|eme|ere)?$/.exec(tok);
  if (!m) return null;
  const r = m[1];
  if (!/^x{0,3}(ix|iv|v?i{0,3})$/.test(r)) return null;
  let total = 0;
  for (let i = 0; i < r.length; i++) {
    const v = ROMAINS[r[i]];
    const next = ROMAINS[r[i + 1]] || 0;
    total += v < next ? -v : v;
  }
  return total > 0 && total <= 39 ? String(total) : null;
}

// « 19e », « 19eme », « 21ème » → « 19 ».
function ordinalToken(tok) {
  if (ORDINAUX[tok]) return ORDINAUX[tok];
  const m = /^(\d+)(e|er|re|eme|ere|nd|nde)$/.exec(tok);
  return m ? m[1] : null;
}

// Minuscules, sans accents, ponctuation et tirets remplacés par des espaces.
export function fold(s) {
  let t = String(s == null ? '' : s).toLowerCase();
  t = t.replace(/[œæßøđł]/g, (c) => LIGATURES[c]);
  t = t.normalize('NFKD').replace(/[̀-ͯ]/g, '');
  t = t.replace(/&/g, ' et ');
  t = t.replace(/[^a-z0-9]+/g, ' ').trim();
  return t;
}

// Forme canonique complète d'une réponse.
export function normalize(s) {
  const toks = fold(s).split(' ').filter(Boolean);
  return toks
    .map((tok, i) => {
      const ord = ordinalToken(tok);
      if (ord) return ord;
      // Un chiffre romain nu en tête (« V pour Vendetta ») reste un mot ; après un nom (« Louis XIV »)
      // ou avec un suffixe ordinal (« XIXe siècle »), c'est un nombre.
      const rom = i > 0 || /[ivx](e|er|eme|ere)$/.test(tok) ? romanToken(tok) : null;
      return rom || tok;
    })
    .join(' ');
}

// Retire les formules d'introduction et les articles de tête (sans jamais tout effacer).
export function strip(norm) {
  let t = norm;
  let changed = true;
  while (changed) {
    changed = false;
    for (const f of FILLERS) {
      if (t.startsWith(f + ' ') && t.length > f.length + 1) {
        t = t.slice(f.length + 1);
        changed = true;
      }
    }
    const toks = t.split(' ');
    if (toks.length > 1 && ARTICLES.has(toks[0])) {
      t = toks.slice(1).join(' ');
      changed = true;
    }
  }
  return t;
}

// Clé sans espaces : « Saint Exupéry » et « Saint-Exupery » et « saintexupery » se rejoignent.
export const compact = (s) => s.replace(/ /g, '');

// Nombre de mots d'un texte (pour contrôler la longueur des explications).
export function wordCount(s) {
  return String(s || '')
    .replace(/[’']/g, ' ')
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}
