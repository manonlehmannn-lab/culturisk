// Lance les tests dans Node : node tests/run.mjs

import './validation.test.js';
import './game.test.js';
import { run } from './harness.js';

const { failures } = await run();
process.exit(failures.length ? 1 : 0);
