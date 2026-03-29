/**
 * Toggles html.layout-narrow (see viewport-narrow.css, mobile-first sheets, and
 * public/index.html inline script — keep breakpoint + width logic in sync).
 *
 * Opera GX / some DevTools modes report window.innerWidth as the full window width
 * while visualViewport / clientWidth match the emulated device; use Math.min of
 * positive readings and matchMedia(max-width).
 */
const BREAKPOINT = 900;

export function syncLayoutViewportNarrow() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  let narrow = false;
  try {
    narrow = window.matchMedia(`(max-width: ${BREAKPOINT}px)`).matches;
  } catch (_) {
    /* ignore */
  }

  const parts = [];
  const vv = window.visualViewport;
  if (vv && vv.width > 0) parts.push(vv.width);
  if (window.innerWidth > 0) parts.push(window.innerWidth);
  const cw = document.documentElement.clientWidth;
  if (cw > 0) parts.push(cw);

  if (parts.length > 0) {
    const wMin = Math.min(...parts);
    narrow = narrow || wMin <= BREAKPOINT;
  }

  document.documentElement.classList.toggle('layout-narrow', narrow);
}

syncLayoutViewportNarrow();

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const run = () => syncLayoutViewportNarrow();

  window.addEventListener('resize', run, { passive: true });
  window.addEventListener('orientationchange', run, { passive: true });

  let mq;
  try {
    mq = window.matchMedia(`(max-width: ${BREAKPOINT}px)`);
  } catch (_) {
    mq = null;
  }
  if (mq) {
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', run);
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(run);
    }
  }

  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener('resize', run, { passive: true });
    vv.addEventListener('scroll', run, { passive: true });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') run();
  });

  window.requestAnimationFrame(run);
  window.requestAnimationFrame(() => window.requestAnimationFrame(run));
  window.setTimeout(run, 0);
  window.setTimeout(run, 50);
  window.setTimeout(run, 250);
}
