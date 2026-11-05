/**
 * scoring.js — end-of-job summary and grade.
 * Delivered = finished positions × sheets that survived clamp marks / slipping.
 */
export function grade({ delivered, order, avgErr, cuts, ms, safety = 0 }, par) {
  const pct = delivered / order;
  if (pct >= 1 && !safety && avgErr <= 1 / 64 && cuts <= par.cuts && ms <= par.timeMs) return 'S';
  if (pct >= 1 && !safety) return 'A';
  if (pct >= 1) return 'B'; // order met, but a safety violation caps the grade
  if (pct >= 0.95) return 'B';
  if (pct >= 0.8) return 'C';
  return 'D';
}

/** @param {{ s: object, job: object, order: number, delivered: number, spoiled: number }} g */
export function summarize({ s, job, order, delivered, spoiled }) {
  const avgErr = s.errs.length ? s.errs.reduce((a, b) => a + b, 0) / s.errs.length : 0;
  const ms = (s.t0 ? (s.tEnd || s.t0) - s.t0 : 0) + s.extraMs;
  const out = {
    good: delivered, delivered, order, spoiledSheets: spoiled,
    ruined: s.ruined.size * job.sheets, avgErr, cuts: s.cuts, ms, hasErr: s.errs.length > 0,
    safety: s.safety, frayed: s.frayMax,
  };
  out.grade = grade(out, job.par);
  return out;
}
