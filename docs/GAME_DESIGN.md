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

## 3. Paper stocks (Phase 2, from Jude's shop)

Jude's everyday stocks, all on 12×18. The clamp opening is 3½", so caliper sets how many sheets fit in one pass.

| Stock | Caliper | Max sheets / pass | Behaviour in game |
|---|---|---|---|
| 10pt C2S cardstock | .010" | 350 | Clamp marks above ~20 sheets |
| 12pt C2S cardstock | .012" | 291 | Clamp marks above ~20 sheets |
| 14pt C2S cardstock | .014" | 250 | Clamp marks above ~20 sheets; thick, short lifts |
| 110# uncoated cover | .0145" | 241 | Forgiving: few clamp marks above ~40 sheets |
| 100# gloss text | .0045" | 777 | Slips/creeps under the clamp above ~250 sheets; curls |
| 60# opaque text | .0045" | 777 | Curls; slips only on very tall lifts |

**The lift trade-off** (Jude: "cut as many sheets as possible without causing clamp marks and slippage"):
- The player sets **sheets per lift**. A pile taller than that is cut in several **passes**: more machine cycles, more time.
- The tallest pass used during a job sets how many sheets get **clamp-marked or slipped**. Those sheets are spoiled.
- Every job ships with **~5% overs**. Pick a lift the overs can absorb, or the order comes up short.
- **Curl:** text stocks arrive curled. The first Jog press becomes **Decurl** (bending the stack against the curl, as Jude does by hand). Jogging a curled stack doesn't square it.
- **Clamp pressure** is fixed during play (it's set during machine maintenance). Phase 3 can add it as a maintenance setting: too high gives more marks, too low gives more slipping.

Numbers are first guesses; tune them in playtest.

**Layouts (Jude, 2026-11-04):** every job has a double trim (¼" gutter = two ⅛" bleeds). Business cards run **24-up (3 × 8)** on 12×18, so the bleed reaches the head and foot of the sheet. 4×6 and 5×7 postcards run **4-up**. The occasional **5-up 4×6** (mixed orientation) is saved for the PC/Mac edition.

## 4. Blade & maintenance (Phase 3, from Jude's walkthrough 2026-11-05)

**Wear.** A real blade lasts 3–8 months; the game squeezes that into roughly 7 jobs. Every cut wears the blade (inches of paper × how hard the stock is: C2S hardest) and the cutting stick (per machine pass). Wear is saved on the device and carries from job to job.

**What dull looks like** (Jude: "it will not cut the last couple sheets, or leave them frayed"): once the blade drops below ~35%, or a stick face is more than ~70% grooved, the **bottom sheets of every pass come out frayed or uncut**. Those sheets are spoiled. The message names the cause (dull blade, grooved stick, shallow depth). Usually it's the blade; sometimes it's the stick.

**Cutting stick:** 4 faces. **Rotate** to a fresh face (+30 s), then **replace** (+60 s).

**Blade change (+2 min)**, in Jude's order:
1. Hold both CUT buttons until the blade comes down and locks.
2. Remove every bolt **except the two slotted ones**.
3. Screw the long **hex handles** into the slots, so you never grip the blade.
4. Remove the two slotted bolts.
5. Lift the old blade out with the handles.
6. Take the new blade off the **blade board**, handles in, and fit it.
7. Put every bolt back in **snug**, not tight.
8. **Set the depth** with test cuts: just through the last sheet, only kissing the stick. Too shallow leaves bottom sheets uncut; too deep bites the stick (damages stick, blade and paper; wears both faster).
9. Tighten every bolt.
10. Release.

Out-of-order moves are refused. Dangerous ones count as **safety violations**: pulling a slotted bolt with no handles in, or tightening before the depth is set. Any violation caps the job grade at B.

**Clamp pressure** stays fixed (a future maintenance setting: too high = more marks, too low = more slipping).

## 5. Scoring

- **Delivered** = finished positions × sheets that weren't spoiled. The order quantity must be met.
- **Good** = within tolerance on every edge (±1/32" on shop jobs, 1/16" in the tutorial).
- **Ruined** = a cut went more than tolerance into a piece's trim box.
- **Grade:** S = order met, no safety violations, average error ≤ 1/64", machine cycles ≤ par, time ≤ par. A = order met, no violations. B = order met with a violation, or ≥ 95% of order. C ≥ 80%, else D.
- **Par** is computed by letting the hint engine play the job at the stock's default lift, plus 2 cycles of slack.

## 6. Job #2417 par solution (20 cuts)

Gauge readings in inches, with turns in between:
`16.75` → turn → `15.5` → rotate → `11.5` → turn → `11.0` → `7.5`, `7.25`, `3.75`, `3.5` → add both strips to lift → rotate → `13.5, 13.25, 11.25, 11.0, 9.0, 8.75, 6.75, 6.5, 4.5, 4.25, 2.25, 2.0`.
This exact run is asserted in `tests/game-harness.js`.
