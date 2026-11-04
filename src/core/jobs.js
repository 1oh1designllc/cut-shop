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
];
