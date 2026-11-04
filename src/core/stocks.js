/**
 * stocks.js — paper stock profiles, held as data.
 * ------------------------------------------------------------------
 * Behaviour comes from Jude's shop experience (2026-11-04 notes):
 *  - C2S cardstock picks up clamp marks once a lift is taller than ~20 sheets.
 *  - 100# gloss text slips/creeps under the clamp on tall lifts.
 *  - Text stocks (gloss, opaque) arrive curled and must be decurled by hand.
 *  - Clamp pressure is fixed (set during maintenance), so it isn't a play control.
 *
 * Fields
 *   caliper      inches per sheet
 *   mark, clean  clamp-mark rate: fraction of the run spoiled per 100 sheets of
 *                lift above `clean` sheets
 *   slip, slipFrom  same idea for sheets creeping out of square
 *   curl         arrives curled; jogging does nothing until it's decurled
 *   defaultLift  sheets per lift a sensible operator starts with (null = max)
 * ------------------------------------------------------------------
 */
export const STOCKS = {
  'gloss-cover-100': {
    id: 'gloss-cover-100', name: '100# gloss cover', caliper: 0.011,
    mark: 0, clean: 0, slip: 0, slipFrom: 0, curl: false, defaultLift: null,
    notes: [],
  },
  'c2s-10': {
    id: 'c2s-10', name: '10pt C2S cardstock', caliper: 0.010,
    mark: 0.045, clean: 20, slip: 0.01, slipFrom: 150, curl: false, defaultLift: 100,
    notes: ['Coated: clamp marks above ~20 sheets'],
  },
  'c2s-12': {
    id: 'c2s-12', name: '12pt C2S cardstock', caliper: 0.012,
    mark: 0.045, clean: 20, slip: 0.01, slipFrom: 150, curl: false, defaultLift: 100,
    notes: ['Coated: clamp marks above ~20 sheets'],
  },
  'c2s-14': {
    id: 'c2s-14', name: '14pt C2S cardstock', caliper: 0.014,
    mark: 0.05, clean: 20, slip: 0.01, slipFrom: 150, curl: false, defaultLift: 100,
    notes: ['Coated: clamp marks above ~20 sheets', 'Thick: short lifts only'],
  },
  'uncoated-110': {
    id: 'uncoated-110', name: '110# uncoated cover', caliper: 0.0145,
    mark: 0.02, clean: 40, slip: 0, slipFrom: 0, curl: false, defaultLift: 120,
    notes: ['Uncoated: forgiving, few clamp marks'],
  },
  'gloss-text-100': {
    id: 'gloss-text-100', name: '100# gloss text', caliper: 0.0045,
    mark: 0.008, clean: 100, slip: 0.05, slipFrom: 250, curl: true, defaultLift: 300,
    notes: ['Slippery: creeps under the clamp above ~250 sheets', 'Curls: decurl before jogging'],
  },
  'opaque-60': {
    id: 'opaque-60', name: '60# opaque text', caliper: 0.0045,
    mark: 0.006, clean: 100, slip: 0.015, slipFrom: 400, curl: true, defaultLift: 400,
    notes: ['Curls: decurl before jogging'],
  },
};

/** Fraction of the run spoiled (clamp marks + slipped sheets) when cutting lifts of `sheets`. */
export function spoilFraction(stock, sheets) {
  const marks = stock.mark * Math.max(0, sheets - stock.clean) / 100;
  const slips = stock.slip * Math.max(0, sheets - stock.slipFrom) / 100;
  return Math.min(0.5, marks + slips);
}
