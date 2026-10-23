// Lecture des nombres saisis : « 1815 », « 3 422 », « 3,5 », « mille huit cent quinze ».

import { fold } from './text.js';

const UNITES = {
  zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9,
  dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16,
  vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60, septante: 70, huitante: 80, octante: 80, nonante: 90,
};
const MULTIPLICATEURS = { cent: 100, cents: 100, mille: 1000, milles: 1000, million: 1e6, millions: 1e6, milliard: 1e9, milliards: 1e9 };

// Convertit une suite de mots en nombre ; null si un mot n'est pas numérique.
export function parseWords(text) {
  const toks = fold(text).split(' ').filter((t) => t && t !== 'et');
  if (!toks.length) return null;
  let total = 0;
  let current = 0;
  let seen = false;
  for (const t of toks) {
    if (t in UNITES) {
      const v = UNITES[t];
      // « quatre vingt » : 4 × 20.
      if (v === 20 && current > 0 && current < 20 && current % 10 !== 0) current *= 20;
      else current += v;
      seen = true;
    } else if (t in MULTIPLICATEURS) {
      const m = MULTIPLICATEURS[t];
      if (m === 100) current = (current || 1) * 100;
      else {
        total += (current || 1) * m;
        current = 0;
      }
      seen = true;
    } else {
      return null;
    }
  }
  return seen ? total + current : null;
}

// Tous les nombres écrits en chiffres dans la saisie.
export function parseDigits(text) {
  let t = String(text || '').replace(/[  ]/g, ' ');
  // Séparateurs de milliers : « 3 422 », « 3.422 », « 1,000,000 ».
  t = t.replace(/(\d)[ .,](?=\d{3}(?!\d))/g, '$1');
  t = t.replace(/(\d),(\d)/g, '$1.$2');
  return (t.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
}

// Nombre(s) lisible(s) dans la saisie, chiffres d'abord, puis lettres.
export function readNumbers(text) {
  const digits = parseDigits(text);
  if (digits.length) return digits;
  const w = parseWords(text);
  return w == null ? [] : [w];
}
