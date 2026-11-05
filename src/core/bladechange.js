/**
 * bladechange.js — the blade-change procedure, as Jude does it (corrected 2026-11-05).
 * ------------------------------------------------------------------
 *  1. lock      Hold both cut buttons until the blade comes down and locks.
 *  2. slotted   Unscrew the two slotted bolts FIRST (one left, one right; vertical slots).
 *  3. handles   Screw the hex handles into those spots: locks the blade and gives a grip.
 *  4. bolts     Loosen and remove all the other bolts.
 *  5. lift      Lift the old blade out with the handles; lay it flat.
 *  6. move      Take the handles off the old blade; put them in the same spots on the
 *               new blade sitting on the wooden board.
 *  7. fit       Lift the new blade into position; tighten the handles to lock it in.
 *  8. snug      Put the other bolts in, snug only.
 *  9. depth     Test-cut until it cuts the last sheet and just kisses the stick.
 * 10. tighten   Tighten the other bolts.
 * 11. unhandle  Unscrew the hex handles.                      (confirmed by Jude
 * 12. slotback  Put the two slotted bolts back in and tighten.  2026-11-05)
 * 13. release   Release the blade. Done.
 * Out-of-order moves are refused; dangerous ones also count as safety violations
 * (pulling plain bolts before the handles hold the blade; tightening before the
 * depth is set). Pure state machine: the UI calls actions and renders `bc.state`.
 * ------------------------------------------------------------------
 */

export const BOLTS = [
  { id: 1, slotted: true }, { id: 2, slotted: false }, { id: 3, slotted: false }, { id: 4, slotted: false },
  { id: 5, slotted: false }, { id: 6, slotted: false }, { id: 7, slotted: false }, { id: 8, slotted: true },
];

export const ORDER = ['lock', 'slotted', 'handles', 'bolts', 'lift', 'move', 'fit', 'snug', 'depth', 'tighten', 'unhandle', 'slotback', 'release', 'done'];

export const STEPS = {
  lock: 'Hold both CUT buttons until the blade comes down and locks in place.',
  slotted: 'Unscrew the two slotted bolts first: one on the left, one on the right.',
  handles: 'Screw the hex handles into those two spots. They lock the blade and give you something to grab.',
  bolts: 'The handles are holding the blade. Now loosen and remove all the other bolts.',
  lift: 'Lift the old blade out with the hex handles and lay it on a flat surface.',
  move: 'Take the handles off the old blade and put them in the same spots on the new blade on the board.',
  fit: 'Lift the new blade into position with the handles and tighten them to lock it in.',
  snug: 'Put the other bolts in, snug only. The depth still has to be set.',
  depth: 'Set the depth: test-cut until the blade cuts the last sheet and only kisses the cutting stick.',
  tighten: 'Depth is right. Tighten the bolts.',
  unhandle: 'Unscrew the hex handles.',
  slotback: 'Put the two slotted bolts back in and tighten them.',
  release: 'Release the blade. Done.',
  done: 'New blade in.',
};

/** @param {() => number} [rng] for the new blade's starting depth offset */
export function createBladeChange(rng = Math.random) {
  const st = {
    step: 'lock',
    bolts: Object.fromEntries(BOLTS.map((b) => [b.id, 'tight'])), // tight | out | snug
    handles: 'none', // none | old (in the old blade) | new (in the new blade)
    depth: 0,
    lastTest: null, // 'shallow' | 'right' | 'deep'
    tests: 0,
    violations: [],
    message: STEPS.lock,
  };
  const startDepth = () => (rng() < 0.5 ? -1 : 1) * (1 + Math.floor(rng() * 2)); // ±1 or ±2

  const go = (step) => { st.step = step; st.message = STEPS[step]; return true; };
  const say = (m) => { st.message = m; return false; };
  const violate = (m) => { st.violations.push(m); st.message = m; return false; };
  const allOf = (pred, want) => BOLTS.filter(pred).every((x) => st.bolts[x.id] === want);
  const slottedB = (x) => x.slotted, plainB = (x) => !x.slotted;

  const bc = {
    get state() { return st; },

    lock() { return st.step === 'lock' ? go('slotted') : false; },

    /** Tap a bolt. What it does depends on the step. */
    bolt(id) {
      const b = BOLTS.find((x) => x.id === id);
      if (!b) return false;
      const cur = st.bolts[id];
      switch (st.step) {
        case 'lock':
          return say('Lock the blade down first: hold both CUT buttons.');
        case 'slotted':
          if (!b.slotted) return violate('Stop! The plain bolts are what hold the blade until the handles are in. Slotted bolts first, then the handles.');
          if (cur !== 'tight') return false;
          st.bolts[id] = 'out';
          if (allOf(slottedB, 'out')) go('handles');
          return true;
        case 'handles':
          return b.slotted ? false : violate('Stop! Screw the handles in before pulling the other bolts, or the blade drops.');
        case 'bolts':
          if (b.slotted || cur !== 'tight') return false;
          st.bolts[id] = 'out';
          if (allOf(plainB, 'out')) go('lift');
          return true;
        case 'snug':
          if (b.slotted) return say('The handles are in the slotted spots for now. Snug the other bolts.');
          if (cur !== 'out') return false;
          st.bolts[id] = 'snug';
          if (allOf(plainB, 'snug')) go('depth');
          return true;
        case 'depth':
          return violate('Not yet. Tightening before the depth is set locks in a bad depth. Set it first.');
        case 'tighten':
          if (b.slotted || cur !== 'snug') return false;
          st.bolts[id] = 'tight';
          if (allOf(plainB, 'tight')) go('unhandle');
          return true;
        case 'slotback':
          if (!b.slotted || cur !== 'out') return false;
          st.bolts[id] = 'tight';
          if (allOf(slottedB, 'tight')) go('release');
          return true;
        default:
          return false;
      }
    },

    attachHandles() {
      if (st.step === 'slotted') return say('Unscrew the two slotted bolts first. The handles go in their spots.');
      if (st.step !== 'handles') return false;
      st.handles = 'old';
      return go('bolts');
    },

    liftOld() {
      if (st.step !== 'lift') return say('The blade is still bolted in.');
      return go('move');
    },

    moveHandles() {
      if (st.step !== 'move') return false;
      st.handles = 'new';
      return go('fit');
    },

    fitNew() {
      if (st.step !== 'fit') return false;
      st.depth = startDepth(); st.lastTest = null;
      return go('snug');
    },

    /** Nudge the depth: +1 deeper, −1 shallower. */
    adjust(delta) {
      if (st.step !== 'depth') return false;
      st.depth = Math.max(-3, Math.min(3, st.depth + delta)); st.lastTest = null; return true;
    },

    testCut() {
      if (st.step !== 'depth') return false;
      st.tests++;
      st.lastTest = st.depth < 0 ? 'shallow' : st.depth > 0 ? 'deep' : 'right';
      if (st.lastTest === 'right') { st.step = 'tighten'; st.message = 'Test cut is clean: through the last sheet, just kissing the stick. ' + STEPS.tighten; }
      else if (st.lastTest === 'shallow') st.message = `Test cut: the bottom ${2 * -st.depth} sheets aren't cut through. Go deeper.`;
      else st.message = 'Test cut: the blade is biting into the cutting stick. That damages the stick, the blade and the paper. Go shallower.';
      return true;
    },

    removeHandles() {
      if (st.step !== 'unhandle') return false;
      st.handles = 'none';
      return go('slotback');
    },

    release() {
      if (st.step !== 'release') return say('Not ready to release: ' + st.message);
      return go('done');
    },
  };
  return bc;
}
