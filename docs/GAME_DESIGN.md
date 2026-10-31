# Cut Shop — Game Design

## 1. Core loop

1. **Job ticket** arrives: item, stock, quantity, press sheet, finished size, layout, tolerance, due time.
2. **Plan** the cut order on the table view.
3. **For each cut:** set the back gauge → jog → clamp → two-hand cut.
4. **Sort:** finished pieces, trim, and work-in-progress go to their places automatically.
5. **Grade:** good pieces delivered, ruined pieces, accuracy, cuts vs par, time vs par.

## 2. Glossary (real cutter terms used in-game)

| Term | Meaning |
|---|---|
| Back gauge | The movable fence the paper is pushed against. Its distance to the blade is the cut size. |
| Lift | The pile of sheets cut at once. Limited by the clamp opening. |
| Jog / knock up | Vibrate or tap the lift so every sheet is square to the gauge and side guide. |
| Clamp | Bar that presses the lift flat right behind the blade so sheets can't shift. |
| Cut line / optical line | The light showing exactly where the blade will drop. |
| Cutting stick | The plastic strip the blade cuts into. It grooves over time and is rotated or replaced. |
| Draw | A dull blade drags the top sheets, so top and bottom of the lift come out different sizes. |
| Caliper | Thickness of one sheet, in inches. Sets lift height. |
| Bleed | Artwork printed past the trim line (usually 1/8") so a slightly-off cut shows no white edge. |
| Gutter | Space between pieces on the sheet; with full bleed it's 2 × bleed and gets cut out. |
| Crop marks | Short lines in the margins marking the trim lines. What the operator aims at. |

## 3. Paper stocks (Phase 2)

| Stock | Caliper | Lift (500 sh) | Play effect |
|---|---|---|---|
| 20# bond | .004" | 2.0" | Easy. Tall lifts, low wear. Curls if not jogged. |
| 70# uncoated text | .0045" | 2.25" | Baseline. |
| 100# gloss text | .0045" | 2.25" | Slippery: needs more clamp pressure or it creeps. |
| 100# gloss cover | .011" | 5.5" | Short lifts, more wear. **(Phase 1 stock)** |
| 14pt C2S | .014" | 7.0" | Very short lifts, high wear. |
| NCR 3-part | .009"/set | — | Heavy clamp leaves marks; glue edge must stay at the head. |
| Synthetic (polyester) | .010" | 5.0" | Wears the blade fast; rough edge when dull. |
| Kraft chipboard | .024" | — | Tiny lifts, very high wear, loud. |

Numbers are typical, not exact; tune in playtest.

## 4. Blade & maintenance (Phase 3)

- **Wear** accrues per cut: `lift height × stock.wear`. Shown as a meter.
- **Below 40%:** draw error grows (top sheets up to 1/32" off). **Below 15%:** rough edges, rejects.
- **Blade change mini-game:**
  1. Lock out the machine (key switch). Skipping it is a safety violation and ends the shift.
  2. Fit the blade carrier/guard.
  3. Remove the blade bolts in the correct order (outside → in).
  4. Swap the blade.
  5. Torque the bolts in order (centre → out).
  6. Set blade depth with a test cut on scrap. Too deep chews the stick; too shallow misses the bottom sheets.
- **Cutting stick:** groove depth increases per cut at the same position; deep groove = bottom sheets not cut through. Rotate (4 faces) or replace.

## 5. Scoring

- **Good** = within tolerance on every edge (Job #2417: ±1/32").
- **Ruined** = a cut went more than tolerance into a piece's trim box.
- **Grade:** S = 100% good, average error ≤ 1/64", cuts ≤ par, time ≤ par. A ≥ 95%, B ≥ 80%, C ≥ 60%, else D.

## 6. Job #2417 par solution (20 cuts)

Gauge readings in inches, with turns in between:
`16.75` → turn → `15.5` → rotate → `11.5` → turn → `11.0` → `7.5`, `7.25`, `3.75`, `3.5` → add both strips to lift → rotate → `13.5, 13.25, 11.25, 11.0, 9.0, 8.75, 6.75, 6.5, 4.5, 4.25, 2.25, 2.0`.
This exact run is asserted in `tests/game-harness.js`.
