/**
 * machine.js — the cutter's wearing parts: blade and cutting stick.
 * ------------------------------------------------------------------
 * From Jude (2026-11-05): a real blade lasts 3–8 months; the game squeezes that
 * into a few jobs. A dull blade (or a worn stick) shows up as the bottom couple
 * of sheets in each lift coming out frayed or not cut through. Usually it's the
 * blade. Blade depth is set at a blade change: it should just cut the last
 * sheet and kiss the stick. Too shallow leaves bottom sheets uncut; too deep
 * chews the stick and wears the blade faster.
 *
 * The machine state lives outside a single job (it's saved on the device), so
 * wear carries from job to job.
 * ------------------------------------------------------------------
 */

/** Wear units a blade takes before it's spent (≈ inches of paper cut × stock factor). */
export const BLADE_LIFE = 400;
/** Machine passes one face of the cutting stick takes before it's grooved through. */
export const STICK_LIFE = 400;
/** A cutting stick has 4 faces; rotate to the next, then replace. */
export const STICK_FACES = 4;

/** How hard each stock is on the blade. Unknown stocks count as 1. */
const STOCK_WEAR = {
  'gloss-cover-100': 1.0, 'c2s-10': 1.2, 'c2s-12': 1.3, 'c2s-14': 1.4,
  'uncoated-110': 1.0, 'gloss-text-100': 1.1, 'opaque-60': 0.9,
};

/** @typedef {{ bladeWear: number, stickWear: number, stickFace: number, depth: number, blades: number }} Machine */

/** @returns {Machine} a machine with a fresh blade and stick, depth set right (0). */
export const freshMachine = () => ({ bladeWear: 0, stickWear: 0, stickFace: 1, depth: 0, blades: 1 });

export const bladeLeft = (m) => Math.max(0, 1 - m.bladeWear / BLADE_LIFE);
export const stickLeft = (m) => Math.max(0, 1 - m.stickWear / STICK_LIFE);

/** Depth: negative = too shallow, 0 = right, positive = too deep. */
export const depthLabel = (d) => (d === 0 ? 'Set right' : d < 0 ? 'Too shallow' : 'Too deep');

/**
 * Sheets at the bottom of each pass that come out frayed or uncut.
 * Blade below 35% and stick face beyond 70% start to fray; a shallow blade misses sheets outright.
 */
export function fraySheets(m) {
  let k = 0;
  const sharp = bladeLeft(m);
  if (sharp < 0.35) k += Math.ceil((0.35 - sharp) * 20);
  const groove = 1 - stickLeft(m);
  if (groove > 0.7) k += Math.ceil((groove - 0.7) * 12);
  if (m.depth < 0) k += 2 * -m.depth;
  return k;
}

/** What's causing the fray, for messages. */
export function frayCause(m) {
  const causes = [];
  if (m.depth < 0) causes.push('the blade is set too shallow');
  if (bladeLeft(m) < 0.35) causes.push('the blade is dull');
  if (1 - stickLeft(m) > 0.7) causes.push('the cutting stick is grooved');
  return causes;
}

/** Apply one cut: `pileInches` of paper through `passes` machine passes. Mutates and returns m. */
export function wear(m, stockId, pileInches, passes) {
  const deep = m.depth > 0 ? 1 + m.depth * 0.75 : 1;
  m.bladeWear += pileInches * (STOCK_WEAR[stockId] ?? 1) * deep;
  m.stickWear += passes * (m.depth > 0 ? 1 + m.depth : 1);
  return m;
}
