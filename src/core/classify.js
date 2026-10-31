/**
 * classify.js — what is this piece of paper?
 * ------------------------------------------------------------------
 * Given one layer's press-sheet rectangle:
 *   good  — exactly one card, every edge within tolerance of its trim line
 *   wip   — still holds at least one intact card that needs more cuts
 *   scrap — holds no intact card (trim, gutters, or ruined fragments)
 * Any card the rectangle cuts into by more than tolerance is ruined.
 * `ruined` is a Set of card ids shared across the whole job, so a card is
 * only counted once even if its fragments turn up again later.
 * ------------------------------------------------------------------
 */
export function classify(rect, cards, ruined, tol) {
  const contained = [];
  let ruinedNew = 0;
  for (const k of cards) {
    const ix = Math.min(rect.x1, k.x1) - Math.max(rect.x0, k.x0);
    const iy = Math.min(rect.y1, k.y1) - Math.max(rect.y0, k.y0);
    if (ix <= tol || iy <= tol) continue;
    const inside = rect.x0 <= k.x0 + tol && rect.x1 >= k.x1 - tol && rect.y0 <= k.y0 + tol && rect.y1 >= k.y1 - tol;
    if (inside) contained.push(k);
    else if (!ruined.has(k.id)) { ruined.add(k.id); ruinedNew++; }
  }
  if (!contained.length) return { type: 'scrap', ruinedNew };
  if (contained.length === 1) {
    const k = contained[0];
    const err = Math.max(Math.abs(rect.x0 - k.x0), Math.abs(rect.x1 - k.x1), Math.abs(rect.y0 - k.y0), Math.abs(rect.y1 - k.y1));
    if (err <= tol + 1e-9) return { type: 'good', err, card: k, ruinedNew };
  }
  return { type: 'wip', ruinedNew };
}
