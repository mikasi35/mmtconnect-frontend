'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AccommodationTypeIcon, CareNeedIcon } from '@/components/ui';
import { SearchFilters, CARE_OPTIONS } from '@/components/SearchFilters';

const FACILITY_TYPES = [
  {
    type: 'SIL',
    name: 'Supported Independent Living',
    desc: 'Long-term accommodation with daily support staff to help with personal care, cooking, and community access.',
    color: '#EBF2FF', border: '#1A56CC', text: '#1A56CC',
  },
  {
    type: 'SDA',
    name: 'Specialist Disability Accommodation',
    desc: 'Purpose-built housing designed for people with extreme functional impairment or very high support needs.',
    color: '#F0FDF4', border: '#16A34A', text: '#166534',
  },
  {
    type: 'STA',
    name: 'Short-Term Accommodation',
    desc: 'Respite stays for NDIS participants, giving family carers a break while your loved one is well looked after.',
    color: '#FFF7ED', border: '#F97316', text: '#9A3412',
  },
];

export default function FindHomePage() {
  const router = useRouter();
  const [type, setType] = useState('');
  const [state, setState] = useState('');
  const [careNeeds, setCareNeeds] = useState<Record<string, boolean>>({});

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (state) params.set('state', state);
    const needs = Object.entries(careNeeds).filter(([, v]) => v).map(([k]) => k);
    if (needs.length) params.set('care_needs', needs.join(','));
    const query = params.toString();
    router.push(`/find/search${query ? `?${query}` : ''}`);
  };

  return (
    <div className="public-page-body hero-page-body">
      {/* Hero */}
      <div className="hero-section">
        <div className="hero-copyblock">
          <div className="hero-eyebrow">NDIS accommodation · Australia</div>
          <h1 className="hero-heading">Find the right NDIS home<br />for the right person</h1>
          <p className="hero-copy">
            Real-time SDA, SIL &amp; STA vacancies across Australia.
            Submit a referral in minutes — no account needed.
          </p>
          <div className="hero-trust">
            <span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="4" fill="currentColor" />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" opacity="0.5" />
              </svg>
              Real-time availability
            </span>
            <span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="m8.5 12 2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Verified NDIS providers
            </span>
            <span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="currentColor" />
              </svg>
              Referrals in minutes
            </span>
          </div>
        </div>

        <div className="hero-search-card">
          <SearchFilters
            type={type} state={state} careNeeds={careNeeds}
            onType={setType} onState={setState}
            onToggleCare={key => setCareNeeds(p => ({ ...p, [key]: !p[key] }))}
            onSubmit={handleSearch}
            submitLabel="Search homes"
          />
        </div>
      </div>

      {/* How it works */}
      <div className="section-block section-white">
        <div className="section-inner">
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, margin: '0 0 8px', color: '#111827' }}>
            Finding a placement is simple
          </h2>
          <p style={{ textAlign: 'center', color: '#6B7280', fontSize: 15, margin: '0 0 48px' }}>
            No appointments, no paperwork, no waiting on hold.
          </p>
          <div className="how-it-works-grid">
            {[
              { step: '1', title: 'Search vacancies', desc: 'Browse real-time bed availability filtered by care needs, location and accommodation type.' },
              { step: '2', title: 'Submit a referral', desc: 'Fill in a simple form about your loved one — no account needed. Takes less than 5 minutes.' },
              { step: '3', title: 'We contact you', desc: 'A coordinator reviews your referral and contacts you within 1 business day to discuss options.' },
            ].map(item => (
              <div key={item.step} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: '#EBF2FF', margin: '0 auto 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                  fontWeight: 700, color: '#1A56CC',
                }}>
                  {item.step}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1A56CC', letterSpacing: 0.7, marginBottom: 8 }}>
                  STEP {item.step}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: '#111827' }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Accommodation types */}
      <div className="section-block section-blue">
        <div className="section-inner">
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, margin: '0 0 8px', color: '#111827' }}>
            Types of NDIS accommodation
          </h2>
          <p style={{ textAlign: 'center', color: '#6B7280', fontSize: 15, margin: '0 0 40px' }}>
            Not sure what type your loved one needs? We can help you work it out.
          </p>
          <div className="facility-type-grid">
            {FACILITY_TYPES.map(ft => (
              <div key={ft.type} style={{
                background: ft.color, borderRadius: 14,
                border: `1.5px solid ${ft.border}22`, padding: '24px',
                cursor: 'pointer',
              }} onClick={() => router.push(`/find/search?type=${ft.type}`)}>
                <div style={{ fontSize: 36, marginBottom: 12 }}><AccommodationTypeIcon type={ft.type} size={36} /></div>
                <div style={{
                  display: 'inline-block', background: '#fff',
                  borderRadius: 5, padding: '2px 8px', fontSize: 11,
                  fontWeight: 700, color: ft.text, marginBottom: 10,
                  border: `1px solid ${ft.border}44`,
                }}>{ft.type}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px', color: '#111827' }}>{ft.name}</h3>
                <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.6, margin: '0 0 16px' }}>{ft.desc}</p>
                <span style={{ fontSize: 13, fontWeight: 600, color: ft.text }}>Search {ft.type} vacancies →</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Care needs explainer */}
      <div className="section-block section-white">
        <div className="section-inner section-split">
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 12px', color: '#111827' }}>
              Filter by your loved one's care needs
            </h2>
            <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.7, margin: '0 0 24px' }}>
              Every person is different. Our search lets you find accommodation that specifically
              supports your loved one's care requirements — so you only see facilities that are actually suitable.
            </p>
            <button onClick={() => router.push('/find/search')} style={{
              background: '#1A56CC', color: '#fff', border: 'none', borderRadius: 10,
              padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>
              Search by care needs
            </button>
          </div>
          <div className="care-options-grid">
            {CARE_OPTIONS.map(opt => (
              <div key={opt.key} style={{
                background: '#F8FAFF', borderRadius: 10, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
                border: '0.5px solid #E5E7EB',
              }}>
                <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: '#fff' }}>
                  <CareNeedIcon name={opt.key} size={20} color="#1A56CC" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Urgency CTA */}
      <div className="urgent-cta">
        <div className="urgent-cta-content">
          <div style={{ width: 48, height: 48, borderRadius: 16, background: '#FEE2E2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#991B1B', fontSize: 24, fontWeight: 700, marginBottom: 14 }}>
            !
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>
            Need urgent placement?
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', margin: 0, maxWidth: 680 }}>
            If your loved one needs accommodation urgently — hospital discharge, unsafe living situation, or carer breakdown — submit an urgent referral now and we'll prioritise it immediately.
          </p>
        </div>
        <button onClick={() => router.push('/find/submit?urgency=immediate')} style={{
          background: '#fff', color: '#1A3A8F', border: 'none',
          borderRadius: 12, padding: '16px 32px', fontSize: 16,
          fontWeight: 800, cursor: 'pointer', minWidth: 220,
        }}>
          Submit urgent referral
        </button>
      </div>
    </div>
  );
}
