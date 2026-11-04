/**
 * Compact.jsx — the one-screen phone layout.
 * Header strip · stage (Table / Machine tabs, Machine shows itself during a cut)
 * · control deck pinned at the bottom · Tray and Ticket as pull-up sheets.
 */
import { useEffect, useState } from 'react';
import { fmtTime } from './Header.jsx';
import TablePanel from './TablePanel.jsx';
import Tray from './Tray.jsx';
import Ticket from './Ticket.jsx';
import { MachineView, Gauge, Nudges, CutButton, useTwoHand } from './MachinePanel.jsx';
import { doJog, doClamp } from './control.js';

export default function Compact({ game, s, tableView, frontView, opts, play, guides, onGuides, sound, onSound }) {
  const [sheet, setSheet] = useState(null); // 'tray' | 'ticket' | null
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick((n) => n + 1), 250); return () => clearInterval(id); }, []);
  const st = game.state;
  const ms = st.t0 ? (st.done ? st.tEnd : performance.now()) - st.t0 : 0;
  const trayNeedsYou = !s.table && s.tray.length > 0;

  // The game fits one screen: block page drags (pull-to-refresh, bounce, pinch-zoom)
  // everywhere except inside an open Tray/Ticket sheet, which scrolls.
  useEffect(() => {
    const block = (e) => { if (!e.target.closest?.('.sheet')) e.preventDefault(); };
    const blockGesture = (e) => e.preventDefault();
    document.addEventListener('touchmove', block, { passive: false });
    document.addEventListener('gesturestart', blockGesture);
    return () => {
      document.removeEventListener('touchmove', block);
      document.removeEventListener('gesturestart', blockGesture);
    };
  }, []);

  return (
    <>
      <header className="compacthead">
        <h1>Cut Shop</h1>
        <div className="ministats" aria-label="Time, cuts, good cards">
          <span><b>{fmtTime(ms)}</b></span>
          <span><b>{s.cuts}</b> cuts</span>
          <span><b>{(s.goodLayers * game.job.sheets).toLocaleString()}</b> good</span>
        </div>
        <div className="headbtns">
          <button className={'btn small' + (trayNeedsYou ? ' attn' : '')} type="button" onClick={() => setSheet('tray')}>
            Tray{s.tray.length ? ` (${s.tray.length})` : ''}
          </button>
          <button className="btn small" type="button" onClick={() => setSheet('ticket')}>Ticket</button>
        </div>
      </header>

      <Stage game={game} s={s} tableView={tableView} frontView={frontView} opts={opts} play={play} />
      <Deck game={game} s={s} />

      {sheet === 'tray' && (
        <Sheet title="Tray" onClose={() => setSheet(null)}>
          <Tray game={game} s={s} guides={guides} onDone={() => setSheet(null)} />
        </Sheet>
      )}
      {sheet === 'ticket' && (
        <Sheet title="Job ticket" onClose={() => setSheet(null)}>
          <Ticket key={game.job.id} game={game} s={s} guides={guides} onGuides={onGuides} play={play} />
          <div className="sheetbtns">
            <button className="btn small" type="button" aria-pressed={sound} onClick={onSound}>{sound ? 'Sound on' : 'Sound off'}</button>
            <button className="btn small" type="button" onClick={() => { game.restart(); setSheet(null); }}>Restart job</button>
          </div>
        </Sheet>
      )}
    </>
  );
}

function Stage({ game, s, tableView, frontView, opts, play }) {
  const [view, setView] = useState('table');
  const [cutting, setCutting] = useState(false);
  useEffect(() => {
    if (s.busy) { setCutting(true); return undefined; }
    const id = setTimeout(() => setCutting(false), 450); // let the trim finish falling
    return () => clearTimeout(id);
  }, [s.busy]);
  const show = cutting ? 'machine' : view;
  return (
    <div className="stage">
      <div className="viewtabs" role="group" aria-label="View">
        <button className="btn small" type="button" aria-pressed={show === 'table'} onClick={() => setView('table')}>Table · top</button>
        <button className="btn small" type="button" aria-pressed={show === 'machine'} onClick={() => setView('machine')}>Machine · front</button>
      </div>
      <div className="stagebody">
        <div className="stageview" hidden={show !== 'table'}>
          <TablePanel game={game} s={s} viewRef={tableView} opts={opts} play={play} fill />
        </div>
        <div className="stageview machineview" hidden={show !== 'machine'}>
          <MachineView viewRef={frontView} />
        </div>
      </div>
    </div>
  );
}

function Deck({ game, s }) {
  const { left, right } = useTwoHand(game);
  return (
    <div className="deck" aria-label="Controls">
      <Gauge game={game} s={s} />
      <Nudges game={game} />
      <div className="deckrow">
        <CutButton side="L" props={left} />
        <div className="actions">
          <button className="btn" type="button" onClick={() => doJog(game)}>Jog</button>
          <button className={'btn' + (s.clampDown ? ' on' : '')} type="button" onClick={() => doClamp(game)}>{s.clampDown ? 'Release' : 'Clamp'}</button>
          <button className="btn" type="button" onClick={() => game.rotate(1)}>Rotate</button>
          <button className="btn" type="button" onClick={() => game.rotate(2)}>Turn</button>
        </div>
        <CutButton side="R" props={right} />
      </div>
    </div>
  );
}

function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheethead"><h2>{title}</h2><button className="btn small" type="button" onClick={onClose}>Close</button></div>
        {children}
      </div>
    </div>
  );
}
