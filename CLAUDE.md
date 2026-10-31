# CLAUDE.md — Cut Shop

Project brief for Claude sessions. Read this first.

## What this is
**Cut Shop** (working title): a game about running an industrial guillotine paper cutter. The player turns printed press sheets into finished pieces by setting the back gauge, jogging, clamping and cutting. Owner: Jude, 1Oh1 Design LLC. Jude is a print-production designer (10+ years), so real cutter practice is the source of truth for mechanics. When unsure how something works on a real cutter, ask him.

## Stack
- Vite + React 18 + Canvas 2D, plain JavaScript with JSDoc (no TypeScript)
- Same conventions as Jude's `will-it-print` repo
- GitHub Pages deploy via `.github/workflows/deploy.yml`, gated on `npm test`
- `vite.config.js` `base: '/cut-shop/'`

## Layout
- `src/core/`: pure engine, **no DOM imports ever**. Must stay runnable in Node for the harnesses.
- `src/render/`: canvas drawing only; reads `game.state`, never mutates it.
- `src/ui/`: React panels; all game changes go through `game.*` actions (via `ui/control.js` where sound/timing is involved).
- `tests/`: Node harnesses with fixtures and assertions. Add a fixture whenever you change core behaviour.
- `docs/CutShop_Build_Plan.md`: roadmap with phase checklists and open decisions (D1…). Tick boxes and update decisions as work lands.

## Commands
```bash
npm install
npm test        # harnesses: must be green
npm run dev
npm run check   # tests + build: run before every commit/push
```

## Working rules (from Jude, apply on every change)
1. **Validate before anything slow or public.** Run `npm run check` locally before pushing. Never let a deploy be the first place an error shows up.
2. **Surgical edits only.** Change exactly what was asked. No unrequested restyling, resizing, renaming or restructuring. Never rewrite a whole file for a small change.
3. **Mockups show intent, not spec.** Don't infer sizes/spacing from images; ask.
4. **Never reference an asset that doesn't exist.** Confirm the file is in the repo before importing it; ask for the real filename otherwise.
5. **Jude is on Windows and isn't a developer.** Give exact, numbered, click-by-click / command-by-command steps, one at a time when fiddly.
6. **Batch related changes** (5–10) before handing back a package; don't deliver after every tiny edit.
7. Commit messages: short imperative summary line, then details.

## Domain notes
- Inches everywhere in core. Fractions display to 1/64 via `frac()`.
- Lift = `{ W, D, layers[] }`; each layer is an affine local→sheet (canvas convention). See `core/geometry.js` header.
- Tolerance, max lift, par, etc. live in job data (`core/jobs.js`), not in code.
- Stocks (`core/stocks.js`) have reserved fields (`slip`, `wear`, `markClamp`) for Phase 2/3; don't read them until those phases.
