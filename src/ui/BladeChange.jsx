/**
 * BladeChange.jsx — the blade-change mini-game (Jude's procedure, core/bladechange.js).
 * Tap bolts on the diagram; buttons for the other steps; test cuts to set the depth.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createBladeChange, BOLTS } from '../core/bladechange.js';
import { sfx } from '../audio/sfx.js';

const ORDER = ['lock', 'bolts', 'handles', 'slotted', 'lift', 'fit', 'snug', 'depth', 'tighten', 'release', 'done'];
const at = (st, step) => ORDER.indexOf(st.step) >= ORDER.indexOf(step);
const boltX = (i) => 30 + i * 43;

function HoldButton({ ms, onDone, children }) {
  const [p, setP] = useState(0);
  const t0 = useRef(0), raf = useRef(0);
  const stop = () => { cancelAnimationFrame(raf.current); t0.current = 0; setP(0); };
  const tick = (t) => {
    if (!t0.current) return;
    const v = Math.min(1, (t - t0.current) / ms);
    setP(v);
    if (v >= 1) { t0.current = 0; onDone(); return; }
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return (
    <button
      className="btn holdbtn" type="button" style={{ '--p': p }}
      onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); t0.current = performance.now(); raf.current = requestAnimationFrame(tick); }}
      onPointerUp={stop} onPointerCancel={stop}
      onKeyDown={(e) => { if (e.key === 'Enter') onDone(); }}
    >{children}</button>
  );
}

export default function BladeChange({ onCancel, onDone }) {
  const bc = useMemo(() => createBladeChange(), []);
  const [, render] = useState(0);
  const st = bc.state;
  const act = (fn, sound = 'tick') => { const ok = fn(); if (ok && sound) sfx[sound](); if (!ok) sfx.noise(0.12, 400, 'lowpass', 0.4); render((n) => n + 1); };

  const boltTappable = ['bolts', 'handles', 'slotted', 'snug', 'tighten', 'depth'].includes(st.step);
  const oldIn = !at(st, 'fit');
  const newIn = at(st, 'snug');
  const handlesUp = st.handles && (st.step === 'slotted' || st.step === 'lift');

  return (
    <div className="modal">
      <div className="rcard bladecard" role="dialog" aria-labelledby="bcTitle">
        <div className="bchead">
          <h3 id="bcTitle">Blade change</h3>
          <span className="bcstep">Step {Math.min(ORDER.indexOf(st.step) + 1, 10)} / 10</span>
        </div>
        <p className={'bcmsg' + (st.violations.length && st.message === st.violations[st.violations.length - 1] ? ' bad' : '')} aria-live="polite">{st.message}</p>

        <svg className="bcsvg" viewBox="0 0 360 230" role="img" aria-label="Blade, bolts and blade board">
          <rect x="10" y="40" width="340" height="50" rx="4" fill="#5a6268" />
          <text x="16" y="34" fill="#9ba2a7" fontSize="10" fontFamily="Saira Condensed, sans-serif" letterSpacing="1.5">BLADE CARRIER</text>
          {/* blade in the machine */}
          {(oldIn || newIn) && (
            <g>
              <rect x="14" y="90" width="332" height="26" fill={newIn ? '#e3e8eb' : '#b9c0c5'} />
              <rect x="14" y="112" width="332" height="4" fill={newIn ? '#ffffff' : '#9aa1a6'} />
              {!newIn && <text x="300" y="106" fill="#5a6268" fontSize="9" fontFamily="Share Tech Mono, monospace">OLD</text>}
            </g>
          )}
          {/* bolts */}
          {BOLTS.map((b, i) => {
            const state = st.bolts[b.id];
            const x = boltX(i);
            const live = boltTappable && ((['bolts', 'handles', 'slotted'].includes(st.step) && state === 'tight') || (st.step === 'snug' && state === 'out') || (st.step === 'tighten' && state === 'snug'));
            return (
              <g
                key={b.id} className={'bolt' + (live ? ' live' : '')} tabIndex={boltTappable ? 0 : -1} role="button"
                aria-label={`${b.slotted ? 'Slotted bolt' : 'Bolt'} ${b.id}, ${state}`}
                onClick={() => act(() => bc.bolt(b.id))}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(() => bc.bolt(b.id)); } }}
              >
                {b.slotted && <rect x={x - 15} y={59} width="30" height="12" rx="6" fill="#2a2e32" />}
                {live && <circle cx={x} cy="65" r="17" fill="none" stroke="#4fd1ff" strokeWidth="2" />}
                {state === 'out'
                  ? <circle cx={x} cy="65" r="9" fill="#17191b" stroke="#3a4045" />
                  : <g>
                    <circle cx={x} cy="65" r="11" fill="#c3c9cd" stroke="#111214" strokeWidth="1.5" />
                    <polygon points={[0, 1, 2, 3, 4, 5].map((k) => `${x + 5 * Math.cos(k * Math.PI / 3)},${65 + 5 * Math.sin(k * Math.PI / 3)}`).join(' ')} fill="#5a6268" />
                    {state === 'snug' && <circle cx={x} cy="65" r="13.5" fill="none" stroke="#f2c230" strokeWidth="2" strokeDasharray="3 3" />}
                  </g>}
                <circle cx={x} cy="65" r="20" fill="transparent" />
              </g>
            );
          })}
          {/* hex handles in the slots */}
          {handlesUp && BOLTS.map((b, i) => b.slotted && (
            <g key={'h' + b.id}>
              <rect x={boltX(i) - 3} y="6" width="6" height="58" fill="#2a2e32" />
              <rect x={boltX(i) - 16} y="2" width="32" height="8" rx="3" fill="#f2c230" />
            </g>
          ))}
          {/* blade board */}
          <rect x="10" y="150" width="340" height="66" rx="4" fill="#c79a5b" />
          <text x="18" y="166" fill="#6b4a1e" fontSize="11" fontFamily="Saira Condensed, sans-serif" letterSpacing="2">BLADE BOARD</text>
          {!at(st, 'snug') && (
            <g>
              <rect x="24" y="176" width="312" height="22" fill="#e3e8eb" />
              <rect x="24" y="194" width="312" height="4" fill="#ffffff" />
              <text x="290" y="191" fill="#5a6268" fontSize="9" fontFamily="Share Tech Mono, monospace">NEW</text>
            </g>
          )}
          {at(st, 'fit') && (
            <g>
              <rect x="24" y="176" width="312" height="22" fill="#b9c0c5" />
              <text x="290" y="191" fill="#5a6268" fontSize="9" fontFamily="Share Tech Mono, monospace">OLD</text>
            </g>
          )}
        </svg>

        {st.step === 'depth' && (
          <div className="depthbox">
            <svg viewBox="0 0 200 90" className="depthsvg" role="img" aria-label="Side view of blade depth">
              {[0, 1, 2, 3, 4].map((k) => <rect key={k} x="20" y={20 + k * 8} width="160" height="6" fill="#f4f3ef" />)}
              <rect x="20" y="62" width="160" height="14" fill="#c8a8e8" />
              <text x="24" y="73" fontSize="8" fill="#4a3a60" fontFamily="Share Tech Mono, monospace">CUTTING STICK</text>
              <polygon points={`100,${62 + st.depth * 5} 92,6 108,6`} fill="#cfd5d9" stroke="#5a6268" />
            </svg>
            <div className="depthbtns">
              <button className="btn small" type="button" onClick={() => act(() => bc.adjust(-1))}>Shallower</button>
              <button className="btn small" type="button" onClick={() => act(() => bc.adjust(+1))}>Deeper</button>
              <button className="btn small primary" type="button" onClick={() => act(() => bc.testCut(), 'thunk')}>Test cut</button>
            </div>
            {st.lastTest && <div className={'depthres ' + (st.lastTest === 'right' ? 'ok' : 'warn')}>{st.lastTest === 'right' ? 'Clean cut.' : st.lastTest === 'shallow' ? 'Bottom sheets uncut.' : 'Biting the stick.'}</div>}
          </div>
        )}

        <div className="bcactions">
          {st.step === 'lock' && <HoldButton ms={1200} onDone={() => act(() => bc.lock(), 'thunk')}>Hold both CUT buttons to lock the blade down</HoldButton>}
          {st.step === 'handles' && <button className="btn primary" type="button" onClick={() => act(() => bc.attachHandles())}>Screw in the hex handles</button>}
          {st.step === 'lift' && <button className="btn primary" type="button" onClick={() => act(() => bc.liftOld(), 'hiss')}>Lift the old blade out</button>}
          {st.step === 'fit' && <button className="btn primary" type="button" onClick={() => act(() => bc.fitNew(), 'hiss')}>Fit the new blade from the board</button>}
          {st.step === 'release' && <button className="btn primary" type="button" onClick={() => act(() => bc.release(), 'hiss')}>Release the blade</button>}
          {st.step === 'done' && <button className="btn primary" type="button" onClick={() => onDone({ depth: st.depth, violations: st.violations.length })}>Back to cutting</button>}
          {st.step === 'lock' && <button className="btn small" type="button" onClick={onCancel}>Not now</button>}
        </div>
        {st.violations.length > 0 && <div className="bcviol">Safety violations: {st.violations.length}</div>}
      </div>
    </div>
  );
}
