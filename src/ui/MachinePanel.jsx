import { useEffect, useRef, useState } from 'react';
import { clamp, frac, parseIn } from '../core/geometry.js';
import { GAUGE_MIN, GAUGE_MAX } from '../core/game.js';
import { useCanvasView } from './hooks.js';
import { keys, moveGauge, doJog, doClamp, requestCut } from './control.js';

export default function MachinePanel({ game, s, viewRef }) {
  const cv = useRef(null);
  useCanvasView(cv, viewRef, (w) => w * 0.6);
  return (
    <section className="machine" aria-label="Machine">
      <div className="panel">
        <h2>Machine <em>front view</em></h2>
        <canvas ref={cv} id="frontCv" />
      </div>
      <div className="panel controls">
        <h2>Back gauge <em>↑↓ 1/16 · Shift 1/64</em></h2>
        <Gauge game={game} s={s} />
        <Nudges game={game} />
        <div className="actions">
          <button className="btn" type="button" onClick={() => doJog(game)}>Jog lift <kbd>Q</kbd></button>
          <button className={'btn' + (s.clampDown ? ' on' : '')} type="button" onClick={() => doClamp(game)}>
            {s.clampDown ? 'Release' : 'Clamp'} <kbd>W</kbd>
          </button>
          <button className="btn" type="button" onClick={() => game.rotate(1)}>Rotate 90° <kbd>R</kbd></button>
          <button className="btn" type="button" onClick={() => game.rotate(2)}>Turn 180° <kbd>T</kbd></button>
        </div>
        <CutButtons game={game} />
      </div>
    </section>
  );
}

function Gauge({ game, s }) {
  const [text, setText] = useState(null); // null = not editing
  const last = useRef(null);
  const commit = () => {
    if (text === null) return;
    const v = parseIn(text);
    if (Number.isNaN(v)) game.notify('Type a measurement like 16.75 or 16 3/4.', 'warn');
    else if (v < GAUGE_MIN || v > GAUGE_MAX) game.notify(`The gauge travels from ${frac(GAUGE_MIN)}" to ${frac(GAUGE_MAX)}".`, 'warn');
    else game.setGauge(v);
    setText(null);
  };
  const angle = (e, el) => { const r = el.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)); };
  const lift = s.table ? (s.table.layers.length * game.lift).toFixed(1) : '0.0';
  return (
    <div className="readout">
      <div className="lcd">
        <label htmlFor="gaugeInput">Gauge to blade · inches</label>
        <input
          id="gaugeInput" inputMode="decimal" autoComplete="off" spellCheck="false"
          value={text ?? s.gauge.toFixed(3)}
          onFocus={(e) => { setText(s.gauge.toFixed(3)); requestAnimationFrame(() => e.target.select()); }}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setText(null); e.currentTarget.blur(); } }}
        />
        <div className="sub"><span>{frac(s.gauge)}"</span><span>LIFT {lift}/{game.job.maxLift}</span></div>
      </div>
      <div
        className="wheel" tabIndex={0} role="slider" aria-label="Gauge hand wheel"
        aria-valuemin={GAUGE_MIN} aria-valuemax={GAUGE_MAX} aria-valuenow={s.gauge}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); last.current = angle(e, e.currentTarget); }}
        onPointerMove={(e) => {
          if (last.current === null) return;
          const a = angle(e, e.currentTarget);
          let d = a - last.current;
          if (d > Math.PI) d -= 2 * Math.PI;
          if (d < -Math.PI) d += 2 * Math.PI;
          last.current = a;
          moveGauge(game, game.state.gauge + d / (2 * Math.PI)); // one turn = 1"
        }}
        onPointerUp={() => { last.current = null; }}
        onPointerCancel={() => { last.current = null; }}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 1 / 64 : 1 / 16;
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); moveGauge(game, game.state.gauge + step); }
          if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); moveGauge(game, game.state.gauge - step); }
        }}
      >
        <svg viewBox="-60 -60 120 120" aria-hidden="true">
          <circle r="57" fill="#2b3035" stroke="#4a5157" strokeWidth="3" />
          <g transform={`rotate(${(s.gauge * 360) % 360})`}>
            <circle r="44" fill="none" stroke="#596168" strokeWidth="7" />
            <line x1="0" y1="-44" x2="0" y2="44" stroke="#596168" strokeWidth="6" />
            <line x1="-38" y1="22" x2="38" y2="-22" stroke="#596168" strokeWidth="6" />
            <line x1="-38" y1="-22" x2="38" y2="22" stroke="#596168" strokeWidth="6" />
            <circle cx="0" cy="-40" r="9" fill="#f2c230" stroke="#111214" strokeWidth="2" />
          </g>
          <circle r="12" fill="#c3c9cd" stroke="#111214" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}

const STEPS = [[-1, '−1'], [-0.125, '−⅛'], [-1 / 64, '−1/64'], [1 / 64, '+1/64'], [0.125, '+⅛'], [1, '+1']];

function Nudges({ game }) {
  const timers = useRef({});
  const stop = () => { clearTimeout(timers.current.to); clearInterval(timers.current.iv); };
  useEffect(() => stop, []);
  return (
    <div className="nudges">
      {STEPS.map(([step, label]) => (
        <button
          key={label} className="btn" type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            moveGauge(game, game.state.gauge + step);
            timers.current.to = setTimeout(() => { timers.current.iv = setInterval(() => moveGauge(game, game.state.gauge + step), 70); }, 380);
          }}
          onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); moveGauge(game, game.state.gauge + step); } }}
        >{label}</button>
      ))}
    </div>
  );
}

/** Two-hand cut: both buttons (or F + J) held 0.22 s. A mouse can hold one for 0.65 s. */
function CutButtons({ game }) {
  const L = useRef(new Set()), R = useRef(new Set());
  const mouseStart = useRef(0);
  const lRef = useRef(null), rRef = useRef(null);

  useEffect(() => {
    let raf, holdStart = 0, latch = false;
    const frame = (t) => {
      const l = L.current.size > 0 || keys.f, r = R.current.size > 0 || keys.j;
      let prog = 0;
      if (l && r) { if (!holdStart) holdStart = t; prog = (t - holdStart) / 220; }
      else { holdStart = 0; if (mouseStart.current) prog = (t - mouseStart.current) / 650; }
      if (prog >= 1 && !latch) { latch = true; requestCut(game); }
      if (!l && !r) latch = false;
      const pv = latch ? 1 : clamp(prog, 0, 1);
      if (lRef.current) { lRef.current.style.setProperty('--p', pv); lRef.current.classList.toggle('down', l); }
      if (rRef.current) { rRef.current.style.setProperty('--p', pv); rRef.current.classList.toggle('down', r); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [game]);

  const handlers = (set) => ({
    onPointerDown: (e) => {
      e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); set.current.add(e.pointerId);
      if (e.pointerType === 'mouse') mouseStart.current = performance.now();
    },
    onPointerUp: (e) => { set.current.delete(e.pointerId); if (e.pointerType === 'mouse') mouseStart.current = 0; },
    onPointerCancel: (e) => { set.current.delete(e.pointerId); mouseStart.current = 0; },
    onLostPointerCapture: (e) => { set.current.delete(e.pointerId); if (e.pointerType === 'mouse') mouseStart.current = 0; },
    onContextMenu: (e) => e.preventDefault(),
    onKeyDown: (e) => { if (e.key === 'Enter') { e.preventDefault(); requestCut(game); } },
  });

  return (
    <div className="cutrow">
      <button ref={lRef} className="cutbtn" type="button" aria-label="Left cut button" {...handlers(L)}>CUT<small>F</small></button>
      <div className="cutmid"><b>TWO-HAND CUT</b>Hold both buttons.<br />Mouse: hold one.</div>
      <button ref={rRef} className="cutbtn" type="button" aria-label="Right cut button" {...handlers(R)}>CUT<small>J</small></button>
    </div>
  );
}
