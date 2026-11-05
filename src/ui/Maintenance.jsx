/**
 * Maintenance.jsx — blade and cutting-stick condition, and the actions to fix them.
 */
import { useState } from 'react';
import { bladeLeft, stickLeft, depthLabel, fraySheets, STICK_FACES } from '../core/machine.js';
import BladeChange from './BladeChange.jsx';

const tone = (v) => (v < 0.2 ? 'bad' : v < 0.4 ? 'warn' : 'ok');

export function Meter({ label, value, note }) {
  return (
    <div className="meter">
      <div className="meterhead"><span>{label}</span><b className={tone(value)}>{Math.round(value * 100)}%</b></div>
      <div className="meterbar"><i className={tone(value)} style={{ width: `${Math.round(value * 100)}%` }} /></div>
      {note && <div className="meternote">{note}</div>}
    </div>
  );
}

export default function Maintenance({ game, s, onBladeChanged }) {
  const [changing, setChanging] = useState(false);
  const m = game.machine;
  const fray = fraySheets(m);
  const locked = s.clampDown || s.busy || s.done;
  return (
    <div className="maint">
      <Meter label="Blade" value={bladeLeft(m)} note={`Blade #${m.blades || 1} · depth: ${depthLabel(m.depth)}`} />
      <Meter label="Cutting stick" value={stickLeft(m)} note={`Face ${m.stickFace} of ${STICK_FACES}`} />
      {fray > 0 && <div className="maintwarn">Bottom {fray} sheet{fray > 1 ? 's' : ''} of each pass will fray. Check the blade and the stick.</div>}
      <div className="maintbtns">
        <button className="btn small" type="button" disabled={locked} onClick={() => setChanging(true)}>Change blade</button>
        <button className="btn small" type="button" disabled={locked || m.stickFace >= STICK_FACES} onClick={() => game.rotateStick()}>Rotate stick</button>
        <button className="btn small" type="button" disabled={locked} onClick={() => game.replaceStick()}>Replace stick</button>
      </div>
      {changing && (
        <BladeChange
          onCancel={() => setChanging(false)}
          onDone={(r) => { game.installBlade(r); setChanging(false); onBladeChanged?.(); }}
        />
      )}
    </div>
  );
}
