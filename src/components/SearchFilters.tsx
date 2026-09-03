'use client';
import { CareNeedIcon } from './ui';

export const CARE_OPTIONS = [
  { key: 'personal_care', label: 'Personal care' },
  { key: 'nursing', label: 'Nursing support' },
  { key: 'behavioural_support', label: 'Behavioural support' },
  { key: 'complex_medical', label: 'Complex medical' },
  { key: 'overnight_support', label: 'Overnight support' },
  { key: '24h_support', label: '24-hour support' },
];

export const CARE_LABELS: Record<string, string> = Object.fromEntries(
  CARE_OPTIONS.map(o => [o.key, o.label]),
);

export const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

const STATE_NAMES: Record<string, string> = {
  NSW: 'New South Wales', VIC: 'Victoria', QLD: 'Queensland', WA: 'Western Australia',
  SA: 'South Australia', TAS: 'Tasmania', ACT: 'ACT', NT: 'Northern Territory',
};

interface Props {
  type: string;
  state: string;
  careNeeds: Record<string, boolean>;
  onType: (v: string) => void;
  onState: (v: string) => void;
  onToggleCare: (key: string) => void;
  onSubmit?: () => void;
  submitLabel?: string;
  loading?: boolean;
}

export function SearchFilters({
  type, state, careNeeds, onType, onState, onToggleCare, onSubmit, submitLabel = 'Search', loading,
}: Props) {
  return (
    <div className="sf">
      <div className={`sf-row${onSubmit ? ' has-submit' : ''}`}>
        <label className="sf-field">
          <span className="sf-label">Type of home</span>
          <select className="sf-select" value={type} onChange={e => onType(e.target.value)}>
            <option value="">Any type</option>
            <option value="SIL">SIL — Supported Independent Living</option>
            <option value="SDA">SDA — Specialist Disability Accommodation</option>
            <option value="STA">STA — Short-term / respite</option>
          </select>
        </label>

        <label className="sf-field">
          <span className="sf-label">Where</span>
          <select className="sf-select" value={state} onChange={e => onState(e.target.value)}>
            <option value="">Anywhere in Australia</option>
            {STATES.map(s => <option key={s} value={s}>{STATE_NAMES[s]}</option>)}
          </select>
        </label>

        {onSubmit && (
          <button type="button" className="sf-submit" onClick={onSubmit} disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {loading ? 'Searching…' : submitLabel}
          </button>
        )}
      </div>

      <div className="sf-needs">
        <span className="sf-label">Support needs <span className="sf-label-hint">(optional)</span></span>
        <div className="sf-chips">
          {CARE_OPTIONS.map(o => {
            const active = !!careNeeds[o.key];
            return (
              <button
                key={o.key}
                type="button"
                className={`sf-chip${active ? ' is-active' : ''}`}
                aria-pressed={active}
                onClick={() => onToggleCare(o.key)}
              >
                <CareNeedIcon name={o.key} size={16} color={active ? '#ffffff' : '#1A56CC'} />
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
