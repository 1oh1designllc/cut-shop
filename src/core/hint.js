/**
 * hint.js — works out a sensible next move from any game state.
 * ------------------------------------------------------------------
 * Used by the tutorial coach and the optional next-cut hint.
 *
 * Rules, in order:
 *   1. Table empty → load from the tray.
 *   2. A tray strip matches the lift and fits under the clamp → stack it.
 *   3. Trim waste first: any orientation whose frontmost safe cut drops only
 *      scrap (margin or gutter). Prefer no turn, then 180°, then 90°.
 *   4. Otherwise split along the direction with the FEWEST card positions,
 *      so there are fewer strips to stack and re-cut.
 * A "safe" cut lands on a trim line and never passes through an intact card
 * on any layer of the lift. The frontmost safe cut is always taken.
 * ------------------------------------------------------------------
 */
import { ap, inv, r3, r6 } from './geometry.js';
import { cutStack, rotateStack, sheetRect, compat } from './stack.js';
import { classify } from './classify.js';

const ROTATE_PREF = [0, 2, 1, 3];

/** v-intervals (local depth) of every intact card on every layer of a lift. */
function cardIntervals(st, cards, ruined, tol) {
  const out = [];
  for (const m of st.layers) {
    const mi = inv(m);
    for (const k of cards) {
      if (ruined.has(k.id)) continue;
      const pts = [ap(mi, k.x0, k.y0), ap(mi, k.x1, k.y0), ap(mi, k.x0, k.y1), ap(mi, k.x1, k.y1)];
      const us = pts.map((p) => p[0]), vs = pts.map((p) => p[1]);
      const u0 = Math.min(...us), u1 = Math.max(...us), v0 = Math.min(...vs), v1 = Math.max(...vs);
      const ou = Math.min(u1, st.W) - Math.max(u0, 0), ov = Math.min(v1, st.D) - Math.max(v0, 0);
      if (ou <= tol || ov <= tol) continue;
      out.push([v0, v1]);
    }
  }
  return out;
}

function frontmostCut(st, game, ruined) {
  const { cards } = game.layout, tol = game.job.tolerance;
  const ivs = cardIntervals(st, cards, ruined, tol);
  if (!ivs.length) return null;
  const lines = new Set();
  for (const [a, b] of ivs) for (const x of [a, b]) if (x > tol && x < st.D - tol) lines.add(r6(x));
  const safe = [...lines].filter((g) => ivs.every(([a, b]) => !(g > a + tol && g < b - tol))).sort((a, b) => b - a);
  if (!safe.length) return null;
  const g = safe[0];
  const front = cutStack(st, g).front;
  const scratch = new Set(ruined);
  const types = front.layers.map((m) => classify(sheetRect(front, m), cards, scratch, tol).type);
  const kind = types.every((t) => t === 'scrap') ? 'scrap' : types.every((t) => t === 'good') ? 'good' : 'wip';
  return { gauge: r3(g), front: kind, frontDepth: r3(st.D - g), positions: new Set(ivs.map(([a]) => r3(a))).size };
}

function why(c, game) {
  const unit = game.job.unit || 'cards';
  if (c.front === 'scrap') {
    return c.frontDepth <= 2 * game.job.bleed + 1e-6
      ? 'Cuts out the gutter between pieces. The strip in front is waste.'
      : 'Trims a margin off. The strip in front is waste.';
  }
  if (c.front === 'good') return `Cuts finished ${unit} off the front.`;
  return 'Splits off a strip of pieces. It goes to the tray for later.';
}

/**
 * @returns {null | { action: 'load'|'add', index: number, why: string }
 *               | { action: 'cut', rotate: number, gauge: number, front: string, why: string }}
 */
export function nextHint(game) {
  const s = game.state;
  if (s.done) return null;
  if (!s.table) {
    return s.tray.length ? { action: 'load', index: 0, why: 'The table is empty. Load the next piece from the tray.' } : null;
  }
  for (let i = 0; i < s.tray.length; i++) {
    if (compat(s.table, s.tray[i], game.lift, game.job.maxLift).ok) {
      return { action: 'add', index: i, why: 'A strip in the tray matches this lift. Stack it on so both get cut at once.' };
    }
  }
  const options = [];
  let st = s.table;
  for (let r = 0; r < 4; r++) {
    const c = frontmostCut(st, game, s.ruined);
    if (c) options.push({ ...c, rotate: r });
    st = rotateStack(st);
  }
  if (!options.length) return null;
  const pref = (o) => ROTATE_PREF.indexOf(o.rotate);
  const scrap = options.filter((o) => o.front === 'scrap').sort((a, b) => pref(a) - pref(b));
  const pick = scrap.length ? scrap[0] : options.sort((a, b) => (a.positions - b.positions) || (pref(a) - pref(b)))[0];
  return { action: 'cut', rotate: pick.rotate, gauge: pick.gauge, front: pick.front, why: why(pick, game) };
}
