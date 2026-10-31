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
    id: '2417',
    title: 'Business cards, full bleed',
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
];
