/**
 * AssetCheck.jsx — …/cut-shop/#assets : which sound and art slots have Jude's files,
 * with previews and play buttons. Everything not filled uses the built-in placeholder.
 */
import { useEffect, useState } from 'react';
import { SOUND_SLOTS, ART_SLOTS } from '../assets/registry.js';
import { assets, loadAssets } from '../assets/loader.js';
import { sfx } from '../audio/sfx.js';

export default function AssetCheck() {
  const [ready, setReady] = useState(assets.ready);
  useEffect(() => { if (!assets.ready) loadAssets().then(() => setReady(true)); }, []);
  const groups = {};
  for (const [slot, a] of Object.entries(ART_SLOTS)) (groups[a.group] ||= []).push([slot, a]);
  const artFilled = Object.keys(ART_SLOTS).filter((s) => assets.art[s]).length;
  const soundFilled = Object.keys(SOUND_SLOTS).filter((s) => assets.sounds[s]?.length).length;

  const playTake = async (url) => {
    const c = sfx.init(); if (!c) return;
    const buf = await sfx.buffer(url);
    if (buf) sfx.playBuffer(buf);
  };

  return (
    <div className="app assetpage">
      <header>
        <div className="brand"><div className="hazard" aria-hidden="true" /><div><h1>Asset check</h1><small>Your sounds and artwork in the game</small></div></div>
        <a className="btn small" href="#">Back to the game</a>
      </header>
      <p className="assetintro">
        {ready ? `${artFilled} of ${Object.keys(ART_SLOTS).length} art slots and ${soundFilled} of ${Object.keys(SOUND_SLOTS).length} sound slots use your files. Everything else is the built-in stand-in.` : 'Loading…'}
      </p>

      <section className="panel">
        <h2>Sounds <em>several takes per slot play at random</em></h2>
        <div className="slotlist">
          {Object.entries(SOUND_SLOTS).map(([slot, desc]) => {
            const takes = assets.sounds[slot] || [];
            return (
              <div className={'slot ' + (takes.length ? 'filled' : '')} key={slot}>
                <div className="slotname"><code>{slot}</code><span className="slotstate">{takes.length ? `${takes.length} take${takes.length > 1 ? 's' : ''}` : 'stand-in'}</span></div>
                <div className="slotdesc">{desc}</div>
                {takes.length > 0 && <div className="slotbtns">{takes.map((u, i) => <button key={u} className="btn small" type="button" onClick={() => playTake(u)}>Play {i + 1}</button>)}</div>}
              </div>
            );
          })}
        </div>
      </section>

      {Object.entries(groups).map(([group, slots]) => (
        <section className="panel" key={group}>
          <h2>{group}</h2>
          <div className="slotlist">
            {slots.map(([slot, a]) => (
              <div className={'slot ' + (assets.art[slot] ? 'filled' : '')} key={slot}>
                <div className="slotname"><code>{slot}</code><span className="slotstate">{assets.art[slot] ? 'yours' : 'stand-in'}</span></div>
                <div className="slotdesc">{a.desc} · <b>{a.size}</b></div>
                {assets.artUrl[slot] && <img className="slotprev" src={assets.artUrl[slot]} alt={a.desc} />}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
