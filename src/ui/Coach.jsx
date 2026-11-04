/**
 * Coach.jsx — tutorial steps (coach mode) or a one-line next-cut hint.
 * Lives inside the table view's HUD.
 */
import { frac } from '../core/geometry.js';

const turnLabel = (r) => (r === 2 ? 'Turn 180°' : r === 1 ? 'Rotate 90°' : 'Rotate 90° ×3');

function steps(h, s) {
  if (h.action === 'add') return [{ label: 'Tray → Add to lift', done: false }];
  if (h.action === 'load') return [{ label: 'Tray → Load', done: false }];
  const list = [];
  if (h.rotate) list.push({ label: turnLabel(h.rotate), done: false });
  const ready = !h.rotate;
  list.push({ label: `Gauge ${frac(h.gauge)}"`, done: ready && Math.abs(s.gauge - h.gauge) < 0.0005 });
  if (s.curled) list.push({ label: 'Decurl', done: false });
  list.push({ label: 'Jog', done: ready && s.jogged });
  list.push({ label: 'Clamp', done: ready && s.clampDown });
  list.push({ label: 'Cut', done: false });
  return list;
}

export default function Coach({ hint, s, mode }) {
  if (!hint || !mode) return null;
  const list = steps(hint, s);
  const now = list.findIndex((x) => !x.done);
  if (mode === 'hint') {
    return (
      <div className="coach hintline">
        <b>NEXT</b> {list.filter((x) => !x.done).map((x) => x.label).join(' · ')}
      </div>
    );
  }
  const clampedWrong = s.clampDown && hint.action === 'cut' && (hint.rotate || Math.abs(s.gauge - hint.gauge) >= 0.0005 || !s.jogged);
  return (
    <div className="coach">
      <div className="coach-why">{hint.why}</div>
      <ol className="coach-steps">
        {list.map((x, i) => (
          <li key={x.label} className={x.done ? 'done' : i === now ? 'now' : ''}>{x.done ? '✓ ' : ''}{x.label}</li>
        ))}
      </ol>
      {clampedWrong && <div className="coach-warn">Release the clamp first.</div>}
    </div>
  );
}
