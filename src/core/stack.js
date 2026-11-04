/**
 * stack.js — a lift of paper on the cutter.
 * ------------------------------------------------------------------
 * A Stack is { W, D, layers: Affine[] }. W × D is its footprint in the local
 * frame (see geometry.js). Each layer is one pile of sheets (e.g. 100 sheets
 * of 100# cover = 1.1") and its affine says which region of the press sheet
 * that pile holds. Strips cut from different parts of the sheet can be stacked
 * into one lift as long as their footprints match.
 * ------------------------------------------------------------------
 */
import { IDENTITY, ap, r3, shiftM, rotM } from './geometry.js';

/** @typedef {import('./geometry.js').Affine} Affine */
/** @typedef {{ W: number, D: number, layers: Affine[] }} Stack */

/** @returns {Stack} */
export const createStack = (W, D, layers = [IDENTITY.slice()]) => ({ W, D, layers });

/** Press-sheet rectangle covered by one layer of a stack. */
export function sheetRect(st, m) {
  const pts = [ap(m, 0, 0), ap(m, st.W, 0), ap(m, 0, st.D), ap(m, st.W, st.D)];
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

/**
 * Cut a stack with the back gauge at g inches from the blade.
 * The back piece (against the gauge) is g deep; the front piece is the rest.
 * @returns {{ back: Stack, front: Stack } | null} null when the lift doesn't reach the blade.
 */
export function cutStack(st, g) {
  if (g >= st.D - 1e-6 || g <= 1e-6) return null;
  return {
    back: { W: st.W, D: r3(g), layers: st.layers.map((m) => m.slice()) },
    front: { W: st.W, D: r3(st.D - g), layers: st.layers.map((m) => shiftM(m, g)) },
  };
}

/** Rotate 90° clockwise (seen from above). */
export const rotateStack = (st) => ({ W: st.D, D: st.W, layers: st.layers.map((m) => rotM(m, st.D)) });

/** Line segments (press-sheet coords) a cut at g leaves on each layer — for the minimap. */
export const cutSegments = (st, g) => st.layers.map((m) => [...ap(m, 0, g), ...ap(m, st.W, g)]);

/**
 * Can `piece` go on top of `table` as one pile? Same footprint (either way round).
 * Height isn't limited here: a pile taller than the lift setting is simply cut
 * in several passes (see game.js).
 */
export function compat(table, piece) {
  if (!table) return { ok: false, why: 'Nothing on the table to add to' };
  const same = Math.abs(table.W - piece.W) < 0.002 && Math.abs(table.D - piece.D) < 0.002;
  const swap = Math.abs(table.W - piece.D) < 0.002 && Math.abs(table.D - piece.W) < 0.002;
  if (!same && !swap) return { ok: false, why: 'Different size from the lift on the table' };
  return { ok: true, swap: !same };
}
