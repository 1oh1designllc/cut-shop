/**
 * sfx.js — game sounds. Plays Jude's recordings when a slot has files
 * (see src/assets/registry.js), otherwise the synthesized placeholders.
 * Browsers only allow audio after a tap/click, so init() runs on first pointerdown.
 */
import { assets } from '../assets/loader.js';

const buffers = {}; // url → AudioBuffer | Promise
let idleNode = null;
let wheelNode = null, wheelTimer = 0;

/** Mix levels for Jude's recordings (all were loudness-matched on import). */
const LEVEL = { 'cut-thick': 1, 'cut-thin': 0.75, 'clamp-down': 0.7, 'clamp-up': 0.6, 'trim-fall': 0.8, jog: 0.85, wheel: 0.5, bolt: 0.8, 'blade-set': 0.8, handle: 0.7, beep: 0.6 };

export const sfx = {
  on: true,
  ctx: null,
  init() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* no audio */ }
      if (this.ctx) this.preload();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },

  /** Decode every recorded take up front so the first play isn't silent. */
  preload() {
    for (const urls of Object.values(assets.sounds)) for (const u of urls) this.buffer(u);
    if (assets.sounds.idle?.length) setTimeout(() => this.startIdle(), 300);
  },
  buffer(url) {
    if (buffers[url]) return buffers[url];
    buffers[url] = fetch(url).then((r) => r.arrayBuffer()).then((b) => this.ctx.decodeAudioData(b))
      .then((buf) => (buffers[url] = buf)).catch(() => (buffers[url] = null));
    return buffers[url];
  },
  playBuffer(buf, gain = 1, loop = false, vary = false) {
    const c = this.ctx, src = c.createBufferSource(), g = c.createGain();
    src.buffer = buf; src.loop = loop; g.gain.value = gain;
    if (vary) src.playbackRate.value = 0.96 + Math.random() * 0.08; // so repeats of one take don't sound identical
    src.connect(g); g.connect(c.destination); src.start();
    return { src, g };
  },

  /** Play a recorded slot if it has a decoded take; otherwise run the fallback synth. */
  play(slot, fallback, gain = 1) {
    const c = this.init(); if (!c || !this.on) return;
    const urls = assets.sounds[slot];
    if (urls?.length) {
      const buf = buffers[urls[Math.floor(Math.random() * urls.length)]];
      if (buf && !(buf instanceof Promise)) { this.playBuffer(buf, gain * (LEVEL[slot] ?? 1), false, true); return; }
    }
    if (fallback) fallback.call(this);
  },

  startIdle() {
    const urls = assets.sounds.idle;
    if (!urls?.length || idleNode || !this.ctx) return;
    const buf = buffers[urls[0]];
    if (!buf || buf instanceof Promise) { setTimeout(() => this.startIdle(), 500); return; }
    idleNode = this.playBuffer(buf, this.on ? 0.25 : 0, true);
  },
  setOn(on) {
    this.on = on;
    if (idleNode) idleNode.g.gain.value = on ? 0.25 : 0;
  },

  // ---- synthesized placeholders ----
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
  flutter() { this.noise(0.25, 1800, 'highpass', 0.12); },

  // ---- game events (recorded slot → placeholder) ----
  cut(thick) { this.play(thick ? 'cut-thick' : 'cut-thin', this.thunk); },
  clampDown() { this.play('clamp-down', this.hiss); },
  clampUp() { this.play('clamp-up', this.hiss); },
  trimFall() { this.play('trim-fall', this.flutter); },
  jog() { this.play('jog', this.rattle); },
  /** Hand wheel: Jude's recording loops while the gauge keeps moving; else a tick per 1/16". */
  wheel(crossed) {
    const c = this.init(); if (!c || !this.on) return;
    const url = assets.sounds.wheel?.[0], buf = url && buffers[url];
    if (buf && !(buf instanceof Promise)) {
      if (!wheelNode) {
        wheelNode = this.playBuffer(buf, 0, true);
        wheelNode.src.loopStart = 0; wheelNode.src.loopEnd = buf.duration;
        wheelNode.g.gain.setTargetAtTime(LEVEL.wheel, c.currentTime, 0.03);
      }
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        const n = wheelNode; wheelNode = null;
        n.g.gain.setTargetAtTime(0, c.currentTime, 0.04); n.src.stop(c.currentTime + 0.25);
      }, 180);
      return;
    }
    if (crossed) this.tick();
  },
  beep() { this.play('beep', function () { this.tone(880, 0.12, 0.08, 'square'); }); },
  bolt() { this.play('bolt', this.tick); },
  bladeSet() { this.play('blade-set', this.hiss); },
  handle() { this.play('handle', this.tick); },
  lockDown() { this.play('cut-thick', this.thunk); },
  testCut() { this.play('cut-thin', this.thunk); },
};
