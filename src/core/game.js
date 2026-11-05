/**
 * game.js — the game state machine. Pure JS, no DOM: runs in Node for the harnesses.
 * ------------------------------------------------------------------
 * The UI calls actions; the game mutates its state, then publishes an immutable
 * snapshot (React reads it through useSyncExternalStore). Renderers read
 * `game.state` directly every frame.
 *
 * A real cut is three steps so the UI can animate the blade:
 *   beginCut()  → checks, marks the machine busy
 *   cut()       → the blade reaches the stick: split the lift and sort the pieces
 *   afterCut()  → blade back up, clamp releases, job may finish
 * Harnesses can call cut() + afterCut() directly.
 * ------------------------------------------------------------------
 */
import { r3, clamp, frac } from './geometry.js';
import { createStack, cutStack, rotateStack, sheetRect, compat, cutSegments } from './stack.js';
import { buildLayout } from './layout.js';
import { classify } from './classify.js';
import { STOCKS, spoilFraction } from './stocks.js';
import { autoplay } from './hint.js';
import { freshMachine, fraySheets, frayCause, wear, STICK_FACES } from './machine.js';
import { summarize } from './scoring.js';

export const GAUGE_MIN = 0.5;
export const GAUGE_MAX = 19.5;

/**
 * @param {object} job one of JOBS
 * @param {{ rng?: () => number, now?: () => number, machine?: object }} [opts]
 *   rng/now are injectable for tests; machine = blade/stick state carried in from earlier jobs
 */
export function createGame(job, opts = {}) {
  if (!job.par) job.par = computePar(job);
  const rng = opts.rng || Math.random;
  const now = opts.now || (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
  const stock = STOCKS[job.stock];
  const layout = buildLayout(job);
  const lift = job.sheets * stock.caliper;
  const total = layout.cards.length * job.sheets;
  const unit = job.unit || 'cards';
  const order = job.order ?? total;
  /** Most sheets the clamp opening takes in one pass. */
  const maxSheets = Math.floor(job.maxLift / stock.caliper + 1e-9);
  const initialLift = Math.min(maxSheets, job.defaultLift ?? stock.defaultLift ?? maxSheets);
  // Blade + stick state outlives a single run (restart keeps it; the UI saves it on the device).
  const machine = opts.machine ? { ...opts.machine } : freshMachine();
  const listeners = new Set();
  let evtId = 0;
  let s, snap;

  function fresh() {
    return {
      gauge: job.startGauge, clampDown: false, jogged: false, busy: false, done: false,
      table: createStack(job.sheet.w, job.sheet.h), tray: [],
      goodLayers: 0, errs: [], goodRects: [], scrapLayers: 0, ruined: new Set(),
      cuts: 0, cutLines: [], t0: 0, tEnd: 0,
      liftSheets: initialLift, curled: !!stock.curl, maxPass: 0, extraMs: 0, ops: 0,
      frayMax: 0, safety: 0, machine,
      anim: { jogAt: 0, cutAt: 0, fall: null },
      event: null,
    };
  }
  const commit = () => { snap = { ...s }; listeners.forEach((fn) => fn()); };
  const say = (msg, kind = '') => { s.event = { id: ++evtId, msg, kind }; };
  const startClock = () => { if (!s.t0) s.t0 = now(); };
  const blocked = () => s.busy || s.done;
  const spoiled = () => Math.min(Math.floor(job.sheets / 2), Math.round(job.sheets * spoilFraction(stock, s.maxPass)) + s.frayMax);
  const delivered = () => s.goodLayers * (job.sheets - spoiled());
  const passesFor = (st) => (st ? Math.ceil((st.layers.length * job.sheets) / s.liftSheets) : 0);

  function sortStack(st) {
    const keep = [];
    const out = { good: 0, scrap: 0, ruined: 0, errs: [] };
    for (const m of st.layers) {
      const r = sheetRect(st, m);
      const c = classify(r, layout.cards, s.ruined, job.tolerance);
      out.ruined += c.ruinedNew;
      if (c.type === 'good') { s.goodLayers++; s.errs.push(c.err); s.goodRects.push(r); out.good++; out.errs.push(c.err); }
      else if (c.type === 'scrap') { s.scrapLayers++; out.scrap++; }
      else keep.push(m);
    }
    out.stack = keep.length ? { W: st.W, D: st.D, layers: keep } : null;
    return out;
  }

  s = fresh();
  const intro = () => job.intro || `Job #${job.id} is on the table. Start by trimming the foot margin: set the gauge, jog, clamp, cut.`;
  say(intro());
  snap = { ...s };

  const game = {
    job, stock, layout, lift, total, order, maxSheets,
    spoiled, delivered, passesFor,
    get state() { return s; },
    getSnapshot: () => snap,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    /** @returns {boolean} true if the gauge moved */
    setGauge(v) {
      if (blocked()) return false;
      if (s.clampDown) { say('Release the clamp before moving the gauge.', 'warn'); commit(); return false; }
      const nv = r3(clamp(v, GAUGE_MIN, GAUGE_MAX));
      if (nv === s.gauge) return false;
      s.gauge = nv; startClock(); commit();
      return true;
    },

    toggleClamp() {
      if (blocked()) return false;
      if (!s.table) { say('Nothing on the table to clamp.', 'warn'); commit(); return false; }
      s.clampDown = !s.clampDown; startClock(); commit();
      return true;
    },

    jog() {
      if (blocked() || !s.table) return false;
      if (s.clampDown) { say('Release the clamp to jog the lift.', 'warn'); commit(); return false; }
      if (s.curled) {
        s.curled = false; s.anim.jogAt = now(); startClock();
        say('You bend the stack against the curl until it lies flat. Now jog it.');
        commit();
        return true;
      }
      s.jogged = true; s.anim.jogAt = now(); startClock(); commit();
      return true;
    },

    /** Sheets per pass under the clamp. Set between cuts, not while clamped. */
    setLift(sheets) {
      if (blocked()) return false;
      if (s.clampDown) { say('Release the clamp before changing the lift.', 'warn'); commit(); return false; }
      const nv = clamp(Math.round(sheets), 5, maxSheets);
      if (nv === s.liftSheets) return false;
      s.liftSheets = nv; commit();
      return true;
    },

    rotate(times = 1) {
      if (blocked() || !s.table) return false;
      if (s.clampDown) { say('Release the clamp before turning the lift.', 'warn'); commit(); return false; }
      for (let i = 0; i < times; i++) s.table = rotateStack(s.table);
      s.jogged = false; startClock(); commit();
      return true;
    },

    beginCut() {
      if (blocked()) return false;
      if (!s.table) { say('Nothing on the table. Load a piece from the tray.', 'warn'); commit(); return false; }
      if (!s.clampDown) { say('Clamp the lift before cutting (W).', 'warn'); commit(); return false; }
      s.busy = true; s.anim.cutAt = now(); startClock(); commit();
      return true;
    },

    /** The blade comes down. Returns a summary of what happened. */
    cut() {
      const st = s.table;
      if (!st || !s.clampDown) return null;
      let err = 0;
      if (!s.jogged) err = (rng() < 0.5 ? -1 : 1) * (0.03 + rng() * 0.045);
      const g = r3(s.gauge + err);
      const pieces = cutStack(st, g);
      if (!pieces) {
        s.cuts++;
        say('Air cut. The lift sits behind the blade — bring the gauge forward.', 'warn');
        commit();
        return { air: true };
      }
      // A pile taller than the lift setting takes several passes; tall passes spoil sheets.
      const pileSheets = st.layers.length * job.sheets;
      const passes = Math.ceil(pileSheets / s.liftSheets);
      const passSheets = Math.min(s.liftSheets, pileSheets);
      s.cuts += passes;
      s.ops++;
      s.extraMs += (passes - 1) * 5000;
      const spoiledBefore = spoiled();
      s.maxPass = Math.max(s.maxPass, passSheets);
      // Dull blade / grooved stick / shallow depth: bottom sheets of every pass fray or stay uncut.
      const fray = fraySheets(machine);
      if (fray) s.frayMax = Math.max(s.frayMax, fray * passes);
      const causes = fray ? frayCause(machine) : [];
      wear(machine, stock.id, pileSheets * stock.caliper, passes);
      const spoiledNow = spoiled();
      s.cutLines.push(...cutSegments(st, g));
      s.anim.fall = { stack: pieces.front, at: now() };
      const rb = sortStack(pieces.back), rf = sortStack(pieces.front);
      s.table = rb.stack;
      if (!s.table) s.jogged = false;
      if (rf.stack) {
        if (!s.table) { s.table = rf.stack; s.jogged = false; }
        else s.tray.push(rf.stack);
      }
      const good = rb.good + rf.good, scrap = rb.scrap + rf.scrap, ruined = rb.ruined + rf.ruined;
      const errs = rb.errs.concat(rf.errs);
      const parts = [];
      let kind = '';
      if (passes > 1) parts.push(`${passes} passes.`);
      if (err) { parts.push(`Lift wasn't ${s.curled ? 'decurled' : 'jogged'}, so the cut wandered ${frac(Math.abs(err))}".`); kind = 'warn'; }
      if (fray) {
        parts.push(`Bottom ${fray} sheet${fray > 1 ? 's' : ''} of each pass came out frayed — ${causes.join(' and ')}.`);
        kind = 'bad';
      }
      if (spoiledNow > spoiledBefore && !fray) {
        const what = stock.slip && passSheets > stock.slipFrom ? 'clamp-marked or crept' : 'clamp-marked';
        parts.push(`${passSheets}-sheet lift: ~${spoiledNow} sheets now ${what}.`);
        kind = kind || 'warn';
      }
      if (good) {
        const e = Math.max(...errs);
        parts.push(`+${(good * (job.sheets - spoiledNow)).toLocaleString()} ${unit}${e <= 1 / 128 ? ', dead on' : `, ${frac(e)}" off`}.`);
        kind = kind || 'good';
      }
      if (ruined) { parts.push(`${(ruined * job.sheets).toLocaleString()} ${unit} ruined — the blade went through artwork.`); kind = 'bad'; }
      if (!good && !ruined && scrap) parts.push('Trim strip dropped.');
      if (!good && !ruined && !scrap) parts.push('Clean cut. Pieces with work left are on the table and tray.');
      say(parts.join(' '), kind);
      commit();
      return { air: false, good, scrap, ruined, err, passes };
    },

    afterCut() {
      s.busy = false; s.clampDown = false;
      if (!s.done && !s.table && !s.tray.length) { s.done = true; s.tEnd = now(); }
      commit();
    },

    compat(i) { return compat(s.table, s.tray[i]); },

    loadPiece(i) {
      if (blocked() || !s.tray[i]) return false;
      const p = s.tray.splice(i, 1)[0];
      if (s.table) s.tray.push(s.table);
      s.table = p; s.clampDown = false; s.jogged = false; startClock(); commit();
      return true;
    },

    addToLift(i) {
      if (blocked() || !s.tray[i]) return false;
      const c = compat(s.table, s.tray[i]);
      if (!c.ok) { say(c.why + '.', 'warn'); commit(); return false; }
      let p = s.tray.splice(i, 1)[0];
      if (c.swap) p = rotateStack(p);
      s.table = { ...s.table, layers: [...s.table.layers, ...p.layers] };
      s.clampDown = false; s.jogged = false; startClock();
      const n = s.table.layers.length, np = passesFor(s.table);
      say(`Pile is now ${n} strips (${(n * job.sheets).toLocaleString()} sheets)${np > 1 ? `, ${np} passes per cut at your lift` : ''}. Jog it before cutting.`);
      commit();
      return true;
    },

    get machine() { return machine; },

    /** Turn the cutting stick to a fresh face (4 faces), between cuts. */
    rotateStick() {
      if (blocked() || s.clampDown) return false;
      if (machine.stickFace >= STICK_FACES) { say('All four faces of the stick are used. Replace it.', 'warn'); commit(); return false; }
      machine.stickFace++; machine.stickWear = 0; s.extraMs += 30000;
      say(`Cutting stick turned to face ${machine.stickFace} of ${STICK_FACES}.`, 'good'); commit();
      return true;
    },

    replaceStick() {
      if (blocked() || s.clampDown) return false;
      machine.stickFace = 1; machine.stickWear = 0; s.extraMs += 60000;
      say('New cutting stick in.', 'good'); commit();
      return true;
    },

    /** Finish a blade change (see bladechange.js). */
    installBlade({ depth = 0, violations = 0 } = {}) {
      machine.bladeWear = 0; machine.depth = depth; machine.blades = (machine.blades || 1) + 1;
      s.safety += violations; s.extraMs += 120000;
      say(violations ? `New blade in, with ${violations} safety violation${violations > 1 ? 's' : ''} logged.` : 'New blade in. Sharp and set right.', violations ? 'warn' : 'good');
      commit();
      return true;
    },

    /** Show a message from the UI layer (e.g. a bad typed measurement). */
    notify(msg, kind = '') { say(msg, kind); commit(); },

    summary() { return summarize({ s, job, order, delivered: delivered(), spoiled: spoiled() }); },

    restart() {
      s = fresh();
      say('New run. ' + intro());
      commit();
    },
  };
  return game;
}

/** Par: let the hint engine play the job at the stock's default lift, plus a little slack. */
export function computePar(job) {
  const sim = createGame({ ...job, par: { cuts: 0, timeMs: 0 } }, { rng: () => 0.5, now: () => 0 });
  autoplay(sim);
  const { cuts, ops } = sim.state;
  // ~12 s per cut cycle a person performs, ~5 s for each extra machine pass.
  return { cuts: cuts + 2, timeMs: 60000 + ops * 12000 + (cuts - ops) * 5000 };
}
