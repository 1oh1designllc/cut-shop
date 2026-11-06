/**
 * sheetArt.js — draws the printed press sheet and lifts of paper.
 * Placeholder artwork until the final card design is supplied.
 * All drawing is in inches; `px` is CSS pixels per inch (for line widths/text).
 */
import { inv } from '../core/geometry.js';
import { assets } from '../assets/loader.js';
import { jobArtSlot } from '../assets/registry.js';

const INK = { block: '#1d6e78', logo: '#f2c230', text: '#e9f1ef', textDim: 'rgba(233,241,239,.55)' };

export function drawSheetArt(ctx, px, game, { guides = true } = {}) {
  const { layout, job } = game;
  const { w: CW, h: CH } = job.finished;
  const lw = 1 / px;
  const pb = layout.printBlock;
  const art = assets.art[jobArtSlot(job)]; // Jude's design for this job type, trim + bleed
  if (!art) {
    // Placeholder artwork, laid out in proportion to the piece so every job type reads.
    ctx.fillStyle = job.ink || INK.block;
    ctx.fillRect(pb.x, pb.y, pb.w, pb.h);
  }
  for (const k of layout.cards) {
    const x = k.x0, y = k.y0, m = Math.min(CW, CH);
    if (art) {
      ctx.drawImage(art, x - job.bleed, y - job.bleed, CW + 2 * job.bleed, CH + 2 * job.bleed);
      if (guides) {
        ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = lw; ctx.setLineDash([4 * lw, 3 * lw]);
        ctx.strokeRect(x, y, CW, CH); ctx.restore();
      }
      continue;
    }
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(x + CW * 0.857, y - job.bleed, CW * 0.063, CH + 2 * job.bleed);
    ctx.fillStyle = INK.logo; ctx.beginPath(); ctx.arc(x + CW * 0.13, y + CH * 0.26, m * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = INK.text; ctx.fillRect(x + CW * 0.243, y + CH * 0.19, CW * 0.457, CH * 0.075);
    ctx.fillStyle = INK.textDim; ctx.fillRect(x + CW * 0.243, y + CH * 0.31, CW * 0.286, CH * 0.04);
    ctx.fillRect(x + CW * 0.086, y + CH * 0.69, CW * 0.443, CH * 0.035); ctx.fillRect(x + CW * 0.086, y + CH * 0.78, CW * 0.329, CH * 0.035);
    // finishing marks: score line (greeting cards), fold lines (brochures)
    if (job.art === 'greeting' || job.art === 'brochure') {
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.2 * lw; ctx.setLineDash([2 * lw, 3 * lw]);
      ctx.beginPath();
      if (job.art === 'greeting') { ctx.moveTo(x + CW / 2, y); ctx.lineTo(x + CW / 2, y + CH); }
      else { for (const f of [1 / 3, 2 / 3]) { ctx.moveTo(x, y + CH * f); ctx.lineTo(x + CW, y + CH * f); } }
      ctx.stroke(); ctx.restore();
    }
    if (guides) {
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = lw; ctx.setLineDash([4 * lw, 3 * lw]);
      ctx.strokeRect(x, y, CW, CH); ctx.restore();
    }
  }
  // crop marks in the margins
  const { w: SW, h: SH } = job.sheet;
  ctx.strokeStyle = '#111'; ctx.lineWidth = Math.max(lw * 0.8, 0.008);
  ctx.beginPath();
  const topEnd = layout.my - job.bleed - 0.125, botStart = SH - layout.my + job.bleed + 0.125;
  const leftEnd = layout.mx - job.bleed - 0.0625, rightStart = SW - layout.mx + job.bleed + 0.0625;
  for (const x of layout.xs) { ctx.moveTo(x, topEnd - 0.45); ctx.lineTo(x, topEnd); ctx.moveTo(x, botStart); ctx.lineTo(x, botStart + 0.45); }
  for (const y of layout.ys) { ctx.moveTo(leftEnd - 0.25, y); ctx.lineTo(leftEnd, y); ctx.moveTo(rightStart, y); ctx.lineTo(rightStart + 0.25, y); }
  ctx.stroke();
  // colour bar + slug line in the head margin
  ['#00a0e0', '#e0007a', '#ffe000', '#111111'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(SW - 2.8 + i * 0.42, 0.16, 0.38, 0.26); });
  const fs = 0.15 * px;
  if (fs >= 5) {
    ctx.save(); ctx.scale(1 / px, 1 / px); ctx.fillStyle = '#333';
    ctx.font = `500 ${fs}px "IBM Plex Sans Condensed", sans-serif`; ctx.textBaseline = 'middle';
    const slug = `JOB ${job.id} · ${job.title.toUpperCase()} · ${job.cols * job.rows}-UP · ${game.stock.name.toUpperCase()} · ${SW}×${SH}`;
    ctx.fillText(slug, 0.3 * px, 0.3 * px);
    ctx.restore();
  }
}

/** Draw a lift with its top layer's artwork. T maps local inches → device pixels. */
export function drawStack(ctx, st, T, px, game, opts, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.setTransform(...T);
  const n = st.layers.length;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0.14, 0.14, st.W, st.D);
  for (let i = n - 1; i >= 1; i--) { ctx.fillStyle = '#d9d7d0'; ctx.fillRect(0.06 * i, 0.06 * i, st.W, st.D); }
  ctx.fillStyle = '#f7f6f2'; ctx.fillRect(0, 0, st.W, st.D);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, st.W, st.D); ctx.clip();
  ctx.transform(...inv(st.layers[n - 1])); drawSheetArt(ctx, px, game, opts); ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1 / px; ctx.strokeRect(0, 0, st.W, st.D);
  ctx.restore();
}

/** Small preview of a tray piece. */
export function drawThumb(cv, st, game, opts) {
  const w = cv.clientWidth || 140, h = cv.clientHeight || 84, dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const ctx = cv.getContext('2d');
  const s = Math.min((w - 12) / st.W, (h - 12) / st.D);
  const ox = (w - st.W * s) / 2, oy = (h - st.D * s) / 2;
  drawStack(ctx, st, [dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy], s, game, opts);
}
