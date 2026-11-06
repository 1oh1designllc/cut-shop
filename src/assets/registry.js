/**
 * registry.js — every sound and art slot the game can take from Jude's files.
 * ------------------------------------------------------------------
 * Drop files into public/assets/sounds and public/assets/art named after the
 * slot (e.g. cut-thick-1.mp3, cut-thick-2.mp3, job.business-cards.svg), run
 * `node tools/prepare-assets.mjs`, and the game picks them up. Any slot without
 * a file keeps the built-in placeholder. Check what's filled at …/cut-shop/#assets
 * ------------------------------------------------------------------
 */

/** Sounds: several takes per slot are played at random so it doesn't repeat. */
export const SOUND_SLOTS = {
  'cut-thick': 'Blade cut, full cycle down and up, thick lift',
  'cut-thin': 'Blade cut, thin lift',
  'clamp-down': 'Clamp coming down',
  'clamp-up': 'Clamp releasing',
  'trim-fall': 'Trim strip falling',
  jog: 'Jogging / knocking up a stack by hand',
  wheel: 'Hand wheel turning (loops while the gauge moves)',
  idle: 'Machine idle hum (loops quietly in the background)',
  bolt: 'Hex key on a bolt',
  'blade-set': 'Blade set down on the bench',
  handle: 'Hex handle screwing in',
};

/** Art: SVG preferred, PNG fine. `size` is what the slot is drawn at (aspect matters most). */
export const ART_SLOTS = {
  'job.business-cards': { group: 'Job artwork', desc: 'Business card, trim + 1/8" bleed', size: '3.75 × 2.25 in (landscape)' },
  'job.postcards-4x6': { group: 'Job artwork', desc: '4×6 postcard, trim + bleed', size: '4.25 × 6.25 in (portrait)' },
  'job.postcards-5x7': { group: 'Job artwork', desc: '5×7 postcard, trim + bleed', size: '5.25 × 7.25 in (portrait)' },
  'job.greeting-cards': { group: 'Job artwork', desc: '10×7 greeting card, flat, scores in half', size: '10.25 × 7.25 in (landscape)' },
  'job.flyers': { group: 'Job artwork', desc: '8½×11 flyer, trim + bleed', size: '8.75 × 11.25 in (portrait)' },
  'job.brochures': { group: 'Job artwork', desc: '8½×11 tri-fold brochure (outside), folds along the 11" side', size: '8.75 × 11.25 in (portrait)' },
  'front.backdrop': { group: 'Machine, front view', desc: 'Back wall behind everything (optional)', size: '1200 × 720 px' },
  'front.housing': { group: 'Machine, front view', desc: 'Top beam: hazard stripe, nameplate', size: '1200 × 86 px' },
  'front.blade': { group: 'Machine, front view', desc: 'Blade carrier face + blade with bolts; bottom edge = cutting edge', size: '1130 × 230 px' },
  'front.clamp': { group: 'Machine, front view', desc: 'Clamp bar', size: '1125 × 50 px' },
  'front.finger': { group: 'Machine, front view', desc: 'ONE back-gauge finger (repeated across)', size: '40 × 300 px' },
  'front.table': { group: 'Machine, front view', desc: 'Table surface in front of the blade', size: '1200 × 175 px' },
  'front.post': { group: 'Machine, front view', desc: 'Left light-curtain post (mirrored for the right)', size: '30 × 460 px' },
  'bc.blade': { group: 'Blade change', desc: 'Blade, long and thin, cutting edge at the bottom', size: '1660 × 130 px' },
  'bc.board': { group: 'Blade change', desc: 'Wooden blade board', size: '1700 × 330 px' },
  'bc.bolt': { group: 'Blade change', desc: 'Plain bolt head, seen from the front', size: '64 × 64 px' },
  'bc.bolt-slotted': { group: 'Blade change', desc: 'Slotted bolt in its vertical slot', size: '64 × 160 px' },
  'bc.handle': { group: 'Blade change', desc: 'Hex handle (long bar, threaded stud at the bottom)', size: '80 × 320 px' },
  'ui.wordmark': { group: 'Title & icon', desc: 'Game wordmark, transparent background', size: '~600 × 120 px' },
};

/** Which art slot a job's press-sheet artwork comes from. */
export const jobArtSlot = (job) => `job.${job.artKey || job.template || 'business-cards'}`;
