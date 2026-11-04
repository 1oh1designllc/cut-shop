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
import { randomJob } from '../src/core/jobgen.js';
import { STOCKS, spoilFraction } from '../src/core/stocks.js';

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
    g.setGauge(h.gauge); g.jog(); if (!g.state.jogged) g.jog(); g.toggleClamp(); g.cut(); g.afterCut();
  }
  return true;
}

function autoplay(g, limit = 400) {
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
  check(`order of ${g.order.toLocaleString()} delivered (${sum.delivered.toLocaleString()}, ${sum.spoiledSheets} sheets spoiled)`, sum.delivered >= g.order, String(sum.delivered));
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
  check('still delivers every card', g.summary().delivered === g.total);
}
{
  const job = JOBS.find((j) => j.id === '2417');
  const g = makeGame(job);
  g.setGauge(16.0); g.jog(); g.toggleClamp(); g.cut(); g.afterCut(); // ruins the bottom row
  autoplay(g);
  check('after a ruined row, finishes with the rest', g.state.done && g.summary().delivered === g.total - 3 * job.sheets, String(g.summary().delivered));
}

console.log('\nRandom jobs (40 seeded)');
{
  // mulberry32: small seeded RNG so the run is repeatable
  const seeded = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let ok = 0, short = [];
  const rng = seeded(2417);
  for (let i = 0; i < 40; i++) {
    const job = randomJob(rng);
    const g = makeGame(job);
    autoplay(g);
    const sum = g.summary();
    if (g.state.done && sum.ruined === 0 && sum.delivered >= g.order && sum.cuts <= job.par.cuts) ok++;
    else short.push(`${job.label} ${job.stock} delivered ${sum.delivered}/${g.order}`);
  }
  check('every random job finishes, nothing ruined, order met, within par', ok === 40, short.join(' | '));
}

console.log('\nLift trade-off');
{
  const job = JOBS.find((j) => j.id === '3101'); // 4×6 on 14pt C2S
  const runAt = (lift) => { const g = makeGame(job); g.setLift(lift); autoplay(g); return g.summary(); };
  const low = runAt(20), mid = runAt(100), high = runAt(250);
  check('20-sheet lifts: no clamp marks', low.spoiledSheets === 0, String(low.spoiledSheets));
  check('taller lifts mark more sheets', low.spoiledSheets < mid.spoiledSheets && mid.spoiledSheets < high.spoiledSheets,
    `${low.spoiledSheets} / ${mid.spoiledSheets} / ${high.spoiledSheets}`);
  check('taller lifts take fewer machine cycles', low.cuts > mid.cuts && mid.cuts > high.cuts, `${low.cuts} / ${mid.cuts} / ${high.cuts}`);
  check('max lift on 14pt spoils more than the overs cover', high.delivered < job.order, `${high.delivered} < ${job.order}`);
  check('gloss text spoils 3×+ more than opaque on a tall lift (slipping)',
    spoilFraction(STOCKS['gloss-text-100'], 700) > 3 * spoilFraction(STOCKS['opaque-60'], 700));
}
{
  const job = JOBS.find((j) => j.id === '3105'); // gloss text: curls
  const g = makeGame(job);
  g.jog();
  check('curled stock: first Jog press decurls, not jogs', !g.state.curled && !g.state.jogged);
  g.jog();
  check('second press jogs', g.state.jogged);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
