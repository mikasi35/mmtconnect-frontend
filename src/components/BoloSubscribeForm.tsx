'use client';
import { useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { MultiSelectDropdown, MultiSelectOption } from './MultiSelectDropdown';

const TYPE_OPTIONS: MultiSelectOption[] = [
  { value: 'SIL', label: 'SIL' },
  { value: 'SDA', label: 'SDA' },
  { value: 'MTA', label: 'MTA' },
  { value: 'STA', label: 'STA' },
];

const STATE_OPTIONS: MultiSelectOption[] = [
  { value: 'NSW', label: 'NSW' },
  { value: 'VIC', label: 'VIC' },
  { value: 'QLD', label: 'QLD' },
  { value: 'WA',  label: 'WA' },
  { value: 'SA',  label: 'SA' },
  { value: 'TAS', label: 'TAS' },
  { value: 'ACT', label: 'ACT' },
  { value: 'NT',  label: 'NT' },
];

function HomeIcon({ size = 15, color = 'var(--gray-500)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12.5 12 5l8 7.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12.5v7.5h14v-7.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon({ size = 15, color = 'var(--gray-500)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.4" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

function BellIcon({ size = 15, color = 'var(--gray-500)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 10.5a6 6 0 0 1 12 0c0 3.5 1.2 4.9 2 5.7H4c.8-.8 2-2.2 2-5.7Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 18.5a2 2 0 0 0 4 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon({ size = 15, color = 'var(--gray-500)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" stroke={color} strokeWidth="1.8" />
      <path d="m4.5 7 7.5 6 7.5-6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BoltIcon({ size = 18, color = 'var(--brand)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill={color} />
    </svg>
  );
}

function TargetIcon({ size = 18, color = 'var(--brand)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1" fill={color} />
    </svg>
  );
}

function ArrowRightIcon({ size = 15, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12h15M13 6l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FeatureIndicator({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="bolo-feature">
      {icon}
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--gray-700)', lineHeight: 1.35 }}>
        {label}
      </span>
    </div>
  );
}

export function BoloSubscribeForm() {
  const [types, setTypes]     = useState<string[]>([]);
  const [states, setStates]   = useState<string[]>([]);
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(''); setSuccess('');
    if (!email.trim()) { setError('Please enter your email address'); return; }

    setLoading(true);
    try {
      const res = await api.public.subscribeBolo({
        email: email.trim(),
        facility_types: types.length ? types : undefined,
        states: states.length ? states : undefined,
      });
      setSuccess((res as any).data?.message || 'Check your email to confirm your BOLO alert subscription.');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bolo-card">
      <div className="bolo-decor bolo-decor-1" />
      <div className="bolo-decor bolo-decor-2" />

      {/* Badge + headline + copy */}
      <div className="bolo-intro">
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, background: '#4F46E5',
          borderRadius: 999, padding: '5px 12px 5px 10px', marginBottom: 18,
        }}>
          <BellIcon size={13} color="#fff" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 0.6 }}>BOLO</span>
        </div>

        <h2 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 10px', color: '#111827', lineHeight: 1.2 }}>
          Be the first to know.
        </h2>
        <p style={{ fontSize: 15, color: 'var(--gray-600)', lineHeight: 1.6, margin: '0 0 12px' }}>
          Get notified when a matching NDIS vacancy or listing becomes available.
        </p>
        <p style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.6, margin: 0 }}>
          Set your preferences below and we&apos;ll send you an email when something that matches your criteria is added.
        </p>
      </div>

      {/* Feature indicators — grid-relocated to the end on mobile via CSS */}
      <div className="bolo-features bolo-features-row">
        <FeatureIndicator icon={<BoltIcon />} label="Real-time updates" />
        <FeatureIndicator icon={<TargetIcon />} label="Customise your search" />
        <FeatureIndicator icon={<MailIcon size={18} color="var(--brand)" />} label="No account required" />
      </div>

      <div className="bolo-divider" />

      {/* The alert builder: WHAT + WHERE, WHEN, EMAIL */}
      <div className="bolo-form">
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
          I&apos;m looking for
        </div>

        <form onSubmit={submit}>
          <div className="bolo-two-col" style={{ marginBottom: 14 }}>
            <MultiSelectDropdown
              icon={<HomeIcon />}
              label="Accommodation types"
              allLabel="All accommodation types"
              options={TYPE_OPTIONS}
              selected={types}
              onChange={setTypes}
              disabled={loading}
            />
            <MultiSelectDropdown
              icon={<PinIcon />}
              label="Locations"
              allLabel="All locations"
              options={STATE_OPTIONS}
              selected={states}
              onChange={setStates}
              disabled={loading}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <BellIcon /> Notify me about
            </label>
            {/* The platform currently sends one merged alert (new listings and
                vacancy openings together) — a real, clickable select with the
                one supported option, rather than offering filters the
                backend doesn't support. */}
            <select className="form-select" value="both" onChange={() => {}}>
              <option value="both">New listings &amp; vacancy openings</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <MailIcon /> Email address
            </label>
            <input
              className="form-input"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', gap: 8, minHeight: 46, fontSize: 15 }}
          >
            <BellIcon size={15} color="#fff" />
            {loading ? 'Subscribing…' : 'Notify me'}
            {!loading && <ArrowRightIcon />}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--gray-500)', margin: '10px 0 0' }}>
            No account required · Unsubscribe anytime
          </p>

          {error && (
            <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginTop: 14 }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginTop: 14 }}>
              {success}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
