import { useEffect, useRef } from 'react';
import { frac } from '../core/geometry.js';
import { fmtTime } from './Header.jsx';

export default function Results({ game }) {
  const r = game.summary();
  const { job } = game;
  const btn = useRef(null);
  useEffect(() => { btn.current?.focus(); }, []);
  const rows = [
    ['Good cards', `${r.good.toLocaleString()} / ${r.total.toLocaleString()}`],
    ['Ruined cards', r.ruined.toLocaleString()],
    ['Average accuracy', r.hasErr ? `${frac(r.avgErr)}" off` : '—'],
    [`Cuts (par ${job.par.cuts})`, r.cuts],
    [`Time (par ${fmtTime(job.par.timeMs)})`, fmtTime(r.ms)],
  ];
  return (
    <div id="results">
      <div className="rcard" role="dialog" aria-labelledby="rTitle">
        <h3 id="rTitle">Job #{job.id} {r.good >= r.total ? 'complete' : 'finished short'}</h3>
        <div className="grade">{r.grade}</div>
        <div className="rgrid">{rows.map(([k, v]) => [<span key={k}>{k}</span>, <span key={k + 'v'}>{v}</span>])}</div>
        <button ref={btn} className="btn" type="button" onClick={() => game.restart()}>Run it again</button>
      </div>
    </div>
  );
}
