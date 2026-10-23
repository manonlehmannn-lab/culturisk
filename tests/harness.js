// Mini-harnais de tests sans dépendance, utilisable dans Node comme dans un navigateur.

const suites = [];

export function test(name, fn) {
  suites.push({ name, fn });
}

export function eq(actual, expected, label = '') {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${label ? label + ' : ' : ''}obtenu ${a}, attendu ${e}`);
}

export function ok(cond, label = 'condition fausse') {
  if (!cond) throw new Error(label);
}

export function throws(fn, label = 'une erreur était attendue') {
  try {
    fn();
  } catch (e) {
    return;
  }
  throw new Error(label);
}

export async function run(log = console.log) {
  let passed = 0;
  const failures = [];
  for (const s of suites) {
    try {
      await s.fn();
      passed += 1;
    } catch (e) {
      failures.push({ name: s.name, message: e.message });
      log(`✗ ${s.name}\n    ${e.message}`);
    }
  }
  log(`\n${passed} réussi(s), ${failures.length} échec(s) sur ${suites.length} tests.`);
  return { passed, failures, total: suites.length };
}
