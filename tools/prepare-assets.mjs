#!/usr/bin/env node
/**
 * prepare-assets.mjs — bring Jude's sounds and art into the game.
 * ------------------------------------------------------------------
 *   node tools/prepare-assets.mjs                 rebuild public/assets/manifest.json
 *   node tools/prepare-assets.mjs --import DIR    import files from DIR, then rebuild
 *   (--root DIR overrides the project root; used by the harness)
 *
 * Import matches each file to a slot by its name (see src/assets/registry.js):
 *   cut-thick-1.m4a, "Cut Thick 2.mov", clamp_down.wav → sounds/cut-thick-1.mp3 …
 *   job-business-cards.svg, front.blade.png           → art/job.business-cards.svg …
 * Audio (and the sound track of videos) is converted with ffmpeg: mono MP3, silence
 * trimmed from both ends (not for the idle loop), loudness evened out.
 * Files that don't match a slot are listed and skipped.
 * ------------------------------------------------------------------
 */
import { readdirSync, mkdirSync, copyFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, basename, resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SOUND_SLOTS, ART_SLOTS } from '../src/assets/registry.js';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const ROOT = resolve(opt('--root') || join(dirname(fileURLToPath(import.meta.url)), '..'));
const OUT = join(ROOT, 'public', 'assets');
const SOUNDS = join(OUT, 'sounds'), ART = join(OUT, 'art');
mkdirSync(SOUNDS, { recursive: true }); mkdirSync(ART, { recursive: true });

const AUDIO_IN = ['.m4a', '.mp3', '.wav', '.aif', '.aiff', '.caf', '.ogg', '.mov', '.mp4', '.m4v'];
const ART_IN = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];
const AUDIO_OUT = ['.mp3', '.m4a', '.ogg', '.wav'];

/** "Cut Thick 2" → { slot: 'cut-thick', take: 2 }; "job-business-cards" → art slot 'job.business-cards'. */
export function matchName(file) {
  const stem = basename(file, extname(file)).trim().toLowerCase().replace(/[\s_]+/g, '-');
  const m = stem.match(/^(.*?)(?:-(\d+))?$/);
  const base = m[1], take = m[2] ? +m[2] : null;
  const dotted = (s) => s.replace(/^(job|front|bc|ui)[-.]/, '$1.');
  if (SOUND_SLOTS[base]) return { kind: 'sound', slot: base, take };
  if (ART_SLOTS[dotted(stem)]) return { kind: 'art', slot: dotted(stem) };
  if (ART_SLOTS[dotted(base)]) return { kind: 'art', slot: dotted(base) };
  return null;
}

function nextTake(slot) {
  const used = readdirSync(SOUNDS).map((f) => f.match(new RegExp(`^${slot}-(\\d+)\\.`))).filter(Boolean).map((m) => +m[1]);
  return used.length ? Math.max(...used) + 1 : 1;
}

function importDir(dir) {
  const ff = spawnSync('ffmpeg', ['-version']).status === 0;
  const skipped = [];
  for (const f of readdirSync(dir)) {
    const src = join(dir, f), ext = extname(f).toLowerCase();
    if (!statSync(src).isFile()) continue;
    const m = matchName(f);
    if (!m) { skipped.push(f); continue; }
    if (m.kind === 'art' && ART_IN.includes(ext)) {
      for (const e of ART_IN) { const old = join(ART, m.slot + e); if (existsSync(old) && e !== ext) console.log(`  replacing ${m.slot}${e}`); }
      copyFileSync(src, join(ART, m.slot + (ext === '.jpeg' ? '.jpg' : ext)));
      console.log(`  art    ${f} → art/${m.slot}${ext}`);
    } else if (m.kind === 'sound' && AUDIO_IN.includes(ext)) {
      const take = m.take ?? nextTake(m.slot);
      const out = join(SOUNDS, `${m.slot}-${take}.mp3`);
      if (!ff) { console.log(`  ✗ ${f}: ffmpeg not installed, can't convert audio`); continue; }
      const trim = m.slot === 'idle' ? [] : ['silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05', 'areverse',
        'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15', 'areverse'];
      const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-vn', '-ac', '1', '-ar', '44100',
        '-af', [...trim, 'loudnorm=I=-16:TP=-1.5'].join(','), '-b:a', '128k', out]);
      if (r.status === 0) console.log(`  sound  ${f} → sounds/${m.slot}-${take}.mp3`);
      else console.log(`  ✗ ${f}: ${String(r.stderr).trim().split('\n').pop()}`);
    } else skipped.push(f);
  }
  if (skipped.length) console.log(`\n  Skipped (name doesn't match a slot): ${skipped.join(', ')}`);
}

export function buildManifest() {
  const sounds = {}, art = {};
  for (const f of readdirSync(SOUNDS).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
    if (!AUDIO_OUT.includes(extname(f).toLowerCase())) continue;
    const m = matchName(f);
    if (m?.kind === 'sound') (sounds[m.slot] ||= []).push(f);
  }
  for (const f of readdirSync(ART).sort()) {
    if (!ART_IN.includes(extname(f).toLowerCase())) continue;
    const m = matchName(f);
    if (m?.kind === 'art') art[m.slot] = f; // SVG wins over PNG (sorted after) only if named the same
  }
  writeFileSync(join(OUT, 'manifest.json'), JSON.stringify({ art, sounds }, null, 2) + '\n');
  return { art, sounds };
}

const importFrom = opt('--import');
if (importFrom) { console.log(`Importing from ${importFrom}`); importDir(resolve(importFrom)); }
const man = buildManifest();
const filledArt = Object.keys(man.art).length, filledSound = Object.keys(man.sounds).length;
console.log(`\nManifest: ${filledArt}/${Object.keys(ART_SLOTS).length} art slots, ${filledSound}/${Object.keys(SOUND_SLOTS).length} sound slots filled.`);
const missing = [...Object.keys(SOUND_SLOTS).filter((s) => !man.sounds[s]), ...Object.keys(ART_SLOTS).filter((s) => !man.art[s])];
if (missing.length && args.includes('--missing')) console.log(`Still placeholder: ${missing.join(', ')}`);
