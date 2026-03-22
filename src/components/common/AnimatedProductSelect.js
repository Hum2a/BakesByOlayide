import React, { useState, useRef, useEffect, useId } from 'react';
import { FaChevronDown } from 'react-icons/fa';

/**
 * Custom select with animated panel (native <select> lists cannot be styled).
 * @param {string} value
 * @param {(value: string) => void} onChange
 * @param {{ value: string, label: string }[]} options
 * @param {string} [id] — for <label htmlFor>
 */
export default function AnimatedProductSelect({ id: idProp, value, onChange, options, className = '' }) {
  const autoId = useId();
  const baseId = idProp || `aps-${autoId.replace(/:/g, '')}`;
  const listboxId = `${baseId}-listbox`;
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected ? selected.label : options[0]?.label ?? '';

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (v) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={`specific-cake-dropdown-root${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`}
    >
      <button
        type="button"
        id={baseId}
        className="specific-cake-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="specific-cake-dropdown-trigger-label">{displayLabel}</span>
        <FaChevronDown className="specific-cake-dropdown-chevron" aria-hidden />
      </button>
      <div
        id={listboxId}
        role="listbox"
        className="specific-cake-dropdown-panel"
        aria-label="Options"
      >
        {options.map((opt, i) => (
          <button
            key={opt.value !== '' ? opt.value : `opt-${i}`}
            type="button"
            role="option"
            aria-selected={value === opt.value}
            className={`specific-cake-dropdown-option${value === opt.value ? ' is-selected' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              pick(opt.value);
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
