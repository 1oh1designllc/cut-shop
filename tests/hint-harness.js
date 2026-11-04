/**
 * hint-harness.js  —  run with:  node tests/hint-harness.js
 * ------------------------------------------------------------------
 * Lets the hint engine play every job from start to finish by itself.
 * If the hint ever suggests a move that ruins a piece, gets stuck, or
 * needs more cuts than par, this fails. Also checks the hint can recover
 * from a sloppy cut.
 * ------------------------------------------------------------------
 */
import { createGame } from '../src/core/game.js';
import { JOBS } from '../src/core/jobs.js';
import { nextHint } from '../src/core/hint.js';

let pass = 0, fail = 0;
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}  ${detail}`); }
};

function makeGame(job) {
  let t = 0;
  return createGame(job, { rng: () => 0.5, now: () => (t += 1000) });
}

/** Apply one hint. Returns false if there was nothing to do. */
function follow(g) {
  const h = nextHint(g);
  if (!h) return false;
  if (h.action === 'load') g.loadPiece(h.index);
  else if (h.action === 'add') g.addToLift(h.index);
  else {
    if (h.rotate) g.rotate(h.rotate);
    g.setGauge(h.gauge); g.jog(); g.toggleClamp(); g.cut(); g.afterCut();
  }
  return true;
}

function autoplay(g, limit = 200) {
  let steps = 0;
  while (!g.state.done && steps < limit && follow(g)) steps++;
  return steps;
}

for (const job of JOBS) {
  console.log(`\nAutoplay — ${job.label}`);
  const g = makeGame(job);
  const first = nextHint(g);
  check('first hint is a cut that drops waste', first.action === 'cut' && first.front === 'scrap', JSON.stringify(first));
  autoplay(g);
  const sum = g.summary();
  check('job finishes', g.state.done);
  check(`all ${g.total.toLocaleString()} delivered`, sum.good === g.total, String(sum.good));
  check('nothing ruined', sum.ruined === 0, String(sum.ruined));
  check(`cuts within par (${sum.cuts} ≤ ${job.par.cuts})`, sum.cuts <= job.par.cuts, String(sum.cuts));
}

console.log('\nRecovery');
{
  const job = JOBS.find((j) => j.id === '2417');
  const g = makeGame(job);
  // Sloppy first cut: leaves 1/16" extra bleed below the bottom row.
  g.setGauge(16.8125); g.jog(); g.toggleClamp(); g.cut(); g.afterCut();
  const h = nextHint(g);
  check('hint trims the leftover sliver', h.action === 'cut' && h.rotate === 0 && Math.abs(h.gauge - 16.75) < 1e-6, JSON.stringify(h));
  autoplay(g);
  check('still delivers every card', g.summary().good === g.total);
}
{
  const job = JOBS.find((j) => j.id === '2417');
  const g = makeGame(job);
  g.setGauge(16.0); g.jog(); g.toggleClamp(); g.cut(); g.afterCut(); // ruins the bottom row
  autoplay(g);
  check('after a ruined row, finishes with the rest', g.state.done && g.summary().good === g.total - 3 * job.sheets, String(g.summary().good));
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
