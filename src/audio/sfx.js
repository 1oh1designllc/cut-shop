/**
 * sfx.js — synthesized placeholder sounds (Web Audio).
 * Phase 4 replaces these with recordings of the real cutter.
 * Browsers only allow audio after a tap/click, so init() runs on first pointerdown.
 */
export const sfx = {
  on: true,
  ctx: null,
  init() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* no audio */ } }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  noise(dur, freq, type, gain) {
    const c = this.init(); if (!c || !this.on) return;
    const len = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = c.createBufferSource(); src.buffer = b;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = c.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(c.destination); src.start();
  },
  tone(freq, dur, gain, type = 'sine') {
    const c = this.init(); if (!c || !this.on) return;
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(gain, c.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  },
  thunk() { this.noise(0.35, 650, 'lowpass', 0.9); this.tone(58, 0.32, 0.6); },
  hiss() { this.noise(0.35, 2600, 'bandpass', 0.22); },
  tick() { this.tone(1900, 0.02, 0.04, 'square'); },
  rattle() { for (let i = 0; i < 4; i++) setTimeout(() => this.noise(0.05, 1100, 'bandpass', 0.35), i * 70); },
};
