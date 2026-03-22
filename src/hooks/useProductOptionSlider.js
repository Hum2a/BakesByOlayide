import { useRef, useState, useLayoutEffect, useCallback, useEffect } from 'react';

/**
 * Sliding highlight for horizontal `.specific-cake-selector-options` button rows.
 * @param {number} selectedIndex
 * @param {number} optionCount — number of options (0 hides slider)
 */
export function useProductOptionSlider(selectedIndex, optionCount) {
  const trackRef = useRef(null);
  const btnRefs = useRef([]);
  const [slider, setSlider] = useState({ x: 0, w: 0, h: 0, visible: false });

  const assignBtnRef = useCallback((index) => (el) => {
    btnRefs.current[index] = el;
  }, []);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track || !optionCount) {
      setSlider((s) => ({ ...s, visible: false }));
      return;
    }
    const safeIdx = Math.min(Math.max(0, selectedIndex), optionCount - 1);
    const btn = btnRefs.current[safeIdx];
    if (!btn) return;
    setSlider({
      x: btn.offsetLeft,
      w: btn.offsetWidth,
      h: btn.offsetHeight,
      visible: true,
    });
  }, [selectedIndex, optionCount]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    const el = trackRef.current;
    const ro =
      el && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => measure()) : null;
    if (ro && el) ro.observe(el);
    return () => {
      window.removeEventListener('resize', measure);
      ro?.disconnect();
    };
  }, [measure]);

  const sliderStyle = {
    transform: `translateX(${slider.x}px)`,
    width: slider.w || 0,
    height: slider.h || 0,
    opacity: slider.visible ? 1 : 0,
  };

  return { trackRef, assignBtnRef, sliderStyle };
}
