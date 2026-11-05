/**
 * bests.js — best score per job, kept in this browser (localStorage).
 * Storage can be unavailable (private mode, blocked site data), so every
 * access is guarded and the game works without it.
 */
const KEY = 'cutshop.bests.v1';
const LAST_JOB = 'cutshop.lastJob';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; }
}

export function loadBests() { return read(); }

/** Better = more good pieces, then fewer cuts, then faster. */
export function isBetter(a, b) {
  if (!b) return true;
  if (a.good !== b.good) return a.good > b.good;
  if (a.cuts !== b.cuts) return a.cuts < b.cuts;
  return a.ms < b.ms;
}

/** Save if it beats the stored best. Returns { isNew, best }. */
export function saveBest(jobId, summary) {
  const all = read();
  const entry = { grade: summary.grade, good: summary.good, cuts: summary.cuts, ms: summary.ms, at: Date.now() };
  const isNew = isBetter(entry, all[jobId]);
  if (isNew) {
    all[jobId] = entry;
    try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* storage unavailable */ }
  }
  return { isNew, best: isNew ? entry : all[jobId] };
}

export function loadLastJob() { try { return localStorage.getItem(LAST_JOB); } catch { return null; } }
export function saveLastJob(id) { try { localStorage.setItem(LAST_JOB, id); } catch { /* storage unavailable */ } }

/* Blade + cutting stick wear, carried from job to job on this device. */
const MACHINE = 'cutshop.machine.v1';
export function loadMachine() {
  try { const m = JSON.parse(localStorage.getItem(MACHINE) || 'null'); return m && typeof m.bladeWear === 'number' ? m : null; } catch { return null; }
}
export function saveMachine(m) { try { localStorage.setItem(MACHINE, JSON.stringify(m)); } catch { /* storage unavailable */ } }
