import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

const COMPACT_QUERY = '(max-width: 759px)';

/** True on phone-width screens: the one-screen game layout. */
export function useCompact() {
  const get = () => typeof window !== 'undefined' && !!window.matchMedia?.(COMPACT_QUERY).matches;
  const [compact, setCompact] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(COMPACT_QUERY);
    const on = () => setCompact(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return compact;
}

/** Re-render when the game publishes a new snapshot. */
export const useSnapshot = (game) => useSyncExternalStore(game.subscribe, game.getSnapshot);

/**
 * Size a canvas to its CSS width (height from `heightFor(width)`), at device
 * pixel ratio, and keep `viewRef.current = { ctx, w, h, dpr }` up to date.
 */
export function useCanvasView(canvasRef, viewRef, heightFor, onResize) {
  const fns = useRef({ heightFor, onResize });
  fns.current = { heightFor, onResize };
  useEffect(() => {
    const cv = canvasRef.current;
    const fit = () => {
      const w = cv.clientWidth;
      if (!w) return;
      const h = Math.round(fns.current.heightFor(w, cv));
      if (!h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const v = viewRef.current;
      if (v && v.w === w && v.h === h && v.dpr === dpr) return;
      cv.style.height = h + 'px';
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      viewRef.current = { ctx: cv.getContext('2d'), w, h, dpr };
      if (fns.current.onResize) fns.current.onResize();
    };
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    if (cv.parentElement) ro.observe(cv.parentElement);
    window.addEventListener('resize', fit);
    fit();
    return () => { ro.disconnect(); window.removeEventListener('resize', fit); };
  }, [canvasRef, viewRef]);
}
