/**
 * game-harness.js  —  run with:  node tests/game-harness.js
 * ------------------------------------------------------------------
 * Plays Job #2417 end to end through the real game state machine, with a
 * fixed rng and clock, and asserts the outcome. If the cut math, rotation,
 * stacking or sorting drifts, the par run stops delivering 2,100 cards.
 * ------------------------------------------------------------------
 */
import { createGame } from '../src/core/game.js';
import { JOBS } from '../src/core/jobs.js';

let pass = 0, fail = 0;
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}  ${detail}`); }
};

function makeGame() {
  let t = 0;
  return createGame(JOBS.find((j) => j.id === '2417'), { rng: () => 0.5, now: () => (t += 1000) });
}
/** One full operator cycle: set gauge → jog → clamp → cut → release. */
function cycle(g, gauge, { jog = true } = {}) {
  g.setGauge(gauge);
  if (jog) g.jog();
  g.toggleClamp();
  const r = g.cut();
  g.afterCut();
  return r;
}

console.log('\nPar run — Job #2417 (business cards 21-up)');
{
  const g = makeGame();
  cycle(g, 16.75);                 // foot margin off
  g.rotate(2); cycle(g, 15.5);     // head margin off
  g.rotate(1); cycle(g, 11.5);     // one side margin off
  g.rotate(2); cycle(g, 11.0);     // other side margin off
  check('trimmed sheet is 15 1/2 × 11', Math.abs(g.state.table.W - 15.5) < 1e-6 && Math.abs(g.state.table.D - 11) < 1e-6,
    JSON.stringify([g.state.table.W, g.state.table.D]));

  cycle(g, 7.5);    // column strip → tray
  cycle(g, 7.25);   // gutter drops
  cycle(g, 3.75);   // column strip → tray
  cycle(g, 3.5);    // gutter drops; column 1 stays on table
  check('three column strips (1 on table, 2 in tray)', g.state.tray.length === 2 && g.state.table.layers.length === 1);
  check('no cards ruined after columns', g.state.ruined.size === 0);

  check('strip 1 can join the lift', g.compat(0).ok);
  g.addToLift(0); g.addToLift(0);
  check('lift is 3 high = 3.3"', g.state.table.layers.length === 3);

  g.rotate(1);
  for (const gauge of [13.5, 13.25, 11.25, 11.0, 9.0, 8.75, 6.75, 6.5, 4.5, 4.25, 2.25, 2.0]) cycle(g, gauge);

  const sum = g.summary();
  check('job finishes', g.state.done);
  check('2,100 good cards', sum.good === 2100, String(sum.good));
  check('0 ruined', sum.ruined === 0, String(sum.ruined));
  check('20 cuts (par 22)', sum.cuts === 20, String(sum.cuts));
  check('dead-on accuracy', sum.avgErr < 1e-6, String(sum.avgErr));
  check('grade S', sum.grade === 'S', sum.grade);
}

console.log('\nRules');
{
  const g = makeGame();
  check('cannot cut without clamp', g.beginCut() === false && g.state.event.kind === 'warn');
  g.toggleClamp();
  check('cannot move gauge while clamped', g.setGauge(10) === false);
  check('cannot jog while clamped', g.jog() === false);
  g.toggleClamp();
  check('gauge clamps to travel', (g.setGauge(40), g.state.gauge === 19.5));
  const air = cycle(g, 19.5);
  check('air cut when gauge is behind the lift', air.air === true && g.state.table.D === 18);
}
{
  const g = makeGame();
  const r = cycle(g, 16.75, { jog: false });
  check('unjogged cut wanders', r.err !== 0 && g.state.event.kind === 'warn');
}
{
  const g = makeGame();
  cycle(g, 16.0);                  // cuts through the bottom row of cards
  check('cutting through a row ruins 3 cards', g.state.ruined.size === 3, String(g.state.ruined.size));
}
{
  const g = makeGame();
  cycle(g, 16.75); g.rotate(2); cycle(g, 15.5); g.rotate(1); cycle(g, 11.5); g.rotate(2); cycle(g, 11.0);
  cycle(g, 7.5); cycle(g, 7.25); cycle(g, 3.75); cycle(g, 3.5);
  g.addToLift(0); g.addToLift(0);
  g.state.tray.push({ ...g.state.table, layers: [g.state.table.layers[0]] }); // a 4th same-size strip
  check('a 4th strip stacks on (400 sheets)', g.addToLift(0) === true && g.state.table.layers.length === 4);
  g.rotate(1); g.setGauge(13.5); g.jog(); g.toggleClamp();
  const r = g.cut(); g.afterCut();
  check('…and each cut then takes 2 passes (max 318 sheets of .011")', r.passes === 2, String(r.passes));
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
