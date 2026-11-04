import { useEffect, useRef } from 'react';
import { frac } from '../core/geometry.js';
import { drawMini } from '../render/miniMap.js';
import { useCanvasView } from './hooks.js';
import { JOBS } from '../core/jobs.js';
import { fmtTime } from './Header.jsx';
import LiftControl from './LiftControl.jsx';

export default function Ticket({ game, s, guides, onGuides, play, showLift = false }) {
  const { job, stock, layout } = game;
  const cv = useRef(null), view = useRef(null);
  const redraw = () => { if (view.current) drawMini(view.current, game); };
  useCanvasView(cv, view, (w) => w * (job.sheet.h / job.sheet.w), redraw);
  useEffect(redraw, [s]);
  useEffect(() => { document.fonts?.ready.then(redraw); }, []);

  const n = job.cols * job.rows;
  const best = play.bests[job.id];
  const specs = [
    ['Item', job.title + (job.note ? ` — ${job.note}` : '')],
    ['Stock', `${stock.name} (${stock.caliper.toFixed(4).replace(/^0/, '').replace(/0$/, '')}")`],
    ['Order', `${game.order.toLocaleString()} ${job.unit || 'cards'}`],
    ['Run', `${job.sheets} press sheets (${Math.max(0, job.sheets - Math.ceil(game.order / n))} overs)`],
    ['Press sheet', `${job.sheet.w} × ${job.sheet.h}"`],
    ['Finished', `${frac(job.finished.w)} × ${frac(job.finished.h)}", ${n}-up (${job.cols} × ${job.rows})`],
    ['Gutters', `${frac(job.gutter)}" (${frac(job.bleed)}" bleed each side)`],
    ['Margins', `${frac(layout.mx)}" sides · ${frac(layout.my)}" head & foot`],
    ['Tolerance', `± ${frac(job.tolerance)}"`],
    ['Clamp opening', `${frac(job.maxLift)}" (${game.maxSheets} sheets)`],
  ];

  return (
    <aside className="panel ticket" aria-label="Job ticket">
      <div className="jobpick">
        <label htmlFor="jobSelect">Job</label>
        <select id="jobSelect" value={play.jobId} onChange={(e) => play.chooseJob(e.target.value)}>
          {JOBS.map((j) => (
            <option key={j.id} value={j.id}>{j.label}{play.bests[j.id] ? `  —  best ${play.bests[j.id].grade}` : ''}</option>
          ))}
          {play.random && <option value={play.random.id}>{play.random.label}</option>}
          <option value="random">＋ New random job…</option>
        </select>
      </div>
      <div className="jobhead"><strong>Job ticket</strong><span>#{job.id}</span></div>
      {best && <div className="bestline">Your best: <b>{best.grade}</b> · {best.good.toLocaleString()} good · {best.cuts} cuts · {fmtTime(best.ms)}</div>}
      {stock.notes.length > 0 && <ul className="stocknotes">{stock.notes.map((x) => <li key={x}>{x}</li>)}</ul>}
      {showLift && <LiftControl game={game} s={s} />}
      <dl className="specs">
        {specs.map(([k, v]) => [<dt key={k + 't'}>{k}</dt>, <dd key={k + 'd'}>{v}</dd>])}
      </dl>
      <div>
        <div className="minibox"><canvas ref={cv} id="miniCv" aria-label="Press sheet with cuts so far" /></div>
        <div className="legend">
          <span><i style={{ background: '#ff3b30' }} />Cuts</span>
          <span><i style={{ background: '#f2c230' }} />On table</span>
          <span><i style={{ background: '#5fd08a' }} />Finished</span>
        </div>
      </div>
      <div className="toggles">
        <label><input type="checkbox" id="guidesChk" checked={guides} onChange={(e) => onGuides(e.target.checked)} /> Show trim guides</label>
        <label>
          <input type="checkbox" id="hintChk" checked={job.coach || play.showHint} disabled={!!job.coach} onChange={(e) => play.setShowHint(e.target.checked)} />
          {' '}Show next-cut hint{job.coach ? ' (always on in the tutorial)' : ''}
        </label>
      </div>
      <div>
        <h2 style={{ marginBottom: 6 }}>How to cut</h2>
        <ol className="how">
          <li><b>Set the gauge.</b> Turn the wheel or type a number. The red line is where the blade drops; the lift's front edge sticks out past it.</li>
          <li><b>Jog</b> the lift square against the gauge. Skip it and the cut wanders.</li>
          <li><b>Clamp</b>, then <b>hold both CUT buttons</b>.</li>
          <li>Trim and finished cards sort themselves. Pieces with work left go to the tray. <b>Rotate</b> or <b>turn</b> the lift to reach other edges.</li>
          <li>Strips of the same size can go back in together with <b>Add to lift</b>, up to {frac(job.maxLift)}" high.</li>
        </ol>
      </div>
    </aside>
  );
}
