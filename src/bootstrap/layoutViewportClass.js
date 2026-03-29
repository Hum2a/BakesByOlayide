/**
 * Toggles html.layout-narrow for mobile layout (see viewport-narrow.css).
 *
 * Opera GX / some DevTools device modes report window.innerWidth as the FULL browser
 * width while visualViewport.width and documentElement.clientWidth match the emulated
 * device. Using Math.max() on those values wrongly picked the desktop width — fixed
 * by using Math.min() of positive readings OR matchMedia (same as CSS).
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
