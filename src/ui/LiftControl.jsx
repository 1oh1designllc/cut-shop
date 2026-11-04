/**
 * LiftControl.jsx — how many sheets go under the clamp per pass.
 * The core trade-off: taller lifts = fewer machine cycles, more clamp marks / slipped sheets.
 */
import { spoilFraction } from '../core/stocks.js';

export default function LiftControl({ game, s }) {
  const { stock, job, maxSheets } = game;
  const N = job.sheets, L = s.liftSheets;
  const up = job.cols * job.rows;
  const overs = Math.max(0, N - Math.ceil(game.order / up));
  const est = Math.round(N * spoilFraction(stock, L));
  const so = game.spoiled();
  const passes = Math.ceil(N / L);
  const tone = est > overs ? 'bad' : est > 0 ? 'warn' : 'ok';
  const locked = s.clampDown || s.busy;
  return (
    <div className="liftctl">
      <div className="liftrow">
        <label htmlFor="liftRange">Lift</label>
        <b>{L} sheets</b>
        <span>{(L * stock.caliper).toFixed(2)}" of {(maxSheets * stock.caliper).toFixed(1)}"</span>
      </div>
      <input
        id="liftRange" type="range" min={5} max={maxSheets} step={1} value={L}
        disabled={locked} aria-describedby="liftNotes"
        onChange={(e) => game.setLift(+e.target.value)}
      />
      <div className="liftnotes" id="liftNotes">
        <span>{passes} pass{passes > 1 ? 'es' : ''} per cut on a full strip</span>
        <span className={tone}>~{est} sheets spoiled at this lift · {overs} overs</span>
        {so > 0 && <span className="warn">Spoiled so far: ~{so} sheets</span>}
      </div>
    </div>
  );
}
