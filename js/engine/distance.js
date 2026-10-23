// Distance de Damerau-Levenshtein (variante « alignement optimal de chaînes ») :
// insertions, suppressions, substitutions et inversions de deux lettres voisines.

export function damerau(a, b, max = Infinity) {
  if (a === b) return 0;
  const n = a.length;
  const m = b.length;
  if (Math.abs(n - m) > max) return max + 1;
  if (!n) return m;
  if (!m) return n;
  let prev2 = new Array(m + 1).fill(0);
  let prev = new Array(m + 1);
  let cur = new Array(m + 1);
  for (let j = 0; j <= m; j++) prev[j] = j;
  for (let i = 1; i <= n; i++) {
    cur[0] = i;
    let rowMin = cur[0];
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    [prev2, prev, cur] = [prev, cur, prev2];
  }
  return prev[m];
}

// Nombre de fautes tolérées selon la longueur de la réponse (lettres, sans espaces).
// Volontairement prudent : aucune faute sur les mots très courts.
export function tolerance(len) {
  if (len <= 3) return 0;
  if (len <= 6) return 1;
  if (len <= 11) return 2;
  return 3;
}
