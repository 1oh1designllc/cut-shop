/**
 * scoring.js — end-of-job summary and grade.
 */
export function grade({ good, total, avgErr, cuts, ms }, par) {
  const pct = good / total;
  if (pct >= 1 && avgErr <= 1 / 64 && cuts <= par.cuts && ms <= par.timeMs) return 'S';
  if (pct >= 0.95) return 'A';
  if (pct >= 0.8) return 'B';
  if (pct >= 0.6) return 'C';
  return 'D';
}

export function summarize(s, job, total) {
  const good = s.goodLayers * job.sheets;
  const avgErr = s.errs.length ? s.errs.reduce((a, b) => a + b, 0) / s.errs.length : 0;
  const ms = s.t0 ? (s.tEnd || s.t0) - s.t0 : 0;
  const out = { good, total, ruined: s.ruined.size * job.sheets, avgErr, cuts: s.cuts, ms, hasErr: s.errs.length > 0 };
  out.grade = grade(out, job.par);
  return out;
}
