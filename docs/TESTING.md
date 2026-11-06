# Cut Shop — Run & Test Runbook

## 1. Run it on Windows (copy-paste)

Open **Command Prompt** or **PowerShell** in the project folder, then:

```bash
npm install          # first time only
npm test             # engine harnesses — every one must say "0 failed"
npm run dev          # local dev server; open the URL it prints (http://localhost:5173/cut-shop/)
```

To test on your phone on the same Wi-Fi: `npm run dev -- --host`, then open the "Network" URL it prints.

**Before every push:** `npm run check` (tests + production build). If either fails, don't push: GitHub Pages won't update anyway, because the deploy runs the same tests.

## 2. Automated checks

| Harness | What it proves |
|---|---|
| `geometry-harness.js` | Affine math, cut/rotate geometry, inch parsing and fraction display |
| `classify-harness.js` | Job layout, good / wip / scrap / ruined decisions at the tolerance edges |
| `game-harness.js` | The full 20-cut par run of Job #2417 delivers 2,100 cards with grade S, plus the rules (clamp, jog, air cut, lift height) |
| `hint-harness.js` | The hint engine plays every job (and 40 random jobs) by itself, meets the order within par with nothing ruined; lift trade-off and curl behaviour |
| `assets-harness.js` | Asset slots are complete, filenames map to slots, manifest built correctly |
| `maintenance-harness.js` | Blade/stick wear across jobs, fraying, depth effects, stick rotation, and the blade-change order with safety violations |

## 3. Manual playtest checklist

### Controls
- [ ] Hand wheel turns smoothly with mouse and finger; ticks every 1/16"
- [ ] Nudge buttons step correctly and repeat when held
- [ ] Typed gauge accepts `16.75`, `16 3/4`, `16-3/4`; rejects junk with a message
- [ ] Gauge refuses to move while clamped
- [ ] Jog (Q), Clamp (W), Rotate (R), Turn (T) keys work
- [ ] Two-thumb cut on phone; F + J on keyboard; hold-one with mouse
- [ ] Loupe follows a tap on the table

### Game rules
- [ ] Unjogged cut warns and can ruin cards
- [ ] Air cut message when the gauge is behind the lift
- [ ] Strips land in the tray; Load and Add to lift behave; a 4th lift is refused
- [ ] Minimap shows cuts, table piece (yellow), tray pieces (dashed), finished (green), ruined (red)
- [ ] Results screen appears when the last piece is sorted; Run it again resets everything

### Tutorial, hint, bests
- [ ] First visit opens the tutorial; coach steps tick off as you go
- [ ] Finishing shows the grade, "New best!" the first time, and a Next job button
- [ ] Job picker (Ticket) switches jobs and shows best grades
- [ ] Next-cut hint toggle shows the dashed line and NEXT steps on Job #2417

### Blade & stick
- [ ] Blade % in the phone header turns yellow when it starts fraying
- [ ] Full blade change works with taps; pulling a slotted bolt early is refused and logged
- [ ] Depth test cuts: shallow / biting / clean messages make sense
- [ ] Wear carries into the next job (reload the page: blade % stays)

### Layout
- [ ] Desktop: three columns, nothing overlaps
- [ ] Phone (portrait): single column, no sideways scroll, cut buttons reachable
- [ ] Sound toggle works; no sound plays before the first tap

## 4. Bugs found

Log here as: date · device · what happened · steps.

- 2026-11-03 · phone · Table view too small to see where the blade will cut → fixed: phone camera zooms to the lift, gauge and cut line; bigger loupe.
- 2026-11-03 · phone · Scrolling between the table view and the Jog/Clamp/Cut controls broke the flow → fixed: one-screen phone layout with the controls pinned at the bottom.
