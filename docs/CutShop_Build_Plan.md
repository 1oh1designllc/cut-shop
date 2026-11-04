# Cut Shop — Build Plan

*A paper-cutting game on an industrial guillotine cutter. Stocks, sizes, blade changes.*
*Working doc. Last updated 2026-11-04.*

---

## 1. What it is

A game about running a commercial guillotine cutter. Job tickets come in, and the player turns printed press sheets into finished pieces by setting the back gauge, jogging, clamping and cutting, in a smart order, inside tolerance, without wasting paper or ruining artwork. It's grounded in real print-finishing practice: crop marks, bleeds, gutters, lift heights, blade wear.

**Who it's for:** anyone who likes precision/"satisfying" sim games (PowerWash Simulator, Unpacking, Papers, Please), plus print people who'll recognise every detail.

**Two views, by design:**
- **Table (top-down):** plan and line up the cut. You see the gauge, the cut line, the crop marks, and a loupe.
- **Machine (front):** the physical moment. Clamp drops, blade swings, trim falls.

---

## 2. Roadmap

Each phase ends in something playable on a phone from the GitHub Pages link.

### Phase 0 — Foundation ✅ (2026-10-31)
- [x] Playable prototype (single HTML), see `docs/prototype-1.html`
- [x] Repo: Vite + React, plain JS + JSDoc (same stack as Will It Print)
- [x] Pure game engine in `src/core/` (no DOM), separate from rendering and UI
- [x] Node harnesses: geometry, classification, full par run of Job #2417 (50 checks)
- [x] GitHub Pages deploy, gated on `npm test`
- [x] CLAUDE.md, README, testing runbook

### Phase 1 — Core loop polish
- [x] Playtest Job #2417 on phone (2026-11-03): table too small to see the cut; scrolling between view and controls kills the fun
- [x] Phone one-screen layout: controls pinned at the bottom, table auto-zooms on the lift, Machine tab shows itself during each cut, Tray/Ticket as pull-up sheets
- [x] Tutorial job: 4-up postcards, on-screen coach with live step checklist (rotate → gauge → jog → clamp → cut) and the reason for each cut
- [ ] Undo last cut (practice mode only)
- [x] Best score per job saved on the device; job picker shows best grade; "New best!" on the results screen
- [x] Next-cut hint (toggle on the ticket): blue dashed line on the lift, turns green when the gauge is right. Hint engine is tested by letting it play every job to par
- [ ] Second phone playtest of the new layout
- **Milestone 1:** a stranger can finish Job #2417 without being told how

### Phase 2 — Stocks & jobs
- [x] Jude's six stocks drive play (GAME_DESIGN.md §3): caliper → sheets per pass; clamp marks (C2S above ~20 sheets), slipping (gloss text), curl (text stocks → Decurl before Jog)
- [x] Lift height is the core decision (slider + job briefing): taller = fewer machine cycles, more spoiled sheets; overs (~5%) absorb a sensible amount. Clamp pressure stays fixed (Jude: set during maintenance) → Phase 3 maintenance setting
- [x] Job templates on 12×18 (Jude's most common work): business cards (24-up, 3 × 8), 4×6 & 5×7 postcards (4-up), 10×7 greeting cards (scored), 8½×11 flyers, tri-fold brochures. Six fixed shop jobs #3101–#3106
- [x] Random job generator (template + allowed stock + order qty); par worked out automatically by letting the hint engine play it
- [ ] Imposition variety: work-and-turn, mixed sizes, no-gutter (butted) layouts → moved to the PC/Mac depth list (D7)
- [ ] Due times / rush jobs → Phase 5 career mode
- **Milestone 2:** 10+ distinct jobs across 5+ stocks, each plays differently ✅ (6 shop jobs + endless random jobs, 6 stocks)

### Phase 3 — Blade & maintenance
- [ ] Blade wear per cut, weighted by stock and lift height
- [ ] Dull-blade effects: draw (top/bottom sheets differ), rough edges, customer rejects
- [ ] Blade-change mini-game: lockout, bolt removal order, swap, torque in order, set depth
- [ ] Cutting stick: grooves over time, rotate / replace
- [ ] Safety rules: lockout skipped, hands in the light curtain → penalties
- **Milestone 3:** maintenance is a real decision ("change now, or push through the rush job?")

### Phase 4 — Art & sound
- [ ] Final vector art: machine face, table, stack, UI chrome (from Jude's Illustrator files)
- [ ] Recorded sounds from the real cutter: clamp hiss, blade thunk, trim fall, gauge motor
- [ ] Juice: screen shake on heavy cuts, paper flutter, finished-stack counter
- **Milestone 4:** looks and sounds like the shop

### Phase 5 — Career mode
- [ ] Shifts with a clock and a job queue
- [ ] Money, customer satisfaction, reputation
- [ ] Upgrades: programmable gauge (typed entry), air table, jogger, faster blade changes, bigger cutter
- [ ] Save game
- **Milestone 5:** a full week in the shop is fun start to finish

### Phase 6 — Ship
- [ ] PWA: installable, works offline
- [ ] itch.io page + trailer
- [ ] Decide app stores (see D2)

---

## 3. Open decisions

| # | Decision | Options | Status |
|---|---|---|---|
| D1 | Game name | *Cut Shop* (working title) / other | open |
| D2 | Platforms | **Direction set 2026-11-03:** two editions on one shared engine: a **PC/Mac edition** (deeper, packaged as a desktop app for Steam/itch) and a **phone edition** (streamlined). Packaging tool (Electron vs Tauri) and phone store wrapper (Capacitor) still to pick, at Phase 5 | direction set |
| D7 | Desktop-only depth | Candidates: cut-program editor on a programmable cutter, full imposition/cut-sheet planning (incl. 5-up 4×6 with mixed orientation), more machines, longer career, detailed blade change | open |
| D3 | Realism level | Sim (every real step) · Arcade (auto-jog, faster) · Both with a toggle | open, decide in Phase 1 playtest |
| D4 | Typed gauge entry | Free from the start · Unlocked as the "programmable gauge" upgrade | open, prototype has it free |
| D5 | Monetisation | Free web · Paid · Free + cosmetic | open |
| D6 | Repo visibility | Public (free Pages hosting) · Private (Pages needs a paid plan) | public for now |

---

## 4. Architecture

```
input ──▶ ui/control.js ──▶ core/game.js (state machine) ──snapshot──▶ React UI
                                     │
                                     └── state ──every frame──▶ render/ (canvas)
```

- **core/** is pure JS and runs in Node, so the harnesses test real game logic without a browser.
- **A lift is `{ W, D, layers[] }`.** Each layer carries an affine transform from the lift's local frame to the press sheet. Cutting, rotating and stacking are matrix operations, so any sequence of cuts maps back to exact sheet coordinates.
- **classify.js** decides good / wip / scrap per layer against the job's trim boxes, within tolerance.
- **Jobs and stocks are data** (`jobs.js`, `stocks.js`). New content shouldn't need new code.

---

## 5. Tech decisions

- **Vite + React + Canvas 2D.** Matches Will It Print / print-production-tool. React runs the panels; canvas draws the views. *Phaser was considered and skipped: the game is precision UI rather than sprites and physics, and the prototype proved Canvas 2D is enough.*
- **Plain JS + JSDoc**, no TypeScript migration.
- **Harness-gated deploys:** `npm test` must pass or GitHub Pages doesn't update.
- **100% client-side.** No backend until career-mode saves need one (and localStorage may be enough).
