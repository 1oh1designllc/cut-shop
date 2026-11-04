import { useEffect, useRef } from 'react';
import { frac } from '../core/geometry.js';
import { drawThumb } from '../render/sheetArt.js';

export default function Tray({ game, s, guides, onDone }) {
  const sheets = game.job.sheets - game.spoiled();
  const unit = game.job.unit || 'cards';
  return (
    <section className="panel tray" aria-label="Tray">
      <h2>Tray <em>pieces with cuts left</em></h2>
      <div className="bins">
        <div className="bin good"><b>{(s.goodLayers * sheets).toLocaleString()}</b><span>Finished {unit}</span></div>
        <div className="bin"><b>{s.scrapLayers}</b><span>Trim strips</span></div>
        <div className="bin bad"><b>{(s.ruined.size * game.job.sheets + s.goodLayers * game.spoiled()).toLocaleString()}</b><span>Ruined / spoiled</span></div>
      </div>
      <div id="pieces">
        {s.tray.length
          ? s.tray.map((p, i) => <Piece key={`${i}-${s.cuts}-${s.tray.length}`} game={game} p={p} i={i} guides={guides} onDone={onDone} />)
          : <div className="empty">Empty. Pieces that still need cuts land here.</div>}
      </div>
    </section>
  );
}

function Piece({ game, p, i, guides, onDone }) {
  const cv = useRef(null);
  useEffect(() => { drawThumb(cv.current, p, game, { guides }); }, [p, guides, game]);
  const c = game.compat(i);
  const n = p.layers.length;
  return (
    <div className="piece">
      <canvas ref={cv} />
      <div className="dims">{frac(p.W)} × {frac(p.D)}"</div>
      <div className="meta">{n > 1 ? `${n} strips · ` : ''}{(n * game.job.sheets).toLocaleString()} sheets</div>
      <div className="row">
        <button className="btn small" type="button" onClick={() => { if (game.loadPiece(i)) onDone?.(); }}>Load</button>
        <button className="btn small" type="button" disabled={!c.ok} title={c.why || ''} onClick={() => { if (game.addToLift(i)) onDone?.(); }}>Add to lift</button>
      </div>
    </div>
  );
}
