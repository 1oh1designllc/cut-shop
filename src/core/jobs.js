import { makeJob } from './jobgen.js';

/**
 * jobs.js — job tickets, held as data.
 * ------------------------------------------------------------------
 * A job is a press sheet printed N-up with a grid of finished pieces,
 * gutters (= 2 × bleed) between them, and equal margins around the grid.
 * layout.js derives every card's trim box from these numbers.
 * ------------------------------------------------------------------
 */
export const JOBS = [
  {
    id: 'T1',
    label: 'Tutorial · Postcards 4-up',
    title: 'Postcards, full bleed',
    unit: 'postcards',
    coach: true,
    intro: 'Tutorial: follow the steps at the top of the table. Each one tells you what to do and why.',
    stock: 'gloss-cover-100',
    sheets: 100,
    sheet: { w: 10, h: 14 },
    finished: { w: 4, h: 6 },
    cols: 2,
    rows: 2,
    gutter: 0.25,
    bleed: 0.125,
    tolerance: 1 / 16,
    maxLift: 3.5,
    startGauge: 17.5,
    par: { cuts: 9, timeMs: 4 * 60 * 1000 },
  },
  {
    id: '2417',
    label: '#2417 · Business cards 21-up',
    title: 'Business cards, full bleed',
    unit: 'cards',
    stock: 'gloss-cover-100',
    sheets: 100,
    sheet: { w: 12, h: 18 },
    finished: { w: 3.5, h: 2 },
    cols: 3,
    rows: 7,
    gutter: 0.25,
    bleed: 0.125,
    tolerance: 1 / 32,
    maxLift: 3.5,
    startGauge: 17.5,
    par: { cuts: 22, timeMs: 6 * 60 * 1000 },
  },
  // Phase 2: the shop's everyday work on 12×18, on real stocks. Par is worked out automatically.
  makeJob('postcards-4x6', 'c2s-14', 1000, 3101),
  makeJob('postcards-5x7', 'c2s-12', 500, 3102),
  makeJob('greeting-cards', 'uncoated-110', 250, 3103),
  makeJob('flyers', 'opaque-60', 1000, 3104),
  makeJob('brochures', 'gloss-text-100', 1000, 3105),
  makeJob('business-cards', 'c2s-14', 2500, 3106),
];
