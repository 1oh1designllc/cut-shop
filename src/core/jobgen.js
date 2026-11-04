/**
 * jobgen.js — job templates (what Jude's shop cuts most, on 12×18) and a random job generator.
 * ------------------------------------------------------------------
 * Every job ships with overs: ~5% extra sheets so clamp-marked or slipped
 * sheets don't leave the order short. The order quantity is what must be
 * delivered; `sheets` is what the press ran.
 * ------------------------------------------------------------------
 */
export const TEMPLATES = {
  'business-cards': {
    title: 'Business cards', unit: 'cards', art: 'card', ink: '#1d6e78',
    // Jude's standard: 24-up (3 × 8), double trim, bleeds run almost to the sheet edge.
    sheet: { w: 12, h: 18 }, finished: { w: 3.5, h: 2 }, cols: 3, rows: 8,
    stocks: ['c2s-14', 'c2s-12', 'uncoated-110'], orders: [1000, 2500, 5000],
  },
  'postcards-4x6': {
    title: 'Postcards 4×6', unit: 'postcards', art: 'postcard', ink: '#7a3b69',
    sheet: { w: 12, h: 18 }, finished: { w: 4, h: 6 }, cols: 2, rows: 2,
    stocks: ['c2s-14', 'c2s-12', 'c2s-10'], orders: [500, 1000, 2000],
  },
  'postcards-5x7': {
    title: 'Postcards 5×7', unit: 'postcards', art: 'postcard', ink: '#2f5d8a',
    sheet: { w: 12, h: 18 }, finished: { w: 5, h: 7 }, cols: 2, rows: 2,
    stocks: ['c2s-12', 'c2s-14', 'uncoated-110'], orders: [250, 500, 1000],
  },
  'greeting-cards': {
    title: 'Greeting cards 10×7', unit: 'cards', art: 'greeting', ink: '#a2482c',
    note: 'Scored in half after cutting.',
    sheet: { w: 12, h: 18 }, finished: { w: 10, h: 7 }, cols: 1, rows: 2,
    stocks: ['uncoated-110', 'c2s-12'], orders: [100, 250, 500],
  },
  flyers: {
    title: 'Flyers 8½×11', unit: 'flyers', art: 'flyer', ink: '#3d6b3a',
    sheet: { w: 18, h: 12 }, finished: { w: 8.5, h: 11 }, cols: 2, rows: 1,
    stocks: ['opaque-60', 'gloss-text-100'], orders: [500, 1000, 2500],
  },
  brochures: {
    title: 'Tri-fold brochures 8½×11', unit: 'brochures', art: 'brochure', ink: '#5b4a8a',
    note: 'Tri-folded after cutting.',
    sheet: { w: 18, h: 12 }, finished: { w: 8.5, h: 11 }, cols: 2, rows: 1,
    stocks: ['gloss-text-100'], orders: [500, 1000, 2000],
  },
};

const OVERS = 0.05;

/** Build a full job from a template, stock and order quantity. */
export function makeJob(key, stock, order, id, extra = {}) {
  const t = TEMPLATES[key];
  const up = t.cols * t.rows;
  return {
    id: String(id),
    label: `#${id} · ${t.title}`,
    title: t.title,
    template: key,
    unit: t.unit, art: t.art, ink: t.ink, note: t.note,
    stock,
    order,
    sheets: Math.ceil((order / up) * (1 + OVERS)),
    sheet: { ...t.sheet }, finished: { ...t.finished }, cols: t.cols, rows: t.rows,
    gutter: 0.25, bleed: 0.125, tolerance: 1 / 32, maxLift: 3.5, startGauge: 17.5,
    ...extra,
  };
}

/** A random job. `rng` returns [0,1) — inject a seeded one for tests. */
export function randomJob(rng = Math.random) {
  const keys = Object.keys(TEMPLATES);
  const key = keys[Math.floor(rng() * keys.length)];
  const t = TEMPLATES[key];
  const stock = t.stocks[Math.floor(rng() * t.stocks.length)];
  const order = t.orders[Math.floor(rng() * t.orders.length)];
  const id = 4000 + Math.floor(rng() * 6000);
  const job = makeJob(key, stock, order, id, { random: true });
  job.label = `#${id} · ${t.title} (random)`;
  return job;
}
