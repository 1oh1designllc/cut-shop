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
import { STOCKS } from './stocks.js';
import { summarize } from './scoring.js';

export const GAUGE_MIN = 0.5;
export const GAUGE_MAX = 19.5;

/**
 * @param {object} job one of JOBS
 * @param {{ rng?: () => number, now?: () => number }} [opts] injectable for tests
 */
export function createGame(job, opts = {}) {
  const rng = opts.rng || Math.random;
  const now = opts.now || (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
  const stock = STOCKS[job.stock];
  const layout = buildLayout(job);
  const lift = job.sheets * stock.caliper;
  const total = layout.cards.length * job.sheets;
  const unit = job.unit || 'cards';
  const listeners = new Set();
  let evtId = 0;
  let s, snap;

  function fresh() {
    return {
      gauge: job.startGauge, clampDown: false, jogged: false, busy: false, done: false,
      table: createStack(job.sheet.w, job.sheet.h), tray: [],
      goodLayers: 0, errs: [], goodRects: [], scrapLayers: 0, ruined: new Set(),
      cuts: 0, cutLines: [], t0: 0, tEnd: 0,
      anim: { jogAt: 0, cutAt: 0, fall: null },
      event: null,
    };
  }
  const commit = () => { snap = { ...s }; listeners.forEach((fn) => fn()); };
  const say = (msg, kind = '') => { s.event = { id: ++evtId, msg, kind }; };
  const startClock = () => { if (!s.t0) s.t0 = now(); };
  const blocked = () => s.busy || s.done;

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
    job, stock, layout, lift, total,
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
      s.jogged = true; s.anim.jogAt = now(); startClock(); commit();
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
      s.cuts++;
      const pieces = cutStack(st, g);
      if (!pieces) {
        say('Air cut. The lift sits behind the blade — bring the gauge forward.', 'warn');
        commit();
        return { air: true };
      }
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
      if (err) { parts.push(`Lift wasn't jogged, so the cut wandered ${frac(Math.abs(err))}".`); kind = 'warn'; }
      if (good) {
        const e = Math.max(...errs);
        parts.push(`+${(good * job.sheets).toLocaleString()} ${unit}${e <= 1 / 128 ? ', dead on' : `, ${frac(e)}" off`}.`);
        kind = kind || 'good';
      }
      if (ruined) { parts.push(`${(ruined * job.sheets).toLocaleString()} ${unit} ruined — the blade went through artwork.`); kind = 'bad'; }
      if (!good && !ruined && scrap) parts.push('Trim strip dropped.');
      if (!good && !ruined && !scrap) parts.push('Clean cut. Pieces with work left are on the table and tray.');
      say(parts.join(' '), kind);
      commit();
      return { air: false, good, scrap, ruined, err };
    },

    afterCut() {
      s.busy = false; s.clampDown = false;
      if (!s.done && !s.table && !s.tray.length) { s.done = true; s.tEnd = now(); }
      commit();
    },

    compat(i) { return compat(s.table, s.tray[i], lift, job.maxLift); },

    loadPiece(i) {
      if (blocked() || !s.tray[i]) return false;
      const p = s.tray.splice(i, 1)[0];
      if (s.table) s.tray.push(s.table);
      s.table = p; s.clampDown = false; s.jogged = false; startClock(); commit();
      return true;
    },

    addToLift(i) {
      if (blocked() || !s.tray[i]) return false;
      const c = compat(s.table, s.tray[i], lift, job.maxLift);
      if (!c.ok) { say(c.why + '.', 'warn'); commit(); return false; }
      let p = s.tray.splice(i, 1)[0];
      if (c.swap) p = rotateStack(p);
      s.table = { ...s.table, layers: [...s.table.layers, ...p.layers] };
      s.clampDown = false; s.jogged = false; startClock();
      say(`Lift is now ${s.table.layers.length} high (${(s.table.layers.length * lift).toFixed(1)}"). Jog it before cutting.`);
      commit();
      return true;
    },

    /** Show a message from the UI layer (e.g. a bad typed measurement). */
    notify(msg, kind = '') { say(msg, kind); commit(); },

    summary() { return summarize(s, job, total); },

    restart() {
      s = fresh();
      say('New run. ' + intro());
      commit();
    },
  };
  return game;
}
