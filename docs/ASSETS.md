# Cut Shop — Sounds & Artwork

The game runs on built-in stand-ins. Each sound or art **slot** switches to your file as soon as one is supplied; anything not supplied keeps its stand-in. See what's filled at **https://1oh1designllc.github.io/cut-shop/#assets** (with previews and play buttons).

## How to send files

Attach them in the chat (a zip is fine). **Name each file after its slot**; spaces, capitals and underscores are fine:
`Cut Thick 1.m4a`, `cut-thick-2.m4a`, `Job Business Cards.svg`, `front-blade.png`.

For several takes of one sound, add a number: `clamp-down-1`, `clamp-down-2`, `clamp-down-3`. The game picks one at random each time.

## Sounds

Record with **Voice Memos, set to Lossless** (Settings → Apps → Voice Memos → Audio Quality), or a video.
- Phone 1–2 ft away, not touching the machine. Quiet shop.
- ~2 s of silence before and after (trimmed automatically).
- **3 takes of each**, one sound per file. Don't label by talking: speech in recordings can't be understood here.

| Slot | What to record |
|---|---|
| `cut-thick` | Blade cut, full cycle down and up, thick lift |
| `cut-thin` | Blade cut, thin lift |
| `clamp-down` | Clamp coming down |
| `clamp-up` | Clamp releasing |
| `trim-fall` | Trim strip falling |
| `jog` | Jogging / knocking up a stack by hand |
| `wheel` | Hand wheel turning, a few seconds (loops while the gauge moves) |
| `idle` | Machine idle hum, 10–15 s (loops quietly) |
| `bolt` | Hex key on a bolt |
| `blade-set` | Blade set down on the bench |
| `handle` | Hex handle screwing in |

## Artwork

Illustrator → **SVG** preferred (PNG fine). Aspect ratio matters most: each piece is stretched to its slot.

**Job artwork** (trim + ⅛" bleed). Use made-up businesses or your own ONE ZERO ONE work, not customers' jobs.

| Slot | Size |
|---|---|
| `job.business-cards` | 3.75 × 2.25 in, landscape |
| `job.postcards-4x6` | 4.25 × 6.25 in, portrait |
| `job.postcards-5x7` | 5.25 × 7.25 in, portrait |
| `job.greeting-cards` | 10.25 × 7.25 in, landscape (flat; scores in half) |
| `job.flyers` | 8.75 × 11.25 in, portrait |
| `job.brochures` | 8.75 × 11.25 in, portrait (folds along the 11" side) |

**Machine front view.** Reference canvas 1200 × 720 px. Each moving part is its own file. Redraw rather than copying a brand's logo or nameplate.

| Slot | Size | Notes |
|---|---|---|
| `front.backdrop` | 1200 × 720 | Back wall (optional) |
| `front.housing` | 1200 × 86 | Top beam: hazard stripe, nameplate |
| `front.blade` | 1130 × 230 | Blade carrier face + blade with bolts; bottom edge is the cutting edge |
| `front.clamp` | 1125 × 50 | Clamp bar |
| `front.finger` | 40 × 300 | ONE back-gauge finger (repeated) |
| `front.table` | 1200 × 175 | Table in front of the blade |
| `front.post` | 30 × 460 | Left light-curtain post (mirrored for the right) |

**Blade change**

| Slot | Size |
|---|---|
| `bc.blade` | 1660 × 130 (long, thin, edge at the bottom) |
| `bc.board` | 1700 × 330 (wooden blade board) |
| `bc.bolt` | 64 × 64 (plain bolt head) |
| `bc.bolt-slotted` | 64 × 160 (bolt in its vertical slot) |
| `bc.handle` | 80 × 320 (hex handle, threaded stud at the bottom) |

**Title & icon:** `ui.wordmark` (~600 × 120, transparent).

## Bringing files in (for Claude)

```bash
node tools/prepare-assets.mjs --import <folder-with-Judes-files>   # converts audio, copies art, rebuilds manifest
npm run check                                                      # then commit public/assets/ and push
```
Audio becomes mono MP3 with silence trimmed (not `idle`) and loudness evened out (needs ffmpeg). Files that don't match a slot are listed and skipped. Slots are defined in `src/assets/registry.js`.
