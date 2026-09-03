import React from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';
import { FacilityGallery } from '@/components/FacilityGallery';
import { FacilityMap } from '@/components/FacilityMap';
import { API_BASE } from '@/lib/api';

const API      = API_BASE;
const SITE_URL = 'https://app.mmtcare.com.au';

const CARE_LABELS: Record<string, string> = {
  personal_care: 'Personal care',
  nursing: 'Nursing support',
  behavioural_support: 'Behavioural support',
  complex_medical: 'Complex medical support',
  overnight_support: 'Overnight support',
  '24h_support': '24-hour support',
};

const TYPE_LABELS: Record<string, string> = {
  SIL: 'Supported Independent Living',
  SDA: 'Specialist Disability Accommodation',
  STA: 'Short-Term Accommodation',
};

interface FacilityDetailsPageProps {
  params: { id: string };
}

// ── Dynamic metadata per facility ─────────────────────────────
export async function generateMetadata({ params }: FacilityDetailsPageProps): Promise<Metadata> {
  try {
    const res = await fetch(`${API}/public/facilities/${params.id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return {};
    const { data: f } = await res.json();
    const image = f.image_urls?.[0] ?? f.image_url ?? 'https://mmtcare.com.au/wp-content/uploads/2026/02/MMT-CARE-LOGO.webp';
    const title = `${f.name} — ${f.type} in ${f.suburb}, ${f.state} | MMT Care`;
    const description = f.description
      ? f.description.slice(0, 160)
      : `${f.available_beds} bed${f.available_beds !== 1 ? 's' : ''} available at ${f.name}, a ${f.type} home in ${f.suburb} ${f.state}. Request a placement via MMT Care Connect.`;
    return {
      title,
      description,
      openGraph: {
        title, description, type: 'website',
        url: `${SITE_URL}/find/facilities/${params.id}`,
        images: [{ url: image, width: 1200, height: 630, alt: f.name }],
      },
      twitter: { card: 'summary_large_image', title, description, images: [image] },
      alternates: { canonical: `${SITE_URL}/find/facilities/${params.id}` },
    };
  } catch { return {}; }
}

function aggregateSupportedCare(vacancies: any[]): string[] {
  const keys = new Set<string>();
  for (const v of vacancies ?? []) {
    if (v?.status !== 'available') continue;
    for (const [k, on] of Object.entries(v.care_level_supported ?? {})) {
      if (on) keys.add(k);
    }
  }
  return [...keys].map(k => CARE_LABELS[k] ?? k);
}

export default async function FacilityDetailsPage({ params }: FacilityDetailsPageProps) {
  const res = await fetch(`${API}/public/facilities/${params.id}`, { cache: 'no-store' });
  if (!res.ok) {
    return (
      <div className="listing">
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Home not found</h1>
        <p style={{ color: '#6B7280' }}>We couldn&rsquo;t load that listing. Head back to the search results.</p>
        <a href="/find/search" style={{ color: '#1A56CC', fontWeight: 600 }}>&larr; Back to search</a>
      </div>
    );
  }

  const f = (await res.json()).data;
  const images: string[] = f.image_urls?.length ? f.image_urls : f.image_url ? [f.image_url] : [];
  const supportedCare = aggregateSupportedCare(f.vacancies);
  const features: string[] = [
    ...(Array.isArray(f.amenities) ? f.amenities : []),
    ...(Array.isArray(f.features) ? f.features : []),
  ].filter(Boolean);

  const available = Number(f.available_beds) || 0;
  const total = Number(f.total_beds) || 0;
  const lat = f.latitude != null ? parseFloat(f.latitude) : null;
  const lng = f.longitude != null ? parseFloat(f.longitude) : null;
  const addressLine = [f.address, f.suburb, f.state, f.postcode].filter(Boolean).join(', ');
  const referralHref = `/find/submit?facility=${f.id}&name=${encodeURIComponent(f.name)}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: f.name,
    description: f.description ?? undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: f.address,
      addressLocality: f.suburb,
      addressRegion: f.state,
      postalCode: f.postcode ?? undefined,
      addressCountry: 'AU',
    },
    ...(lat && lng ? { geo: { '@type': 'GeoCoordinates', latitude: lat, longitude: lng } } : {}),
    telephone: f.contact_phone ?? undefined,
    email: f.contact_email ?? undefined,
    url: f.website_url ?? `${SITE_URL}/find/facilities/${f.id}`,
    image: images[0] ?? undefined,
    numberOfRooms: available,
  };

  return (
    <div className="listing">
      <Script id={`schema-facility-${f.id}`} type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <a href="/find/search" className="listing-back">&larr; Back to results</a>

      <FacilityGallery images={images} name={f.name} />

      {/* ── Identity ────────────────────────────────── */}
      <div className="listing-head">
        <div className="listing-badges">
          <span className="listing-badge listing-badge-type">{f.type}</span>
          {available > 0
            ? <span className="listing-badge listing-badge-available">● Available</span>
            : <span className="listing-badge listing-badge-full">Currently full</span>}
        </div>
        <h1 className="listing-title">{f.name}</h1>
        <div className="listing-place">{f.suburb}, {f.state}</div>
        {available > 0 && (
          <div className="listing-vacancy-count">
            {available} vacanc{available === 1 ? 'y' : 'ies'} available
          </div>
        )}
      </div>

      {/* ── Facts ───────────────────────────────────── */}
      <div className="listing-facts">
        <div className="listing-fact">
          <div className="listing-fact-value" style={{ color: available > 0 ? '#16A34A' : '#111827' }}>{available}</div>
          <div className="listing-fact-label">Available</div>
        </div>
        {total > 0 && (
          <div className="listing-fact">
            <div className="listing-fact-value">{total}</div>
            <div className="listing-fact-label">Total beds</div>
          </div>
        )}
        <div className="listing-fact">
          <div className="listing-fact-value" style={{ fontSize: 20 }}>{f.type}</div>
          <div className="listing-fact-label">{TYPE_LABELS[f.type] ?? 'Accommodation'}</div>
        </div>
      </div>

      {/* ── About ───────────────────────────────────── */}
      {f.description && (
        <section className="listing-section">
          <h2 className="listing-section-title">About this home</h2>
          <p className="listing-prose">{f.description}</p>
          {f.tenant_profile && <p className="listing-prose" style={{ color: '#6B7280' }}>{f.tenant_profile}</p>}
        </section>
      )}

      {/* ── Support ─────────────────────────────────── */}
      {supportedCare.length > 0 && (
        <section className="listing-section">
          <h2 className="listing-section-title">Support available</h2>
          <ul className="listing-check-list">
            {supportedCare.map(item => <li key={item}>{item}</li>)}
          </ul>
          {f.eligibility && (
            <p className="listing-prose" style={{ color: '#6B7280', marginTop: 12 }}>
              <strong>Eligibility:</strong> {f.eligibility}
            </p>
          )}
        </section>
      )}

      {/* ── Features ────────────────────────────────── */}
      {features.length > 0 && (
        <section className="listing-section">
          <h2 className="listing-section-title">Home features</h2>
          <div className="listing-chips">
            {features.map(x => <span key={x} className="listing-chip">{x}</span>)}
          </div>
        </section>
      )}

      {/* ── Location ────────────────────────────────── */}
      <section className="listing-section">
        <h2 className="listing-section-title">Location</h2>
        <div className="listing-place" style={{ marginBottom: 12 }}>{f.suburb}, {f.state}</div>
        {lat != null && lng != null && (
          <FacilityMap lat={lat} lng={lng} label={f.name} />
        )}
        {addressLine && <p className="listing-prose" style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>{addressLine}</p>}
      </section>

      {/* ── Need help ───────────────────────────────── */}
      <section className="listing-section">
        <h2 className="listing-section-title">Need help?</h2>
        <p className="listing-prose">
          Our team can help you understand whether this home may be suitable and walk you through the next steps.
        </p>
        <div className="listing-help-actions">
          {f.contact_phone && <a href={`tel:${String(f.contact_phone).replace(/\s+/g, '')}`} className="listing-btn listing-btn-outline">Call {f.contact_phone}</a>}
          <a href="/find/submit" className="listing-btn listing-btn-outline">Contact MMT Care</a>
        </div>
      </section>

      {/* ── Referral CTA ────────────────────────────── */}
      <div className="listing-cta">
        <div className="listing-cta-title">Interested in this home?</div>
        <p className="listing-cta-copy">
          Submit a referral and our coordinators will help with the next steps. No account needed.
        </p>
        <a href={referralHref} className="listing-btn listing-btn-primary">Request placement &rarr;</a>
      </div>

      {/* ── Sticky mobile CTA ───────────────────────── */}
      <a href={referralHref} className="mobile-cta-bar">Request placement &rarr;</a>
    </div>
  );
}
