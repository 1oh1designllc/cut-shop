/**
 * loader.js — loads whatever of Jude's sounds and art exist (public/assets/manifest.json).
 * Missing files are fine: renderers and sfx fall back to the built-in placeholders.
 */
export const assets = {
  ready: false,
  art: {},     // slot → HTMLImageElement (loaded)
  artUrl: {},  // slot → URL (for <image href> in SVG)
  sounds: {},  // slot → [URL, …]
};

const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';

export async function loadAssets() {
  let manifest = { art: {}, sounds: {} };
  try {
    const res = await fetch(`${base}assets/manifest.json`, { cache: 'no-cache' });
    if (res.ok) manifest = await res.json();
  } catch { /* no manifest: placeholders only */ }
  for (const [slot, files] of Object.entries(manifest.sounds || {})) {
    assets.sounds[slot] = files.map((f) => `${base}assets/sounds/${f}`);
  }
  await Promise.all(Object.entries(manifest.art || {}).map(async ([slot, file]) => {
    const url = `${base}assets/art/${file}`;
    const img = new Image();
    img.src = url;
    try { await img.decode(); assets.art[slot] = img; assets.artUrl[slot] = url; } catch { /* broken file: keep placeholder */ }
  }));
  assets.ready = true;
  return assets;
}
