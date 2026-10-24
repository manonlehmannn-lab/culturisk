// Banque de questions : indexation et contexte de validation (construit une seule fois).

import { CATEGORY_IDS, LEVELS } from './categories.js';
import { buildContext } from './validation.js';
import { LEXIQUE, PERSONNES } from './lexique.js';

// `files` : contenu des fichiers data/questions/<categorie>.json.
export function indexBank(files) {
  const questions = files.flatMap((f) => f.questions || []);
  const byId = new Map(questions.map((q) => [q.id, q]));
  const grid = {};
  for (const cat of CATEGORY_IDS) {
    grid[cat] = Array.from({ length: LEVELS }, () => []);
  }
  for (const q of questions) {
    if (grid[q.categorie] && q.niveau >= 1 && q.niveau <= LEVELS) grid[q.categorie][q.niveau - 1].push(q.id);
  }
  const ctx = buildContext(questions, LEXIQUE, PERSONNES);
  return { questions, byId, grid, ctx };
}

// Chargement dans le navigateur (les fichiers sont mis en cache par le service worker).
export async function loadBank(base = new URL('../../data/questions/', import.meta.url)) {
  const files = await Promise.all(
    CATEGORY_IDS.map((cat) =>
      // Un thème dont le fichier manque devient simplement indisponible (le vérificateur le signale).
      fetch(new URL(`${cat}.json`, base))
        .then((r) => (r.ok ? r.json() : { categorie: cat, questions: [] }))
        .catch(() => ({ categorie: cat, questions: [] })),
    ),
  );
  return indexBank(files);
}
