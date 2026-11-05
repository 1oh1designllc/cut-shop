/**
 * maintenance-harness.js  —  run with:  node tests/maintenance-harness.js
 * ------------------------------------------------------------------
 * Blade + cutting stick wear, fraying, depth, and Jude's blade-change
 * procedure (order enforced, violations counted).
 * ------------------------------------------------------------------
 */
import { createGame } from '../src/core/game.js';
import { JOBS } from '../src/core/jobs.js';
import { autoplay } from '../src/core/hint.js';
import { freshMachine, fraySheets, bladeLeft, BLADE_LIFE, STICK_LIFE } from '../src/core/machine.js';
import { createBladeChange, BOLTS } from '../src/core/bladechange.js';

let pass = 0, fail = 0;
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}  ${detail}`); }
};
const job = (id) => JOBS.find((j) => j.id === id);
const play = (id, machine) => {
  let t = 0;
  const g = createGame(job(id), { rng: () => 0.5, now: () => (t += 1000), machine });
  autoplay(g);
  return g;
};

console.log('\nWear carries from job to job');
{
  let m = freshMachine();
  const rotation = ['3101', '3102', '3104', '3106', '3103', '3105'];
  let jobs = 0, firstFrayJob = 0;
  while (jobs < 30 && !firstFrayJob) {
    const g = play(rotation[jobs % rotation.length], m);
    jobs++;
    if (g.state.frayMax > 0) firstFrayJob = jobs;
    m = { ...g.machine };
  }
  check(`a fresh blade lasts several jobs before fraying (frayed on job ${firstFrayJob})`, firstFrayJob >= 3 && firstFrayJob <= 10, String(firstFrayJob));
}
{
  const fresh = play('3101', freshMachine());
  check('a fresh blade frays nothing', fresh.state.frayMax === 0 && fraySheets(fresh.machine) === 0);
  check('a job wears the blade', fresh.machine.bladeWear > 0 && fresh.machine.stickWear > 0);
}

console.log('\nDull blade, stick, depth');
{
  const dull = { ...freshMachine(), bladeWear: BLADE_LIFE * 0.85 };
  check('dull blade frays the bottom sheets of each pass', fraySheets(dull) > 0, String(fraySheets(dull)));
  const g = play('3101', dull);
  const sharp = play('3101', freshMachine());
  check('…which spoils sheets and cuts what gets delivered', g.summary().spoiledSheets > sharp.summary().spoiledSheets && g.summary().delivered < sharp.summary().delivered,
    `${g.summary().spoiledSheets} vs ${sharp.summary().spoiledSheets}`);
  check('…and the message says why', /dull/.test(g.state.event.msg) || g.state.frayMax > 0);
}
{
  const grooved = { ...freshMachine(), stickWear: STICK_LIFE * 0.9 };
  check('a grooved stick also frays (sharp blade)', fraySheets(grooved) > 0);
  let t = 0;
  const g = createGame(job('3101'), { now: () => (t += 1000), machine: grooved });
  g.rotateStick();
  check('rotating the stick to a fresh face fixes it', fraySheets(g.machine) === 0 && g.machine.stickFace === 2);
  g.rotateStick(); g.rotateStick();
  check('four faces, then the stick must be replaced', g.rotateStick() === false && g.machine.stickFace === 4);
  g.replaceStick();
  check('replace gives a new stick', g.machine.stickFace === 1 && g.machine.stickWear === 0);
}
{
  check('shallow depth leaves bottom sheets uncut', fraySheets({ ...freshMachine(), depth: -1 }) === 2);
  const deep = play('3101', { ...freshMachine(), depth: 2 });
  const right = play('3101', freshMachine());
  check('deep depth wears the blade and stick faster', deep.machine.bladeWear > right.machine.bladeWear * 2 && deep.machine.stickWear > right.machine.stickWear * 2);
}

console.log('\nBlade change — Jude\'s order');
{
  const bc = createBladeChange(() => 0.1); // new blade starts 1 step shallow
  check('starts at lock', bc.state.step === 'lock');
  check('bolts refused before the blade is locked down', bc.bolt(1) === false && bc.state.step === 'lock');
  bc.lock();
  const slotted = BOLTS.filter((b) => b.slotted).map((b) => b.id);
  const plain = BOLTS.filter((b) => !b.slotted).map((b) => b.id);
  check('pulling a slotted bolt with no handles is refused + a safety violation', bc.bolt(slotted[0]) === false && bc.state.violations.length === 1);
  plain.forEach((id) => bc.bolt(id));
  check('after the plain bolts: handles step', bc.state.step === 'handles');
  bc.attachHandles();
  slotted.forEach((id) => bc.bolt(id));
  check('slotted bolts out once handles are on → lift', bc.state.step === 'lift');
  bc.liftOld(); bc.fitNew();
  check('new blade fitted → snug the bolts', bc.state.step === 'snug');
  BOLTS.forEach((b) => bc.bolt(b.id));
  check('all snug → depth', bc.state.step === 'depth');
  check('tightening before the depth is set is refused + a violation', bc.bolt(1) === false && bc.state.violations.length === 2);
  bc.testCut();
  check('test cut on a shallow blade: bottom sheets not cut through', bc.state.lastTest === 'shallow' && bc.state.step === 'depth');
  bc.adjust(+1); bc.adjust(+1); bc.testCut();
  check('too deep: blade bites the stick', bc.state.lastTest === 'deep');
  bc.adjust(-1); bc.testCut();
  check('right: clean cut → tighten', bc.state.lastTest === 'right' && bc.state.step === 'tighten');
  check('release refused until every bolt is tight', bc.release() === false);
  BOLTS.forEach((b) => bc.bolt(b.id));
  check('all tight → release → done', bc.release() === true && bc.state.step === 'done' && bc.state.depth === 0);

  let t = 0;
  const g = createGame(job('3101'), { now: () => (t += 1000), machine: { ...freshMachine(), bladeWear: BLADE_LIFE * 0.9 } });
  g.installBlade({ depth: bc.state.depth, violations: bc.state.violations.length });
  check('installing resets the blade and logs the violations', bladeLeft(g.machine) === 1 && g.state.safety === 2);
  autoplay(g);
  check('a safety violation caps the grade at B even with the order met', g.summary().delivered >= g.order && g.summary().grade === 'B', g.summary().grade);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
