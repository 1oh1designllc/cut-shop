import { useEffect, useMemo, useRef, useState } from 'react';
import { createGame } from '../core/game.js';
import { JOBS } from '../core/jobs.js';
import { randomJob } from '../core/jobgen.js';
import { nextHint } from '../core/hint.js';
import { sfx } from '../audio/sfx.js';
import { loadAssets } from '../assets/loader.js';
import { drawTable } from '../render/tableView.js';
import { createFrontRenderer } from '../render/frontView.js';
import { useSnapshot, useCompact } from './hooks.js';
import { bindKeyboard } from './control.js';
import { loadBests, saveBest, loadLastJob, saveLastJob, loadMachine, saveMachine } from './bests.js';
import Compact from './Compact.jsx';
import Header from './Header.jsx';
import TablePanel from './TablePanel.jsx';
import MachinePanel from './MachinePanel.jsx';
import Tray from './Tray.jsx';
import Ticket from './Ticket.jsx';
import Results from './Results.jsx';
import Briefing from './Briefing.jsx';
import AssetCheck from './AssetCheck.jsx';

const reduceMotion = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** First visit starts on the tutorial; after that, the last job played. */
function initialJob() {
  const last = loadLastJob();
  if (last && JOBS.some((j) => j.id === last)) return last;
  return JOBS[0].id;
}

export default function App() {
  const [hash, setHash] = useState(() => (typeof location !== 'undefined' ? location.hash : ''));
  useEffect(() => { const on = () => setHash(location.hash); window.addEventListener('hashchange', on); return () => window.removeEventListener('hashchange', on); }, []);
  if (hash === '#assets') return <AssetCheck />;
  return <Game />;
}

function Game() {
  const [jobId, setJobId] = useState(initialJob);
  const [random, setRandom] = useState(null); // the current random job, if any
  const job = (random && random.id === jobId ? random : JOBS.find((j) => j.id === jobId)) || JOBS[0];
  const game = useMemo(() => createGame(job, { machine: loadMachine() || undefined }), [job]);
  const s = useSnapshot(game);
  const [guides, setGuides] = useState(true);
  const [sound, setSound] = useState(true);
  const [, setAssetsReady] = useState(false); // re-render once Jude's art has loaded
  const [showHint, setShowHint] = useState(false);
  const [bests, setBests] = useState(loadBests);
  const [result, setResult] = useState(null); // { isNew, best } for the finished run
  const tableView = useRef(null);
  const frontView = useRef(null);
  // Render options read every frame (a ref, so changing them doesn't re-render React).
  const opts = useRef({ guides: true, loupeX: 0.25, reduceMotion, tableMap: null, hint: null });
  const compact = useCompact();

  const coachMode = job.coach ? 'coach' : showHint ? 'hint' : null;
  const hint = useMemo(() => (coachMode ? nextHint(game) : null), [game, s, coachMode]);
  opts.current.guides = guides;
  opts.current.fit = compact;
  opts.current.hint = hint;

  const chooseJob = (id) => {
    setResult(null);
    if (id === 'random') { const r = randomJob(); setRandom(r); setJobId(r.id); return; }
    if (!(random && random.id === id)) saveLastJob(id);
    setJobId(id);
  };
  // New jobs open with a briefing (stock notes + lift decision); the tutorial has its coach instead.
  const [briefed, setBriefed] = useState(null);
  const showBriefing = !job.coach && briefed !== game && !s.t0 && !s.done;
  const idx = JOBS.findIndex((j) => j.id === job.id);
  const nextJob = idx >= 0 && idx < JOBS.length - 1 ? JOBS[idx + 1] : { id: 'random', label: 'New random job' };

  useEffect(() => { sfx.setOn(sound); }, [sound]);
  useEffect(() => { loadAssets().then(() => setAssetsReady(true)); }, []);
  useEffect(() => { saveMachine(game.machine); }, [s, game]); // keep blade/stick wear between jobs

  // Record the best score once, when a run finishes.
  useEffect(() => {
    if (!s.done) { setResult(null); return; }
    if (job.random) { setResult(null); return; }
    const r = saveBest(job.id, game.summary());
    setResult(r);
    setBests(loadBests());
  }, [s.done, game, job.id]);

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

  const play = { hint, coachMode, showHint, setShowHint, jobId: job.id, chooseJob, bests, random };
  const briefing = showBriefing && <Briefing game={game} s={s} onStart={() => setBriefed(game)} />;
  const results = s.done && (
    <Results game={game} result={result} onNext={nextJob ? () => chooseJob(nextJob.id) : null} nextLabel={nextJob?.label} />
  );

  if (compact) {
    return (
      <div className="app compact">
        <Compact
          game={game} s={s} tableView={tableView} frontView={frontView} opts={opts} play={play}
          guides={guides} onGuides={setGuides} sound={sound} onSound={() => setSound((v) => !v)}
        />
        {results}
        {briefing}
      </div>
    );
  }

  return (
    <div className="app">
      <Header game={game} s={s} sound={sound} onSound={() => setSound((v) => !v)} />
      <TablePanel game={game} s={s} viewRef={tableView} opts={opts} play={play} />
      <MachinePanel game={game} s={s} viewRef={frontView} />
      <Tray game={game} s={s} guides={guides} />
      <Ticket key={job.id} game={game} s={s} guides={guides} onGuides={setGuides} play={play} />
      {results}
      {briefing}
    </div>
  );
}
