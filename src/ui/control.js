/**
 * control.js — glue between input, sound and the game: keyboard bindings,
 * the timed cut sequence, and gauge moves with a tick sound.
 */
import { sfx } from '../audio/sfx.js';

/** Live state of the F / J cut keys (read by the cut buttons each frame). */
export const keys = { f: false, j: false };

/** Move the gauge; ticks once per 1/16" crossed. */
export function moveGauge(game, v) {
  const before = game.state.gauge;
  if (game.setGauge(v)) sfx.wheel(Math.floor(game.state.gauge * 16) !== Math.floor(before * 16));
}

export function doJog(game) { if (game.jog()) sfx.jog(); }
export function doClamp(game) { if (game.toggleClamp()) (game.state.clampDown ? sfx.clampDown() : sfx.clampUp()); }

/** Blade down at 330 ms (pieces split), back up and clamp released at 820 ms. */
export function requestCut(game) {
  if (!game.beginCut()) { sfx.beep(); return; }
  const st = game.state.table;
  const passInches = Math.min(game.state.liftSheets, st.layers.length * game.job.sheets) * game.stock.caliper;
  setTimeout(() => {
    sfx.cut(passInches >= 1.0);
    const r = game.cut();
    if (r && !r.air) setTimeout(() => sfx.trimFall(), 160);
  }, 330);
  setTimeout(() => { game.afterCut(); sfx.clampUp(); }, 820);
}

export function bindKeyboard(game) {
  const down = (e) => {
    const k = e.key.toLowerCase();
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT') {
      // The gauge box only takes numbers, so machine keys still work from it:
      // type 9 1/8, then press Q to jog. Leaving the box commits the number first.
      if (!(e.target.id === 'gaugeInput' && ['q', 'w', 'r', 't', 'f', 'j'].includes(k))) return;
      e.preventDefault();
      e.target.blur();
    }
    if (k === 'f' || k === 'j') { keys[k] = true; return; }
    const repeatable = ['arrowup', 'arrowdown', 'pageup', 'pagedown'].includes(k);
    if (e.repeat && !repeatable) return;
    if (k === 'q') doJog(game);
    else if (k === 'w') doClamp(game);
    else if (k === 'r') game.rotate(1);
    else if (k === 't') game.rotate(2);
    else if (e.target.closest && e.target.closest('.wheel')) return; // the wheel handles its own arrows
    else if (k === 'arrowup') { e.preventDefault(); moveGauge(game, game.state.gauge + (e.shiftKey ? 1 / 64 : 1 / 16)); }
    else if (k === 'arrowdown') { e.preventDefault(); moveGauge(game, game.state.gauge - (e.shiftKey ? 1 / 64 : 1 / 16)); }
    else if (k === 'pageup') { e.preventDefault(); moveGauge(game, game.state.gauge + 1); }
    else if (k === 'pagedown') { e.preventDefault(); moveGauge(game, game.state.gauge - 1); }
  };
  const up = (e) => { const k = e.key.toLowerCase(); if (k === 'f' || k === 'j') keys[k] = false; };
  const blur = () => { keys.f = keys.j = false; };
  document.addEventListener('keydown', down);
  document.addEventListener('keyup', up);
  window.addEventListener('blur', blur);
  return () => {
    document.removeEventListener('keydown', down);
    document.removeEventListener('keyup', up);
    window.removeEventListener('blur', blur);
  };
}
