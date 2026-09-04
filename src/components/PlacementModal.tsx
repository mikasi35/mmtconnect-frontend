'use client';
import { useMemo, useState } from 'react';
import { Modal, Spinner, FacilityTypeBadge } from '@/components/ui';
import { api } from '@/lib/api';

const CARE_OPTIONS = [
  { key: 'personal_care',       label: 'Personal care' },
  { key: 'nursing',             label: 'Nursing' },
  { key: 'behavioural_support', label: 'Behavioural support' },
  { key: 'complex_medical',     label: 'Complex medical' },
  { key: 'overnight_support',   label: 'Overnight support' },
  { key: '24h_support',         label: '24h support' },
];

const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
const STATE_NAMES: Record<string, string> = {
  NSW: 'New South Wales', VIC: 'Victoria', QLD: 'Queensland', WA: 'Western Australia',
  SA: 'South Australia', TAS: 'Tasmania', ACT: 'ACT', NT: 'Northern Territory',
};

/** Best-effort: turn a free-text location preference into a state code. */
function guessState(pref?: string | null): string {
  if (!pref) return '';
  const up = pref.trim().toUpperCase();
  if (STATES.includes(up)) return up;
  for (const [code, name] of Object.entries(STATE_NAMES)) {
    if (up.includes(code) || up.includes(name.toUpperCase())) return code;
  }
  return '';
}

interface Props {
  referral: any | null;
  onClose: () => void;
  onPlaced: (facility: any) => void;
}

export function PlacementModal({ referral, onClose, onPlaced }: Props) {
  const initialCare = useMemo(() => {
    const c: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(referral?.care_needs ?? {})) if (v) c[k] = true;
    return c;
  }, [referral]);

  const [type, setType]           = useState('');
  const [state, setState]         = useState(() => guessState(referral?.location_preference));
  const [care, setCare]           = useState<Record<string, boolean>>(initialCare);
  const [results, setResults]     = useState<any[] | null>(null);
  const [loading, setLoading]     = useState(false);
  const [placingId, setPlacingId] = useState<string | null>(null);
  const [err, setErr]             = useState('');

  const careKeys = Object.keys(care).filter(k => care[k]);

  const runSearch = async () => {
    setLoading(true); setErr(''); setResults(null);
    try {
      const params: Record<string, string> = { has_availability: 'true', limit: '50' };
      if (type)  params.type = type;
      if (state) params.state = state;
      if (careKeys.length) params.care_needs = careKeys.join(',');
      const res = await api.facilities.list(params);
      setResults((res as any).data ?? []);
    } catch (e: any) {
      setErr(e.message || 'Could not load facilities');
    } finally {
      setLoading(false);
    }
  };

  const place = async (facility: any) => {
    setPlacingId(facility.id); setErr('');
    try {
      await api.referrals.update(referral.id, { status: 'placed', assigned_facility_id: facility.id });
      onPlaced(facility);
    } catch (e: any) {
      setErr(e.message || 'Placement failed');
      setPlacingId(null);
    }
  };

  const availableBeds = (f: any) =>
    (f.vacancies ?? []).filter((v: any) => v?.status === 'available').length;

  return (
    <Modal
      open={!!referral}
      onClose={onClose}
      title={referral ? `Place ${referral.client_name}` : 'Place'}
      width={620}
    >
      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Type of home</label>
          <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
            <option value="">Any type</option>
            <option value="SIL">SIL — Supported Independent Living</option>
            <option value="SDA">SDA — Specialist Disability Accommodation</option>
            <option value="STA">STA — Short-term / respite</option>
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">State</label>
          <select className="form-select" value={state} onChange={e => setState(e.target.value)}>
            <option value="">Anywhere</option>
            {STATES.map(s => <option key={s} value={s}>{STATE_NAMES[s]}</option>)}
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
        <label className="form-label">Care needs <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span></label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CARE_OPTIONS.map(o => {
            const active = !!care[o.key];
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => setCare(c => ({ ...c, [o.key]: !c[o.key] }))}
                style={{
                  fontSize: 12, fontWeight: 500, padding: '6px 11px', borderRadius: 16, cursor: 'pointer',
                  border: `1px solid ${active ? 'var(--brand)' : 'var(--gray-200)'}`,
                  background: active ? 'var(--brand)' : '#fff',
                  color: active ? '#fff' : 'var(--gray-600)',
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={runSearch}
        disabled={loading}
        style={{ width: '100%', justifyContent: 'center', marginTop: 16, minHeight: 44 }}
      >
        {loading ? <><Spinner size={14} /> Searching…</> : 'Search facilities'}
      </button>

      {err && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '9px 12px', borderRadius: 7, fontSize: 13, marginTop: 12 }}>
          {err}
        </div>
      )}

      {/* Results */}
      {results && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
            {results.length} {results.length === 1 ? 'facility' : 'facilities'} with open beds
          </div>
          {results.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--gray-500)', padding: '16px 0', textAlign: 'center' }}>
              No facilities match. Try removing a filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {results.map(f => (
                <div key={f.id} style={{
                  border: '0.5px solid var(--gray-200)', borderRadius: 10, padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{f.name}</span>
                      <FacilityTypeBadge type={f.type} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                      {[f.suburb, f.state].filter(Boolean).join(', ')} · {availableBeds(f)} bed{availableBeds(f) === 1 ? '' : 's'} available
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!!placingId}
                    onClick={() => place(f)}
                    style={{ flexShrink: 0, minHeight: 38 }}
                  >
                    {placingId === f.id ? <Spinner size={13} /> : 'Place here'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
