/**
 * tableView.js — top-down view of the cutter table.
 * World coords (inches): X across from the side guide, Y from the blade
 * (negative = behind the blade, toward the back gauge).
 */
import { frac, mul } from '../core/geometry.js';
import { drawStack } from './sheetArt.js';

function drawScene(ctx, V, px, t, game, opts, loupe) {
  const s = game.state;
  ctx.save(); ctx.setTransform(...V);
  const lw = 1 / px, g = s.gauge;
  ctx.fillStyle = '#2f3438'; ctx.fillRect(-1.6, -21, 23.4, 31);
  ctx.fillStyle = '#4a5157'; ctx.fillRect(-1, -20, 22, 20);
  ctx.fillStyle = '#8d969c'; ctx.fillRect(-1, 0, 22, 9.3);
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  for (let x = 0.75; x < 21; x += 1.5) for (let y = 0.9; y < 9.2; y += 1.5) { ctx.beginPath(); ctx.arc(x, y, 0.07, 0, Math.PI * 2); ctx.fill(); }
  // side guide with ruler
  ctx.fillStyle = '#c3c9cd'; ctx.fillRect(-0.5, -20, 0.5, 29.3);
  ctx.strokeStyle = '#2a2e32'; ctx.lineWidth = lw; ctx.beginPath();
  for (let y = 0; y <= 20; y += 0.5) { const L = y % 1 === 0 ? 0.3 : 0.15; ctx.moveTo(-L, -y); ctx.lineTo(0, -y); }
  ctx.stroke();
  // back gauge
  ctx.fillStyle = '#1d2023'; ctx.fillRect(0, -g - 0.9, 21, 0.9);
  ctx.fillStyle = '#353b40'; for (let x = 0.6; x < 21; x += 1.2) ctx.fillRect(x, -g - 0.9, 0.5, 0.9);
  ctx.fillStyle = '#f2c230'; ctx.fillRect(0, -g - 0.07, 21, 0.07);
  // lift
  if (s.table) {
    let jx = 0;
    if (s.anim.jogAt && !opts.reduceMotion) { const tt = (t - s.anim.jogAt) / 350; if (tt < 1) jx = Math.sin(tt * 40) * 0.08 * (1 - tt); }
    drawStack(ctx, s.table, mul(V, [1, 0, 0, 1, jx, -g]), px, game, opts);
  }
  // front piece sliding away after a cut
  if (s.anim.fall && !opts.reduceMotion) {
    const tt = (t - s.anim.fall.at) / 650;
    if (tt < 1) drawStack(ctx, s.anim.fall.stack, mul(V, [1, 0, 0, 1, 0, tt * tt * 5]), px, game, opts, 1 - tt);
  }
  ctx.setTransform(...V);
  // clamp footprint
  ctx.fillStyle = s.clampDown || s.busy ? 'rgba(17,18,20,.45)' : 'rgba(17,18,20,.14)';
  ctx.fillRect(-0.5, -1.3, 21.5, 1.15);
  ctx.strokeStyle = 'rgba(17,18,20,.6)'; ctx.lineWidth = lw; ctx.strokeRect(-0.5, -1.3, 21.5, 1.15);
  // cut line
  ctx.strokeStyle = 'rgba(255,59,48,.28)'; ctx.lineWidth = 7 * lw; ctx.beginPath(); ctx.moveTo(-0.5, 0); ctx.lineTo(21, 0); ctx.stroke();
  ctx.strokeStyle = '#ff3b30'; ctx.lineWidth = (loupe ? 1 : 1.6) * lw; ctx.beginPath(); ctx.moveTo(-0.5, 0); ctx.lineTo(21, 0); ctx.stroke();
  if (!loupe) {
    const X = opts.dimX ?? 20.3, ah = 0.3;
    ctx.strokeStyle = '#f2c230'; ctx.fillStyle = '#f2c230'; ctx.lineWidth = 1.2 * lw;
    ctx.beginPath(); ctx.moveTo(X, -g); ctx.lineTo(X, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X, -g); ctx.lineTo(X - ah * 0.5, -g + ah); ctx.lineTo(X + ah * 0.5, -g + ah); ctx.fill();
    ctx.beginPath(); ctx.moveTo(X, 0); ctx.lineTo(X - ah * 0.5, -ah); ctx.lineTo(X + ah * 0.5, -ah); ctx.fill();
    ctx.save(); ctx.translate(X - 0.25, -g / 2); ctx.rotate(-Math.PI / 2); ctx.scale(lw, lw);
    ctx.font = '600 13px "Share Tech Mono", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#f2c230';
    ctx.fillText(frac(g) + '"', 0, 0); ctx.restore();
    ctx.save(); ctx.translate(X + 0.6, 0.5); ctx.scale(lw, lw); ctx.font = '600 11px "Saira Condensed", sans-serif';
    ctx.textAlign = 'right'; ctx.fillStyle = '#ff6a60'; ctx.fillText('CUT LINE', 0, 0);
    ctx.fillStyle = 'rgba(17,18,20,.7)'; ctx.fillText('OPERATOR ▼', 0, 8.2 / lw); ctx.restore();
    ctx.strokeStyle = 'rgba(235,232,225,.9)'; ctx.lineWidth = 1.2 * lw;
    ctx.beginPath(); ctx.arc(opts.loupeX, 0, 0.45, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

/** @returns {{ s: number, ox: number, oy: number }} view mapping, for pointer → world */
export function drawTable(view, game, t, opts) {
  const { ctx, w, h, dpr } = view;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
  // Camera: the whole table, or (opts.fit, phones) framed on the lift, gauge and cut line.
  const st = game.state, tb = st.table;
  let target = { cx: 10, cy: -5.5, sw: 23, sh: 30.2 };
  opts.dimX = 20.3;
  if (opts.fit && tb) {
    const x0 = -0.7, x1 = Math.max(tb.W, 3) + 1.2;
    const y0 = -st.gauge - 1.1, y1 = Math.max(tb.D - st.gauge, 0) + 1.0;
    target = { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, sw: x1 - x0, sh: y1 - y0 };
    opts.dimX = Math.min(20.3, Math.max(tb.W, 3) + 0.5);
  }
  if (!opts.cam || opts.reduceMotion) opts.cam = { ...target };
  else for (const key of ['cx', 'cy', 'sw', 'sh']) opts.cam[key] += (target[key] - opts.cam[key]) * 0.18;
  const cam = opts.cam;
  const s = Math.min(w / cam.sw, h / cam.sh);
  const ox = w / 2 - cam.cx * s, oy = h / 2 - cam.cy * s;
  drawScene(ctx, [dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy], s, t, game, opts, false);
  // loupe
  const R = opts.fit ? Math.min(76, w * 0.19) : Math.max(54, Math.min(84, w * 0.15)), cx = w - R - 14, cy = h - R - 26, k = 150;
  ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
  drawScene(ctx, [dpr * k, 0, 0, dpr * k, dpr * (cx - opts.loupeX * k), dpr * cy], k, t, game, opts, true);
  ctx.restore();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.strokeStyle = '#111214'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#c3c9cd'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R + 3, 0, Math.PI * 2); ctx.stroke();
  return { s, ox, oy };
}
