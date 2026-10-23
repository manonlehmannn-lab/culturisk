// Vérification de la banque de questions : node tools/verifier.mjs
// Code de sortie 1 en cas d'erreur (utilisé par l'intégration continue).

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CATEGORY_IDS } from '../js/engine/categories.js';
import { verifyBank, formatReport } from './verify.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = CATEGORY_IDS.map((cat) => join(root, 'data', 'questions', `${cat}.json`))
  .filter((p) => existsSync(p))
  .map((p) => JSON.parse(readFileSync(p, 'utf8')));

const report = verifyBank(files);
console.log(formatReport(report));
process.exit(report.errors ? 1 : 0);
