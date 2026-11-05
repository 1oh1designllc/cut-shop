/**
 * bladechange.js — the blade-change procedure, as Jude does it (2026-11-05).
 * ------------------------------------------------------------------
 *  1. lock     Hold both cut buttons until the blade comes down and locks.
 *  2. bolts    Remove every bolt EXCEPT the two slotted ones.
 *  3. handles  Screw the long hex handles into the slots so you never grip the blade.
 *  4. slotted  Remove the two slotted bolts (the handles now hold the blade).
 *  5. lift     Lift the old blade out with the handles and put it away.
 *  6. fit      Take the new blade off the board, handles in, fit it in place.
 *  7. snug     Put every bolt back in snug — not tight, the depth still needs setting.
 *  8. depth    Adjust and test-cut until it cuts the last sheet and just kisses the stick.
 *  9. tighten  Tighten every bolt.
 * 10. release  Release the blade. Done.
 * Doing things out of order is refused; the dangerous ones also count as a
 * safety violation (e.g. pulling a slotted bolt with no handles in).
 * Pure state machine: the UI calls actions and renders `bc.state`.
 * ------------------------------------------------------------------
 */

export const BOLTS = [
  { id: 1, slotted: false }, { id: 2, slotted: true }, { id: 3, slotted: false }, { id: 4, slotted: false },
  { id: 5, slotted: false }, { id: 6, slotted: false }, { id: 7, slotted: true }, { id: 8, slotted: false },
];

export const STEPS = {
  lock: 'Hold both CUT buttons until the blade comes down and locks in place.',
  bolts: 'Remove every bolt except the two slotted ones. Those stay in until the handles are on.',
  handles: 'Screw the long hex handles into the two slots, so you never grip the blade itself.',
  slotted: 'Now take out the two slotted bolts. The handles are holding the blade.',
  lift: 'Lift the old blade out with the handles and put it away safely.',
  fit: 'Unscrew the new blade from the board, put the handles in it, and fit it in place.',
  snug: 'Put every bolt back in, snug only. The depth still has to be set.',
  depth: 'Set the depth: test-cut until the blade cuts the last sheet and only kisses the cutting stick.',
  tighten: 'Depth is right. Tighten every bolt.',
  release: 'Release the blade. Done.',
  done: 'New blade in.',
};

/** @param {() => number} [rng] for the new blade's starting depth offset */
export function createBladeChange(rng = Math.random) {
  const st = {
    step: 'lock',
    bolts: Object.fromEntries(BOLTS.map((b) => [b.id, 'tight'])), // tight | out | snug
    handles: false,
    depth: 0,
    lastTest: null, // 'shallow' | 'right' | 'deep'
    tests: 0,
    violations: [],
    message: STEPS.lock,
  };
  const startDepth = () => (rng() < 0.5 ? -1 : 1) * (1 + Math.floor(rng() * 2)); // ±1 or ±2

  const say = (m) => { st.message = m; return false; };
  const violate = (m) => { st.violations.push(m); st.message = m; return false; };
  const all = (pred) => BOLTS.every(pred);

  const bc = {
    get state() { return st; },

    lock() {
      if (st.step !== 'lock') return false;
      st.step = 'bolts'; st.message = STEPS.bolts; return true;
    },

    /** Tap a bolt: removes it (bolts/slotted steps), snugs it (snug step) or tightens it (tighten step). */
    bolt(id) {
      const b = BOLTS.find((x) => x.id === id);
      if (!b) return false;
      const cur = st.bolts[id];
      if (st.step === 'lock') return say('Lock the blade down first: hold both CUT buttons.');
      if (st.step === 'bolts' || st.step === 'handles' || st.step === 'slotted') {
        if (cur === 'out') return false;
        if (b.slotted && !st.handles) {
          return violate('Stop! With no handles in, pulling a slotted bolt lets the blade drop. Slotted bolts come out last, after the handles are on.');
        }
        if (b.slotted && !all((x) => x.slotted || st.bolts[x.id] === 'out')) {
          return say('Take out all the plain bolts before the slotted ones.');
        }
        st.bolts[id] = 'out';
        if (st.step === 'bolts' && all((x) => x.slotted || st.bolts[x.id] === 'out')) { st.step = 'handles'; st.message = STEPS.handles; }
        else if (st.step === 'slotted' && all((x) => st.bolts[x.id] === 'out')) { st.step = 'lift'; st.message = STEPS.lift; }
        else st.message = st.step === 'bolts' ? STEPS.bolts : st.step === 'slotted' ? STEPS.slotted : st.message;
        return true;
      }
      if (st.step === 'snug') {
        if (cur !== 'out') return false;
        st.bolts[id] = 'snug';
        if (all((x) => st.bolts[x.id] === 'snug')) { st.step = 'depth'; st.message = STEPS.depth; }
        return true;
      }
      if (st.step === 'depth') {
        return violate('Not yet. Tightening before the depth is set locks in a bad depth. Set it first.');
      }
      if (st.step === 'tighten') {
        if (cur !== 'snug') return false;
        st.bolts[id] = 'tight';
        if (all((x) => st.bolts[x.id] === 'tight')) { st.step = 'release'; st.message = STEPS.release; }
        return true;
      }
      return false;
    },

    attachHandles() {
      if (st.step === 'bolts') return say('Remove the plain bolts first.');
      if (st.step !== 'handles') return false;
      st.handles = true; st.step = 'slotted'; st.message = STEPS.slotted; return true;
    },

    liftOld() {
      if (st.step !== 'lift') return say('The blade is still bolted in.');
      st.step = 'fit'; st.message = STEPS.fit; return true;
    },

    fitNew() {
      if (st.step !== 'fit') return false;
      st.step = 'snug'; st.depth = startDepth(); st.lastTest = null; st.message = STEPS.snug; return true;
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

    release() {
      if (st.step !== 'release') return say('Not ready to release: ' + st.message);
      st.step = 'done'; st.message = STEPS.done; return true;
    },
  };
  return bc;
}
