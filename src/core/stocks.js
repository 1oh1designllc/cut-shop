/**
 * stocks.js — paper stock profiles, held as data.
 * ------------------------------------------------------------------
 * Phase 1 uses only caliper (sheet thickness → lift height).
 * The other fields are reserved for Phase 2/3 and are not read yet:
 *   slip       0..1  how much a coated sheet drifts if the clamp is light
 *   wear       relative blade wear per inch of lift cut (bond = 1)
 *   markClamp  true if heavy clamp pressure marks the sheet (NCR)
 * ------------------------------------------------------------------
 */
export const STOCKS = {
  'gloss-cover-100': {
    id: 'gloss-cover-100',
    name: '100# gloss cover',
    caliper: 0.011,
    finish: 'gloss',
    slip: 0.6,
    wear: 1.6,
    markClamp: false,
  },
};
