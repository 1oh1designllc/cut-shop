# Cut Shop

A paper-cutting game on an industrial guillotine cutter. Read the job ticket, set the back gauge, jog, clamp and cut press sheets down to finished pieces, inside tolerance and under par.

*Working title. A 1Oh1 Design LLC project.*

**Play:** https://1oh1designllc.github.io/cut-shop/ (deploys from `main`)

## How it works

```
input ──▶ ui/control.js ──▶ core/game.js (state machine) ──snapshot──▶ React panels
                                     └── state ──every frame──▶ render/ (canvas views)
```

A lift on the table is `{ W, D, layers[] }`. Each layer holds an affine transform from the lift's local frame to the press sheet, so any sequence of cuts, rotations and re-stacking maps back to exact sheet coordinates. `classify.js` then decides whether each piece is a finished card, still needs work, or is trim.

## Repo layout

```
src/
  core/               pure game engine: no DOM, runs in Node
    geometry.js         affine math, inch fractions
    stack.js            lifts: cut, rotate, stack compatibility
    layout.js           trim boxes + crop marks from a job
    classify.js         good / wip / scrap / ruined
    jobs.js, stocks.js  content as data
    game.js             state machine + actions
    scoring.js          summary + grade
  render/             canvas: table (top) view, machine (front) view, sheet art, minimap
  ui/                 React panels + input glue (control.js)
  audio/              synthesized placeholder sounds
tests/                node harnesses (no browser needed)
docs/                 build plan, game design, testing runbook, prototype-1.html
```

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # engine harnesses
npm run check    # tests + production build: run before every push
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`: harnesses → build → GitHub Pages. A failing harness blocks the deploy. `vite.config.js` uses `base: '/cut-shop/'`; change it if the repo is renamed or moves to a custom domain.

## Docs

- [Build plan & roadmap](docs/CutShop_Build_Plan.md)
- [Game design](docs/GAME_DESIGN.md)
- [Run & test runbook](docs/TESTING.md)
- [Sounds & artwork: slots and how to send them](docs/ASSETS.md)
