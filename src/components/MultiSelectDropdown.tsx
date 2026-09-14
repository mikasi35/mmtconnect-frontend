'use client';
import { ReactNode, useEffect, useRef, useState } from 'react';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  icon?: ReactNode;
  label: string;
  options: MultiSelectOption[];
  /** Shown in the closed control and as the top "clear all" row when nothing is selected. */
  allLabel: string;
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  /** How many chips to render before collapsing the rest into "+N more". */
  maxChipsShown?: number;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
      style={{ flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}>
      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M2.5 7.2 5.4 10l6-6.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Compact multi-select: a closed control showing selected values as
 * removable chips (collapsing to "+N more" past `maxChipsShown`, or
 * `allLabel` when nothing is selected — an empty selection means "match
 * everything" upstream, this component just presents that state), plus a
 * checklist popover for picking any number of options.
 */
export function MultiSelectDropdown({
  icon, label, options, allLabel, selected, onChange, disabled, maxChipsShown = 3,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggleValue = (value: string) => {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  };

  const removeValue = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(v => v !== value));
  };

  const shown = selected.slice(0, maxChipsShown);
  const overflowCount = selected.length - shown.length;
  const labelFor = (value: string) => options.find(o => o.value === value)?.label ?? value;

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <label className="form-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 4, whiteSpace: 'nowrap' }}>
        {icon}{label}
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="form-select"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          width: '100%', textAlign: 'left', cursor: disabled ? 'default' : 'pointer', minHeight: 40, color: 'var(--gray-800)',
        }}
      >
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 5, flex: 1, minWidth: 0 }}>
          {selected.length === 0 ? (
            <span style={{ color: 'var(--gray-500)' }}>{allLabel}</span>
          ) : (
            <>
              {shown.map(v => (
                <span
                  key={v}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: 'var(--brand-light)', color: 'var(--brand)',
                    borderRadius: 6, padding: '2px 6px', fontSize: 12, fontWeight: 600,
                  }}
                >
                  {labelFor(v)}
                  <span
                    role="button"
                    aria-label={`Remove ${labelFor(v)}`}
                    tabIndex={-1}
                    onClick={e => removeValue(v, e)}
                    style={{ cursor: 'pointer', fontWeight: 700, lineHeight: 1, fontSize: 13 }}
                  >
                    ×
                  </span>
                </span>
              ))}
              {overflowCount > 0 && (
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', alignSelf: 'center' }}>
                  +{overflowCount} more
                </span>
              )}
            </>
          )}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 30,
            background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 10,
            boxShadow: '0 12px 32px rgba(15,23,42,0.14)', padding: 6, maxHeight: 260, overflowY: 'auto',
          }}
        >
          <button
            type="button"
            role="option"
            aria-selected={selected.length === 0}
            onClick={() => onChange([])}
            className="bolo-msd-option"
          >
            <span>{allLabel}</span>
            {selected.length === 0 && <CheckIcon />}
          </button>
          {options.map(o => {
            const active = selected.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => toggleValue(o.value)}
                className="bolo-msd-option"
              >
                <span>{o.label}</span>
                {active && <CheckIcon />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
