/**
 * geometry.js — affine math, rounding and inch formatting.
 * ------------------------------------------------------------------
 * Every lift on the table carries one Affine per layer that maps its LOCAL
 * coordinates to PRESS-SHEET coordinates (inches, origin top-left of the sheet).
 *
 * Local frame of a lift on the cutter (seen from above, operator at the front):
 *   u = across the table, 0 at the left side guide → W
 *   v = depth, 0 against the back gauge → D (toward the operator)
 *
 * Affines use the canvas convention so they can go straight into
 * ctx.setTransform():  x = a*u + c*v + e,  y = b*u + d*v + f
 * ------------------------------------------------------------------
 */

/** @typedef {[number, number, number, number, number, number]} Affine */

/** @type {Affine} */
export const IDENTITY = [1, 0, 0, 1, 0, 0];

/** Compose: apply B, then A. @returns {Affine} */
export const mul = (A, B) => [
  A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1],
  A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
  A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5],
];

/** @returns {Affine} */
export const inv = (m) => {
  const [a, b, c, d, e, f] = m, det = a * d - b * c;
  return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det];
};

/** Apply an affine to a point. @returns {[number, number]} */
export const ap = (m, u, v) => [m[0] * u + m[2] * v + m[4], m[1] * u + m[3] * v + m[5]];

export const r3 = (v) => Math.round(v * 1000) / 1000;
export const r6 = (v) => Math.round(v * 1e6) / 1e6;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** The front piece of a cut at depth g: its new v=0 is the cut edge. */
export const shiftM = (m, g) => [m[0], m[1], m[2], m[3], r6(m[4] + m[2] * g), r6(m[5] + m[3] * g)];

/**
 * Rotate a lift 90° clockwise (seen from above). Old left edge goes to the gauge.
 * u' = D - v, v' = u  →  W' = D, D' = W.
 */
export const rotM = (m, D) => [-m[2], -m[3], m[0], m[1], r6(m[4] + m[2] * D), r6(m[5] + m[3] * D)];

/** Format inches as a fraction to the nearest 1/64 ("16 3/4"). Prefixes ≈ if not exact. */
export function frac(x) {
  const n = Math.round(x * 64), approx = Math.abs(x - n / 64) > 0.0005;
  const w = Math.floor(n / 64);
  let r = n - w * 64, d = 64, s;
  if (r === 0) s = String(w);
  else { while (r % 2 === 0) { r /= 2; d /= 2; } s = (w ? w + ' ' : '') + r + '/' + d; }
  return (approx ? '≈' : '') + s;
}

/** Parse "16.75", "16 3/4", "16-3/4", '3/4"' → inches. NaN if unreadable. */
export function parseIn(str) {
  const s = String(str).replace(/(inches|inch|in|")/gi, '').trim();
  if (!s) return NaN;
  let tot = 0;
  for (const p of s.split(/[\s-]+/)) {
    if (/^\d*\.?\d+$/.test(p)) tot += parseFloat(p);
    else {
      const m = p.match(/^(\d+)\/(\d+)$/);
      if (!m || +m[2] === 0) return NaN;
      tot += m[1] / m[2];
    }
  }
  return tot;
}
