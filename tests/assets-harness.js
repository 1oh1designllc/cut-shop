/**
 * assets-harness.js  —  run with:  node tests/assets-harness.js
 * The asset pipeline: slot registry is complete, filenames map to the right
 * slots, and the manifest the game loads is built correctly.
 */
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { SOUND_SLOTS, ART_SLOTS, jobArtSlot } from '../src/assets/registry.js';
import { JOBS } from '../src/core/jobs.js';
import { TEMPLATES } from '../src/core/jobgen.js';

let pass = 0, fail = 0;
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}  ${detail}`); }
};

console.log('\nRegistry');
check('every art slot has a group, description and size', Object.values(ART_SLOTS).every((a) => a.group && a.desc && a.size));
check('every job (built-in) has an artwork slot', JOBS.every((j) => ART_SLOTS[jobArtSlot(j)]), JOBS.filter((j) => !ART_SLOTS[jobArtSlot(j)]).map((j) => j.id).join());
check('every job template has an artwork slot', Object.keys(TEMPLATES).every((k) => ART_SLOTS[`job.${k}`]));
check('12 sound slots', Object.keys(SOUND_SLOTS).length === 12);

console.log('\nImport + manifest');
{
  const root = mkdtempSync(join(tmpdir(), 'cutshop-'));
  const inbox = join(root, 'inbox');
  mkdirSync(inbox, { recursive: true });
  mkdirSync(join(root, 'public', 'assets', 'sounds'), { recursive: true });
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>';
  writeFileSync(join(inbox, 'Job Business Cards.svg'), svg);
  writeFileSync(join(inbox, 'front-blade.svg'), svg);
  writeFileSync(join(inbox, 'bc_bolt-slotted.svg'), svg);
  writeFileSync(join(inbox, 'my notes.svg'), svg);
  for (const f of ['cut-thick-2.mp3', 'cut-thick-1.mp3', 'cut-thick-10.mp3', 'clamp-down-1.mp3', 'mystery-1.mp3']) {
    writeFileSync(join(root, 'public', 'assets', 'sounds', f), 'x');
  }
  const r = spawnSync('node', ['tools/prepare-assets.mjs', '--root', root, '--import', inbox], { encoding: 'utf8' });
  check('tool runs', r.status === 0, r.stderr);
  const man = JSON.parse(readFileSync(join(root, 'public', 'assets', 'manifest.json'), 'utf8'));
  const art = readdirSync(join(root, 'public', 'assets', 'art'));
  check('"Job Business Cards.svg" → job.business-cards', man.art['job.business-cards'] === 'job.business-cards.svg');
  check('"front-blade.svg" → front.blade', man.art['front.blade'] === 'front.blade.svg');
  check('"bc_bolt-slotted.svg" → bc.bolt-slotted', man.art['bc.bolt-slotted'] === 'bc.bolt-slotted.svg');
  check('unmatched file skipped', !art.some((f) => /notes/.test(f)) && /Skipped.*my notes\.svg/.test(r.stdout));
  check('takes sorted naturally (1, 2, 10)', JSON.stringify(man.sounds['cut-thick']) === JSON.stringify(['cut-thick-1.mp3', 'cut-thick-2.mp3', 'cut-thick-10.mp3']), JSON.stringify(man.sounds['cut-thick']));
  check('unknown sound ignored', !man.sounds.mystery && man.sounds['clamp-down'].length === 1);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
