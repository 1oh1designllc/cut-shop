import { useEffect, useRef } from 'react';
import { frac } from '../core/geometry.js';
import { fmtTime } from './Header.jsx';

export default function Results({ game, result, onNext, nextLabel }) {
  const r = game.summary();
  const { job } = game;
  const unit = job.unit || 'cards';
  const btn = useRef(null);
  useEffect(() => { btn.current?.focus(); }, []);
  const rows = [
    [`Delivered ${unit}`, `${r.delivered.toLocaleString()} / ${r.order.toLocaleString()} ordered`],
    ['Spoiled sheets (marks / slips)', r.spoiledSheets.toLocaleString()],
    [`Ruined by the blade`, r.ruined.toLocaleString()],
    ['Average accuracy', r.hasErr ? `${frac(r.avgErr)}" off` : '—'],
    [`Machine cycles (par ${job.par.cuts})`, r.cuts],
    [`Time (par ${fmtTime(job.par.timeMs)})`, fmtTime(r.ms)],
  ];
  const best = result?.best;
  return (
    <div id="results">
      <div className="rcard" role="dialog" aria-labelledby="rTitle">
        <h3 id="rTitle">{job.coach ? 'Tutorial' : `Job #${job.id}`} {r.delivered >= r.order ? 'complete' : 'came up short'}</h3>
        <div className="gradeRow">
          <div className="grade">{r.grade}</div>
          {result?.isNew && <div className="newbest">New best!</div>}
          {result && !result.isNew && best && (
            <div className="prevbest">Best: <b>{best.grade}</b> · {best.cuts} cuts · {fmtTime(best.ms)}</div>
          )}
        </div>
        <div className="rgrid">{rows.map(([k, v]) => [<span key={k}>{k}</span>, <span key={k + 'v'}>{v}</span>])}</div>
        <div className="rbtns">
          <button ref={btn} className="btn" type="button" onClick={() => game.restart()}>Run it again</button>
          {onNext && <button className="btn primary" type="button" onClick={onNext}>Next: {nextLabel}</button>}
        </div>
      </div>
    </div>
  );
}
