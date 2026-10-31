/**
 * layout.js — derive trim boxes, crop-mark positions and the printed block from a job.
 */
export function buildLayout(job) {
  const { sheet, finished: f, cols, rows, gutter: g, bleed } = job;
  const gridW = cols * f.w + (cols - 1) * g;
  const gridH = rows * f.h + (rows - 1) * g;
  const mx = (sheet.w - gridW) / 2;
  const my = (sheet.h - gridH) / 2;
  const cards = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = mx + c * (f.w + g), y0 = my + r * (f.h + g);
      cards.push({ id: r * cols + c, row: r, col: c, x0, y0, x1: x0 + f.w, y1: y0 + f.h });
    }
  }
  const xs = [], ys = [];
  for (let c = 0; c < cols; c++) xs.push(mx + c * (f.w + g), mx + c * (f.w + g) + f.w);
  for (let r = 0; r < rows; r++) ys.push(my + r * (f.h + g), my + r * (f.h + g) + f.h);
  return {
    cards, xs, ys, mx, my,
    printBlock: { x: mx - bleed, y: my - bleed, w: gridW + 2 * bleed, h: gridH + 2 * bleed },
  };
}
