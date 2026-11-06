/**
 * BladeChange.jsx — the blade-change mini-game (Jude's procedure, core/bladechange.js).
 * Tap bolts on the diagram; buttons for the other steps; test cuts to set the depth.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createBladeChange, BOLTS, ORDER } from '../core/bladechange.js';
import { sfx } from '../audio/sfx.js';
import { assets } from '../assets/loader.js';

/** Jude's art for a blade-change slot if supplied, else the drawn placeholder. */
const Art = ({ slot, x, y, width, height, children }) =>
  assets.artUrl[slot] ? <image href={assets.artUrl[slot]} x={x} y={y} width={width} height={height} preserveAspectRatio="none" /> : children;

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
  const act = (fn, sound = 'bolt') => { const ok = fn(); if (ok && sound) sfx[sound](); if (!ok) sfx.beep(); render((n) => n + 1); };

  const boltTappable = ['slotted', 'handles', 'bolts', 'snug', 'depth', 'tighten', 'slotback'].includes(st.step);
  const oldIn = !at(st, 'move');          // old blade in the machine until it's lifted out
  const newIn = at(st, 'snug');           // new blade fitted from 'fit' onwards
  const handlesInMachine = (st.handles === 'old' && !at(st, 'move')) || (st.handles === 'new' && at(st, 'snug'));
  const liveFor = (b, state) =>
    (st.step === 'slotted' && b.slotted && state === 'tight') ||
    (st.step === 'bolts' && !b.slotted && state === 'tight') ||
    (st.step === 'snug' && !b.slotted && state === 'out') ||
    (st.step === 'tighten' && !b.slotted && state === 'snug') ||
    (st.step === 'slotback' && b.slotted && state === 'out');
  const total = ORDER.length - 1;

  return (
    <div className="modal">
      <div className="rcard bladecard" role="dialog" aria-labelledby="bcTitle">
        <div className="bchead">
          <h3 id="bcTitle">Blade change</h3>
          <span className="bcstep">Step {Math.min(ORDER.indexOf(st.step) + 1, total)} / {total}</span>
        </div>
        <p className={'bcmsg' + (st.violations.length && st.message === st.violations[st.violations.length - 1] ? ' bad' : '')} aria-live="polite">{st.message}</p>

        <svg className="bcsvg" viewBox="0 0 360 250" role="img" aria-label="Blade, bolts and blade board">
          <rect x="10" y="40" width="340" height="50" rx="4" fill="#5a6268" />
          <text x="16" y="34" fill="#9ba2a7" fontSize="10" fontFamily="Saira Condensed, sans-serif" letterSpacing="1.5">BLADE CARRIER</text>
          {/* blade in the machine */}
          {(oldIn || newIn) && (
            <g>
              <Art slot="bc.blade" x="14" y="90" width="332" height="26">
                <rect x="14" y="90" width="332" height="26" fill={newIn ? '#e3e8eb' : '#b9c0c5'} />
                <rect x="14" y="112" width="332" height="4" fill={newIn ? '#ffffff' : '#9aa1a6'} />
              </Art>
              {!newIn && <text x="300" y="106" fill="#5a6268" fontSize="9" fontFamily="Share Tech Mono, monospace">OLD</text>}
            </g>
          )}
          {/* bolts */}
          {BOLTS.map((b, i) => {
            const state = st.bolts[b.id];
            const x = boltX(i);
            const live = boltTappable && liveFor(b, state);
            return (
              <g
                key={b.id} className={'bolt' + (live ? ' live' : '')} tabIndex={boltTappable ? 0 : -1} role="button"
                aria-label={`${b.slotted ? 'Slotted bolt' : 'Bolt'} ${b.id}, ${state}`}
                onClick={() => act(() => bc.bolt(b.id))}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(() => bc.bolt(b.id)); } }}
              >
                {b.slotted && !assets.artUrl['bc.bolt-slotted'] && <rect x={x - 6} y={49} width="12" height="32" rx="6" fill="#2a2e32" />}
                {live && <circle cx={x} cy="65" r="17" fill="none" stroke="#4fd1ff" strokeWidth="2" />}
                {state === 'out'
                  ? <circle cx={x} cy="65" r="9" fill="#17191b" stroke="#3a4045" />
                  : <g>
                    {assets.artUrl[b.slotted ? 'bc.bolt-slotted' : 'bc.bolt']
                      ? <image href={assets.artUrl[b.slotted ? 'bc.bolt-slotted' : 'bc.bolt']} x={b.slotted ? x - 8 : x - 11} y={b.slotted ? 45 : 54} width={b.slotted ? 16 : 22} height={b.slotted ? 40 : 22} preserveAspectRatio="none" />
                      : <circle cx={x} cy="65" r="11" fill="#c3c9cd" stroke="#111214" strokeWidth="1.5" />}
                    <polygon points={[0, 1, 2, 3, 4, 5].map((k) => `${x + 5 * Math.cos(k * Math.PI / 3)},${65 + 5 * Math.sin(k * Math.PI / 3)}`).join(' ')} fill="#5a6268" />
                    {state === 'snug' && <circle cx={x} cy="65" r="13.5" fill="none" stroke="#f2c230" strokeWidth="2" strokeDasharray="3 3" />}
                  </g>}
                <circle cx={x} cy="65" r="20" fill="transparent" />
              </g>
            );
          })}
          {/* hex handles in the slotted spots */}
          {handlesInMachine && BOLTS.map((b, i) => b.slotted && (
            <g key={'h' + b.id}>
              <Art slot="bc.handle" x={boltX(i) - 10} y="2" width="20" height="64">
                <rect x={boltX(i) - 3} y="6" width="6" height="58" fill="#2a2e32" />
                <rect x={boltX(i) - 16} y="2" width="32" height="8" rx="3" fill="#f2c230" />
              </Art>
            </g>
          ))}
          {/* blade board */}
          <Art slot="bc.board" x="10" y="150" width="340" height="66"><rect x="10" y="150" width="340" height="66" rx="4" fill="#c79a5b" /></Art>
          <text x="18" y="166" fill="#6b4a1e" fontSize="11" fontFamily="Saira Condensed, sans-serif" letterSpacing="2">BLADE BOARD</text>
          {!at(st, 'snug') && (
            <g>
              <Art slot="bc.blade" x="24" y="176" width="312" height="22">
                <rect x="24" y="176" width="312" height="22" fill="#e3e8eb" />
                <rect x="24" y="194" width="312" height="4" fill="#ffffff" />
              </Art>
              <text x="290" y="191" fill="#5a6268" fontSize="9" fontFamily="Share Tech Mono, monospace">NEW</text>
              {st.handles === 'new' && BOLTS.map((b, i) => b.slotted && (
                <g key={'nh' + b.id}><Art slot="bc.handle" x={boltX(i) - 10} y="146" width="20" height="40"><rect x={boltX(i) - 3} y="150" width="6" height="34" fill="#2a2e32" /><rect x={boltX(i) - 16} y="146" width="32" height="8" rx="3" fill="#f2c230" /></Art></g>
              ))}
            </g>
          )}
          {at(st, 'move') && (
            <g>
              <Art slot="bc.blade" x="24" y="224" width="312" height="8"><rect x="24" y="224" width="312" height="8" fill="#b9c0c5" /></Art>
              <text x="26" y="245" fill="#9ba2a7" fontSize="9" fontFamily="Share Tech Mono, monospace">OLD BLADE · LAID FLAT</text>
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
              <button className="btn small" type="button" onClick={() => act(() => bc.adjust(-1), 'wheel')}>Shallower</button>
              <button className="btn small" type="button" onClick={() => act(() => bc.adjust(+1), 'wheel')}>Deeper</button>
              <button className="btn small primary" type="button" onClick={() => act(() => bc.testCut(), 'testCut')}>Test cut</button>
            </div>
            {st.lastTest && <div className={'depthres ' + (st.lastTest === 'right' ? 'ok' : 'warn')}>{st.lastTest === 'right' ? 'Clean cut.' : st.lastTest === 'shallow' ? 'Bottom sheets uncut.' : 'Biting the stick.'}</div>}
          </div>
        )}

        <div className="bcactions">
          {st.step === 'lock' && <HoldButton ms={1200} onDone={() => act(() => bc.lock(), 'lockDown')}>Hold both CUT buttons to lock the blade down</HoldButton>}
          {st.step === 'handles' && <button className="btn primary" type="button" onClick={() => act(() => bc.attachHandles(), 'handle')}>Screw in the hex handles</button>}
          {st.step === 'lift' && <button className="btn primary" type="button" onClick={() => act(() => bc.liftOld(), 'bladeSet')}>Lift the old blade out, lay it flat</button>}
          {st.step === 'move' && <button className="btn primary" type="button" onClick={() => act(() => bc.moveHandles(), 'handle')}>Move the handles to the new blade</button>}
          {st.step === 'fit' && <button className="btn primary" type="button" onClick={() => act(() => bc.fitNew(), 'bladeSet')}>Lift the new blade in, lock the handles</button>}
          {st.step === 'unhandle' && <button className="btn primary" type="button" onClick={() => act(() => bc.removeHandles(), 'handle')}>Unscrew the hex handles</button>}
          {st.step === 'release' && <button className="btn primary" type="button" onClick={() => act(() => bc.release(), 'bladeSet')}>Release the blade</button>}
          {st.step === 'done' && <button className="btn primary" type="button" onClick={() => onDone({ depth: st.depth, violations: st.violations.length })}>Back to cutting</button>}
          {st.step === 'lock' && <button className="btn small" type="button" onClick={onCancel}>Not now</button>}
        </div>
        {st.violations.length > 0 && <div className="bcviol">Safety violations: {st.violations.length}</div>}
      </div>
    </div>
  );
}
