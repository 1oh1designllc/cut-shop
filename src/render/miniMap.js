/**
 * miniMap.js — the press sheet on the job ticket, with cuts made so far,
 * finished/ruined cards, what's on the table (yellow) and in the tray (dashed).
 */
import { sheetRect } from '../core/stack.js';
import { drawSheetArt } from './sheetArt.js';

export function drawMini(view, game) {
  const { ctx, w, h, dpr } = view;
  const s = game.state, { w: SW, h: SH } = game.job.sheet;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
  const k = Math.min(w / SW, h / SH), ox = (w - SW * k) / 2, oy = (h - SH * k) / 2;
  ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * ox, dpr * oy);
  ctx.fillStyle = '#f7f6f2'; ctx.fillRect(0, 0, SW, SH);
  drawSheetArt(ctx, k, game, { guides: false });
  ctx.fillStyle = 'rgba(95,208,138,.75)';
  for (const r of s.goodRects) ctx.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
  ctx.fillStyle = 'rgba(239,90,79,.55)';
  for (const id of s.ruined) { const c = game.layout.cards[id]; ctx.fillRect(c.x0, c.y0, c.x1 - c.x0, c.y1 - c.y0); }
  const lw = 1 / k;
  ctx.strokeStyle = 'rgba(235,232,225,.8)'; ctx.lineWidth = lw; ctx.setLineDash([3 * lw, 2 * lw]);
  for (const p of s.tray) for (const m of p.layers) { const r = sheetRect(p, m); ctx.strokeRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0); }
  ctx.setLineDash([]);
  if (s.table) {
    ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 2.5 * lw;
    for (const m of s.table.layers) { const r = sheetRect(s.table, m); ctx.strokeRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0); }
  }
  ctx.strokeStyle = '#ff3b30'; ctx.lineWidth = 1.4 * lw; ctx.beginPath();
  for (const c of s.cutLines) { ctx.moveTo(c[0], c[1]); ctx.lineTo(c[2], c[3]); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = lw; ctx.strokeRect(0, 0, SW, SH);
}
