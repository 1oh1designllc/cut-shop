import { useEffect, useMemo, useRef, useState } from 'react';
import { createGame } from '../core/game.js';
import { JOBS } from '../core/jobs.js';
import { sfx } from '../audio/sfx.js';
import { drawTable } from '../render/tableView.js';
import { createFrontRenderer } from '../render/frontView.js';
import { useSnapshot, useCompact } from './hooks.js';
import Compact from './Compact.jsx';
import { bindKeyboard } from './control.js';
import Header from './Header.jsx';
import TablePanel from './TablePanel.jsx';
import MachinePanel from './MachinePanel.jsx';
import Tray from './Tray.jsx';
import Ticket from './Ticket.jsx';
import Results from './Results.jsx';

const reduceMotion = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function App() {
  const game = useMemo(() => createGame(JOBS[0]), []);
  const s = useSnapshot(game);
  const [guides, setGuides] = useState(true);
  const [sound, setSound] = useState(true);
  const tableView = useRef(null);
  const frontView = useRef(null);
  // Render options read every frame (a ref, so changing them doesn't re-render React).
  const opts = useRef({ guides: true, loupeX: 0.25, reduceMotion, tableMap: null });
  opts.current.guides = guides;
  const compact = useCompact();
  opts.current.fit = compact;

  useEffect(() => { sfx.on = sound; }, [sound]);

  useEffect(() => {
    const unbind = bindKeyboard(game);
    const unlockAudio = () => sfx.init();
    document.addEventListener('pointerdown', unlockAudio, { once: true });
    return () => { unbind(); document.removeEventListener('pointerdown', unlockAudio); };
  }, [game]);

  useEffect(() => {
    const drawFront = createFrontRenderer();
    let raf;
    const frame = (t) => {
      if (tableView.current) opts.current.tableMap = drawTable(tableView.current, game, t, opts.current);
      if (frontView.current) drawFront(frontView.current, game, t, opts.current);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [game]);

  if (compact) {
    return (
      <div className="app compact">
        <Compact
          game={game} s={s} tableView={tableView} frontView={frontView} opts={opts}
          guides={guides} onGuides={setGuides} sound={sound} onSound={() => setSound((v) => !v)}
        />
        {s.done && <Results game={game} />}
      </div>
    );
  }

  return (
    <div className="app">
      <Header game={game} s={s} sound={sound} onSound={() => setSound((v) => !v)} />
      <TablePanel game={game} s={s} viewRef={tableView} opts={opts} />
      <MachinePanel game={game} s={s} viewRef={frontView} />
      <Tray game={game} s={s} guides={guides} />
      <Ticket game={game} s={s} guides={guides} onGuides={setGuides} />
      {s.done && <Results game={game} />}
    </div>
  );
}
