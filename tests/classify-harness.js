/**
 * classify-harness.js  —  run with:  node tests/classify-harness.js
 * Fixture rectangles against Job #2417's layout: good / wip / scrap / ruined.
 */
import { classify } from '../src/core/classify.js';
import { buildLayout } from '../src/core/layout.js';
import { JOBS } from '../src/core/jobs.js';

const job = JOBS.find((j) => j.id === '2417');
const L = buildLayout(job);
const TOL = job.tolerance;
let pass = 0, fail = 0;
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}  ${detail}`); }
};
const R = (x0, y0, x1, y1) => ({ x0, y0, x1, y1 });

console.log('\nLayout');
check('21 cards', L.cards.length === 21);
check('side margins 1/2"', Math.abs(L.mx - 0.5) < 1e-9);
check('head/foot margins 1 1/4"', Math.abs(L.my - 1.25) < 1e-9);
check('card 0 trim at (0.5, 1.25)', L.cards[0].x0 === 0.5 && L.cards[0].y0 === 1.25);

console.log('\nClassify');
const fixtures = [
  ['exact card → good', R(0.5, 1.25, 4.0, 3.25), 'good', 0],
  ['card 1/64 oversize → good', R(0.5 - 1 / 64, 1.25, 4.0, 3.25), 'good', 0],
  ['card 1/16 oversize → wip (trim again)', R(0.5 - 1 / 16, 1.25, 4.0, 3.25), 'wip', 0],
  ['card 1/16 undersize → scrap + 1 ruined', R(0.5 + 1 / 16, 1.25, 4.0, 3.25), 'scrap', 1],
  ['foot trim strip → scrap', R(0, 16.75, 12, 18), 'scrap', 0],
  ['gutter strip → scrap', R(4.0, 1.25, 4.25, 16.75), 'scrap', 0],
  ['whole sheet → wip', R(0, 0, 12, 18), 'wip', 0],
  ['cut through bottom row → wip + 3 ruined', R(0, 0, 12, 16.0), 'wip', 3],
];
for (const [name, rect, type, ruinedN] of fixtures) {
  const ruined = new Set();
  const c = classify(rect, L.cards, ruined, TOL);
  check(name, c.type === type && ruined.size === ruinedN, `got ${c.type}, ruined ${ruined.size}`);
}
{
  const ruined = new Set([20]);
  const c = classify(R(0, 0, 12, 16.0), L.cards, ruined, TOL);
  check('already-ruined cards are not counted twice', c.ruinedNew === 2, String(c.ruinedNew));
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
