/**
 * geometry-harness.js  —  run with:  node tests/geometry-harness.js
 * Affine math, cutting, rotation and inch parsing/formatting.
 */
import { IDENTITY, mul, inv, ap, frac, parseIn } from '../src/core/geometry.js';
import { createStack, cutStack, rotateStack, sheetRect } from '../src/core/stack.js';

let pass = 0, fail = 0;
const near = (a, b) => Math.abs(a - b) < 1e-6;
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}  ${detail}`); }
};
const rectEq = (r, x0, y0, x1, y1) => near(r.x0, x0) && near(r.y0, y0) && near(r.x1, x1) && near(r.y1, y1);

console.log('\nAffines');
{
  const m = [0, 1, -1, 0, 5, 2];
  const id = mul(m, inv(m));
  check('m · inv(m) = identity', id.every((v, i) => near(v, IDENTITY[i])), JSON.stringify(id));
  const [x, y] = ap(m, 1, 0);
  check('apply', near(x, 5) && near(y, 3));
}

console.log('\nCutting');
{
  const st = createStack(12, 18);
  const { back, front } = cutStack(st, 16.75);
  check('back piece is 12 × 16.75', near(back.W, 12) && near(back.D, 16.75));
  check('front piece is 12 × 1.25', near(front.D, 1.25));
  check('front maps to sheet y 16.75–18', rectEq(sheetRect(front, front.layers[0]), 0, 16.75, 12, 18));
  check('cut at or past the lift depth is an air cut', cutStack(st, 18) === null && cutStack(st, 20) === null);
}

console.log('\nRotation');
{
  const st = createStack(12, 18);
  const r1 = rotateStack(st);
  check('rotate swaps W and D', near(r1.W, 18) && near(r1.D, 12));
  check('rotated lift still covers the whole sheet', rectEq(sheetRect(r1, r1.layers[0]), 0, 0, 12, 18));
  // After one clockwise turn the sheet's left edge (x=0) sits on the gauge.
  const { back } = cutStack(r1, 0.5);
  check('cut 1/2" after rotate takes the left margin', rectEq(sheetRect(back, back.layers[0]), 0, 0, 0.5, 18),
    JSON.stringify(sheetRect(back, back.layers[0])));
  const r4 = rotateStack(rotateStack(rotateStack(r1)));
  check('four turns return to start', r4.layers[0].every((v, i) => near(v, IDENTITY[i])));
}

console.log('\nInches');
check('frac 16.75 → 16 3/4', frac(16.75) === '16 3/4');
check('frac 0.015625 → 1/64', frac(1 / 64) === '1/64');
check('frac 2 → 2', frac(2) === '2');
check('frac marks approximations', frac(1.3).startsWith('≈'));
check('parse "16 3/4"', near(parseIn('16 3/4'), 16.75));
check('parse "16-3/4\\""', near(parseIn('16-3/4"'), 16.75));
check('parse "11.5 in"', near(parseIn('11.5 in'), 11.5));
check('parse garbage → NaN', Number.isNaN(parseIn('abc')));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
