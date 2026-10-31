import { useEffect, useRef, useState } from 'react';
import { clamp, frac } from '../core/geometry.js';
import { useCanvasView } from './hooks.js';

const tableHeight = (w) => Math.min(w * 1.3, Math.max(460, window.innerHeight * 0.84));

export default function TablePanel({ game, s, viewRef, opts }) {
  const cv = useRef(null);
  useCanvasView(cv, viewRef, tableHeight);

  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!s.event) return;
    setToast({ ...s.event, show: true });
    const id = setTimeout(() => setToast((t) => (t ? { ...t, show: false } : t)), 2800);
    return () => clearTimeout(id);
  }, [s.event]);

  const t = s.table;
  const chip = t
    ? `${frac(t.W)} × ${frac(t.D)}" · ${t.layers.length} lift${t.layers.length > 1 ? 's' : ''} · ${(t.layers.length * game.lift).toFixed(1)}" high`
    : s.tray.length ? 'Table empty — load a piece from the tray' : 'Table empty';

  const moveLoupe = (e) => {
    const m = opts.current.tableMap; if (!m) return;
    const r = cv.current.getBoundingClientRect();
    opts.current.loupeX = clamp((e.clientX - r.left - m.ox) / m.s, -0.4, 20.8);
  };

  return (
    <section className="panel tablepanel" aria-label="Cutting table, top view">
      <div className="tablewrap">
        <canvas ref={cv} id="tableCv" onPointerDown={moveLoupe} />
        <div className="hud">
          <div className="chip">{chip}</div>
          <div className="lights">
            <span className={'light ' + (t ? (s.jogged ? 'on' : 'warn') : '')}>{t && !s.jogged ? 'NOT JOGGED' : 'JOGGED'}</span>
            <span className={'light ' + (s.clampDown ? 'on' : '')}>{s.clampDown ? 'CLAMPED' : 'CLAMP UP'}</span>
          </div>
        </div>
        <div id="toast" role="status" aria-live="polite" className={(toast?.show ? 'show ' : '') + (toast?.kind || '')}>{toast?.msg}</div>
        <div className="loupe-label">Loupe · tap table to move</div>
      </div>
    </section>
  );
}
