/**
 * frontView.js — the machine seen from the operator's position.
 * Placeholder vector drawing, modelled on the reference videos: slotted back-gauge
 * fingers, clamp bar, bolted blade, light-curtain posts.
 */
import { lerp, ease } from '../core/geometry.js';
import { assets } from '../assets/loader.js';

export function createFrontRenderer() {
  let clampPos = 0;
  return function drawFront(view, game, t, opts) {
    const s = game.state, LIFT = game.lift, MAXLIFT = game.job.maxLift;
    // Height of the pass actually under the clamp (a taller pile is cut in several passes).
    const passH = (st) => Math.min(st.layers.length * LIFT, s.liftSheets * game.stock.caliper);
    const { ctx, w, h, dpr } = view;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const k = w / 25, vy = k * 1.45, tableY = h * 0.76, X = (x) => k * 1.5 + x * k, topH = h * 0.12;
    const A = assets.art; // Jude's art for any slot that has it; placeholders otherwise
    if (A['front.backdrop']) ctx.drawImage(A['front.backdrop'], 0, 0, w, h);
    else {
      ctx.fillStyle = '#101214'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2b3034'; ctx.fillRect(k * 0.9, topH, w - k * 1.8, tableY - topH);
    }
    // back gauge fingers: closer to the blade = brighter and taller
    const near = 1 - s.gauge / 22;
    const fh = (tableY - topH) * (0.55 + 0.4 * near);
    const lum = Math.round(110 + near * 90);
    ctx.fillStyle = `rgb(${lum},${lum + 4},${lum + 8})`;
    for (let x = 0.4; x < 21.5; x += 2.4) {
      const fw = k * (0.55 + 0.3 * near);
      if (A['front.finger']) ctx.drawImage(A['front.finger'], X(x), tableY - fh, fw, fh);
      else ctx.fillRect(X(x), tableY - fh, fw, fh);
    }
    // table
    if (A['front.table']) ctx.drawImage(A['front.table'], 0, tableY, w, h - tableY);
    else {
      const tg = ctx.createLinearGradient(0, tableY, 0, h); tg.addColorStop(0, '#b4bbc0'); tg.addColorStop(1, '#7c858b');
      ctx.fillStyle = tg; ctx.fillRect(0, tableY, w, h - tableY);
      ctx.strokeStyle = 'rgba(0,0,0,.16)'; ctx.lineWidth = 2;
      for (let x = -6; x < 32; x += 2.2) { ctx.beginPath(); ctx.moveTo(X(x), tableY); ctx.lineTo(X(x) + (X(x) - w / 2) * 0.7, h); ctx.stroke(); }
    }
    // lift
    let stackTop = tableY;
    if (s.table) {
      const n = s.table.layers.length, sw = Math.min(s.table.W, 22) * k, sh = passH(s.table) * vy;
      let jx = 0;
      if (s.anim.jogAt && !opts.reduceMotion) { const tt = (t - s.anim.jogAt) / 350; if (tt < 1) jx = Math.sin(tt * 40) * 4 * (1 - tt); }
      const x0 = X(0) + jx, y0 = tableY - sh; stackTop = y0;
      const sg = ctx.createLinearGradient(x0, 0, x0 + sw, 0); sg.addColorStop(0, '#ffffff'); sg.addColorStop(1, '#dcdad4');
      ctx.fillStyle = sg; ctx.fillRect(x0, y0, sw, sh);
      ctx.fillStyle = 'rgba(0,0,0,.05)'; for (let y = y0 + 2; y < tableY; y += 3) ctx.fillRect(x0, y, sw, 1);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 1; i < n && i * LIFT * vy < sh; i++) ctx.fillRect(x0, y0 + i * LIFT * vy, sw, 1.5);
      ctx.fillRect(x0 + sw, y0 + 3, 4, sh - 3);
    }
    // front piece falling away
    if (s.anim.fall && !opts.reduceMotion) {
      const tt = (t - s.anim.fall.at) / 600;
      if (tt < 1) {
        const st = s.anim.fall.stack, sw = Math.min(st.W, 22) * k, sh = passH(st) * vy;
        ctx.save(); ctx.globalAlpha = 1 - tt; ctx.fillStyle = '#f4f3ef';
        ctx.fillRect(X(0) - tt * 8, tableY - sh + tt * tt * h * 0.45, sw + tt * 16, sh * (1 + tt * 1.6)); ctx.restore();
      }
    }
    // clamp
    const clampIdle = tableY - (MAXLIFT + 0.55) * vy;
    const target = s.clampDown || s.busy ? 1 : 0;
    clampPos += (target - clampPos) * (opts.reduceMotion ? 1 : 0.22);
    const clampY = lerp(clampIdle, stackTop, clampPos);
    ctx.fillStyle = '#5c656c'; ctx.fillRect(X(2), topH, k * 0.5, clampY - topH); ctx.fillRect(X(19.5), topH, k * 0.5, clampY - topH);
    if (A['front.clamp']) ctx.drawImage(A['front.clamp'], X(-0.8), clampY - 0.9 * vy, 23.4 * k, 0.9 * vy);
    else {
      const cg = ctx.createLinearGradient(0, clampY - 0.9 * vy, 0, clampY); cg.addColorStop(0, '#8a939a'); cg.addColorStop(1, '#5a6268');
      ctx.fillStyle = cg; ctx.fillRect(X(-0.8), clampY - 0.9 * vy, 23.4 * k, 0.9 * vy);
    }
    // blade
    let p = 0;
    if (s.anim.cutAt) {
      const el = t - s.anim.cutAt, hit = s.anim.hitMs, end = s.anim.endMs;
      const start = Math.min(hit * 0.45, 700), dwell = Math.min(150, (end - hit) * 0.2); // clamp lands first, then the blade travels
      if (el < start) p = 0;
      else if (el < hit) p = ease((el - start) / (hit - start));
      else if (el < hit + dwell) p = 1;
      else if (el < end) p = 1 - ease((el - hit - dwell) / (end - hit - dwell));
    }
    const bIdle = clampIdle - 0.9 * vy - 4, bBot = lerp(bIdle, tableY + 2, p), sx = -k * 1.1 * p;
    if (A['front.blade']) ctx.drawImage(A['front.blade'], X(-1) + sx, topH, 23.6 * k, bBot - topH);
    else {
    const bg = ctx.createLinearGradient(0, topH, 0, bBot); bg.addColorStop(0, '#6d767c'); bg.addColorStop(0.85, '#cfd5d9'); bg.addColorStop(1, '#f3f5f6');
    ctx.fillStyle = bg; ctx.beginPath();
    ctx.moveTo(X(-1) + sx, topH); ctx.lineTo(X(22.6) + sx, topH); ctx.lineTo(X(22.6) + sx, bBot - k * 0.7); ctx.lineTo(X(-1) + sx, bBot); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 6; i++) {
      const bx = X(0.8 + i * 4) + sx, by = lerp(topH + 10, bBot - k * 0.7 * (i / 6) - 10, 0.45);
      ctx.fillStyle = '#2a2f33'; ctx.beginPath(); ctx.arc(bx, by, k * 0.32, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9aa2a8'; ctx.beginPath(); ctx.arc(bx, by, k * 0.14, 0, Math.PI * 2); ctx.fill();
    }
    }
    // housing with hazard stripe
    if (A['front.housing']) ctx.drawImage(A['front.housing'], 0, 0, w, topH);
    else {
    ctx.fillStyle = '#262a2e'; ctx.fillRect(0, 0, w, topH);
    ctx.save(); ctx.beginPath(); ctx.rect(0, topH - 7, w, 7); ctx.clip();
    ctx.fillStyle = '#f2c230';
    for (let x = -20; x < w + 20; x += 14) { ctx.beginPath(); ctx.moveTo(x, topH); ctx.lineTo(x + 7, topH); ctx.lineTo(x + 14, topH - 7); ctx.lineTo(x + 7, topH - 7); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = '#9ba2a7'; ctx.font = `600 ${Math.max(10, k * 0.55)}px "Saira Condensed", sans-serif`; ctx.textBaseline = 'middle';
    ctx.fillText('CS-78  HYDRAULIC GUILLOTINE', k * 0.8, topH / 2 - 2);
    }
    // light curtain posts
    const led = s.busy ? '#ff3b30' : '#5fd08a';
    for (const px of [k * 0.15, w - k * 0.75]) {
      if (A['front.post']) {
        ctx.save();
        if (px > w / 2) { ctx.translate(px + k * 0.6, topH); ctx.scale(-1, 1); ctx.drawImage(A['front.post'], 0, 0, k * 0.6, tableY - topH); }
        else ctx.drawImage(A['front.post'], px, topH, k * 0.6, tableY - topH);
        ctx.restore();
      } else { ctx.fillStyle = '#1c1f22'; ctx.fillRect(px, topH, k * 0.6, tableY - topH); }
      ctx.fillStyle = led; for (let y = topH + 8; y < tableY - 4; y += 10) ctx.fillRect(px + k * 0.22, y, k * 0.16, 3);
    }
    ctx.fillStyle = '#5a6268'; ctx.fillRect(0, tableY - 2, w, 3);
  };
}
