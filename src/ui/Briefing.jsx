/**
 * Briefing.jsx — shown when a job comes in: what it is, how the stock behaves,
 * and the lift-height decision before the first cut.
 */
import { frac } from '../core/geometry.js';
import LiftControl from './LiftControl.jsx';

export default function Briefing({ game, s, onStart }) {
  const { job, stock } = game;
  const up = job.cols * job.rows;
  const overs = Math.max(0, job.sheets - Math.ceil(game.order / up));
  return (
    <div className="modal">
      <div className="rcard" role="dialog" aria-labelledby="bTitle">
        <h3 id="bTitle">Job #{job.id} in</h3>
        <div className="brief-title">{job.title}</div>
        <dl className="specs">
          <dt>Order</dt><dd>{game.order.toLocaleString()} {job.unit || 'pieces'}</dd>
          <dt>Stock</dt><dd>{stock.name}</dd>
          <dt>Press run</dt><dd>{job.sheets} sheets of {job.sheet.w} × {job.sheet.h}" ({overs} overs)</dd>
          <dt>Layout</dt><dd>{frac(job.finished.w)} × {frac(job.finished.h)}", {up}-up</dd>
          {job.note && <><dt>After</dt><dd>{job.note}</dd></>}
        </dl>
        {stock.notes.length > 0 && <ul className="stocknotes">{stock.notes.map((n) => <li key={n}>{n}</li>)}</ul>}
        <LiftControl game={game} s={s} />
        <p className="brief-tip">Taller lifts mean fewer cuts but more clamp marks and slipped sheets. Your overs cover {overs} spoiled sheets.</p>
        <button className="btn primary" type="button" onClick={onStart} autoFocus>Start job</button>
      </div>
    </div>
  );
}
