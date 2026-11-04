import { useEffect, useState } from 'react';

export const fmtTime = (ms) => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

export default function Header({ game, s, sound, onSound }) {
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick((n) => n + 1), 250); return () => clearInterval(id); }, []);
  const st = game.state;
  const ms = st.t0 ? (st.done ? st.tEnd : performance.now()) - st.t0 : 0;
  return (
    <header>
      <div className="brand">
        <div className="hazard" aria-hidden="true" />
        <div><h1>Cut Shop</h1><small>Guillotine floor · Prototype 1</small></div>
      </div>
      <div className="stats">
        <div className="stat"><b>{fmtTime(ms)}</b><span>Time</span></div>
        <div className="stat"><b>{s.cuts}</b><span>Cuts</span></div>
        <div className="stat"><b>{game.delivered().toLocaleString()}</b><span>Good {game.job.unit || 'cards'}</span></div>
        <button className="btn small" type="button" aria-pressed={sound} onClick={onSound}>{sound ? 'Sound on' : 'Sound off'}</button>
        <button className="btn small" type="button" onClick={() => game.restart()}>Restart job</button>
      </div>
    </header>
  );
}
