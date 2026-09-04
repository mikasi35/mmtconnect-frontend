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
  domestic_assistance: 'Domestic assistance',
  community_access: 'Community access',
  therapy_services: 'Therapy services',
};

const AMENITY_LABELS: Record<string, string> = {
  ensuite_bathroom: 'Ensuite bathroom',
  extra_bathrooms: 'Extra bathrooms',
  accessible_kitchen: 'Accessible kitchen',
  large_living_area: 'Large living area',
  alfresco_outdoor: 'Alfresco / outdoor area',
  double_garage: 'Double garage',
  single_garage: 'Single garage',
  ducted_ac: 'Ducted air conditioning',
  split_system_ac: 'Split system air conditioning',
  beautiful_gardens: 'Beautiful gardens',
  fully_furnished: 'Fully furnished',
  backup_power: 'Backup power supply',
  out_of_hours_access: 'Out-of-hours access (OOA)',
  overnight_support_24_7: '24/7 overnight support',
  registered_nurse: 'Registered nurse support',
  clinical_support: 'Clinical support staff',
  wheelchair_accessible: 'Wheelchair accessible',
  ceiling_hoist: 'Ceiling hoist',
  pool: 'Swimming pool',
  gym: 'Gym / exercise room',
  sensory_room: 'Sensory room',
  therapy_room: 'Therapy room',
};

const TYPE_LABELS: Record<string, string> = {
  SIL: 'Supported Independent Living',
  SDA: 'Specialist Disability Accommodation',
  STA: 'Short-Term Accommodation',
};

const careLabel = (k: string) => CARE_LABELS[k] ?? k.replace(/_/g, ' ');

interface FacilityDetailsPageProps {
  params: { id: string };
}

// ── Dynamic metadata per facility ─────────────────────────────
export async function generateMetadata({ params }: FacilityDetailsPageProps): Promise<Metadata> {
  try {
    const res = await fetch(`${API}/public/facilities/${params.id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return {};
    const { data: f } = await res.json();
    const image = f.image_urls?.[0] ?? f.image_url ?? `${SITE_URL}/logo.png`;
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

/** Every care level this home supports — from its beds and its `care_types`. */
function allSupportedCare(f: any): string[] {
  const keys = new Set<string>();
  for (const c of Array.isArray(f.care_types) ? f.care_types : []) keys.add(c);
  for (const v of f.vacancies ?? []) {
    for (const [k, on] of Object.entries(v.care_level_supported ?? {})) if (on) keys.add(k);
  }
  return [...keys].map(careLabel);
}

function fmtDate(d?: string) {
  if (!d) return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
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

  const amenities: string[] = (Array.isArray(f.amenities) ? f.amenities : []).map((a: string) => AMENITY_LABELS[a] ?? a.replace(/_/g, ' '));
  const featureBullets: string[] = (Array.isArray(f.features) ? f.features : []).filter(Boolean);
  const supportedCare = allSupportedCare(f);

  const available = Number(f.available_beds) || 0;
  const total = Number(f.total_beds) || 0;
  const lat = f.latitude != null ? parseFloat(f.latitude) : null;
  const lng = f.longitude != null ? parseFloat(f.longitude) : null;
  const addressLine = [f.address, f.suburb, f.state, f.postcode].filter(Boolean).join(', ');
  const referralHref = `/find/submit?facility=${f.id}&name=${encodeURIComponent(f.name)}`;

  const rank = (v: any) => (v.status === 'available' ? 0 : 1);
  const beds: any[] = (Array.isArray(f.vacancies) ? f.vacancies : [])
    .slice()
    .sort((a: any, b: any) => rank(a) - rank(b)
      || String(a.label ?? '').localeCompare(String(b.label ?? ''), undefined, { numeric: true }));

  const bedroomFact = featureBullets.find(x => /^\s*\d+\s+bedrooms?\s*$/i.test(x))?.match(/\d+/)?.[0];
  const bathroomFact = featureBullets.find(x => /^\s*\d+\s+bathrooms?\s*$/i.test(x))?.match(/\d+/)?.[0];

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
    numberOfRooms: total || available,
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
          {f.sda_design_category && (
            <span className="listing-badge" style={{ background: '#EEF2FF', color: '#3730A3' }}>{f.sda_design_category}</span>
          )}
          {available > 0
            ? <span className="listing-badge listing-badge-available">● Available</span>
            : <span className="listing-badge listing-badge-full">Currently full</span>}
        </div>
        <h1 className="listing-title">{f.name}</h1>
        <div className="listing-place">{f.suburb}, {f.state}</div>
        {available > 0 ? (
          <div className="listing-vacancy-count">
            {available} vacanc{available === 1 ? 'y' : 'ies'} available
          </div>
        ) : (
          <div className="listing-vacancy-count" style={{ color: '#92400E' }}>
            No vacancies right now{total > 0 ? ` · ${total} bed${total === 1 ? '' : 's'}` : ''} — ask about the waitlist
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
            <div className="listing-fact-label">{total === 1 ? 'Bed' : 'Beds'} total</div>
          </div>
        )}
        {bedroomFact && (
          <div className="listing-fact">
            <div className="listing-fact-value">{bedroomFact}</div>
            <div className="listing-fact-label">{bedroomFact === '1' ? 'Bedroom' : 'Bedrooms'}</div>
          </div>
        )}
        {bathroomFact && (
          <div className="listing-fact">
            <div className="listing-fact-value">{bathroomFact}</div>
            <div className="listing-fact-label">{bathroomFact === '1' ? 'Bathroom' : 'Bathrooms'}</div>
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
          <p className="listing-prose" style={{ whiteSpace: 'pre-line' }}>{f.description}</p>
        </section>
      )}

      {/* ── Support available ───────────────────────── */}
      {(supportedCare.length > 0 || f.eligibility) && (
        <section className="listing-section">
          <h2 className="listing-section-title">Support available</h2>
          {supportedCare.length > 0 && (
            <ul className="listing-check-list">
              {supportedCare.map(item => <li key={item}>{item}</li>)}
            </ul>
          )}
          {f.eligibility && (
            <p className="listing-prose" style={{ color: '#6B7280', marginTop: supportedCare.length ? 12 : 0 }}>
              <strong>Eligibility:</strong> {f.eligibility}
            </p>
          )}
        </section>
      )}

      {/* ── Amenities ───────────────────────────────── */}
      {amenities.length > 0 && (
        <section className="listing-section">
          <h2 className="listing-section-title">Amenities</h2>
          <div className="listing-chips">
            {amenities.map(x => <span key={x} className="listing-chip" style={{ textTransform: 'capitalize' }}>{x}</span>)}
          </div>
        </section>
      )}

      {/* ── Home features ───────────────────────────── */}
      {featureBullets.length > 0 && (
        <section className="listing-section">
          <h2 className="listing-section-title">Home features</h2>
          <ul className="listing-check-list">
            {featureBullets.map(x => <li key={x}>{x}</li>)}
          </ul>
        </section>
      )}

      {/* ── Rooms & availability ────────────────────── */}
      {beds.length > 0 && (
        <section className="listing-section">
          <h2 className="listing-section-title">Rooms &amp; availability</h2>
          <div className="listing-rooms">
            {beds.map((v, i) => {
              const isAvail = v.status === 'available';
              const careKeys = Object.entries(v.care_level_supported ?? {}).filter(([, on]) => on).map(([k]) => careLabel(k));
              const from = isAvail ? fmtDate(v.start_date) : null;
              return (
                <div key={v.id ?? i} className="listing-room">
                  <div className="listing-room-head">
                    <span className="listing-room-name">{v.label || `Bedroom ${i + 1}`}</span>
                    <span className={`listing-room-status ${isAvail ? 'is-available' : 'is-full'}`}>
                      {isAvail ? 'Available' : 'Occupied'}
                    </span>
                  </div>
                  {from && <div className="listing-room-meta">Available from {from}</div>}
                  {careKeys.length > 0 && (
                    <div className="listing-chips" style={{ marginTop: 8 }}>
                      {careKeys.map(k => <span key={k} className="listing-chip">{k}</span>)}
                    </div>
                  )}
                  {v.notes && !/^currently tenanted$/i.test(String(v.notes).trim()) && (
                    <div className="listing-room-meta" style={{ marginTop: 6 }}>{v.notes}</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Who lives here ──────────────────────────── */}
      {f.tenant_profile && (
        <section className="listing-section">
          <h2 className="listing-section-title">Who lives here</h2>
          <p className="listing-prose" style={{ whiteSpace: 'pre-line' }}>{f.tenant_profile}</p>
          <p className="listing-prose" style={{ color: '#6B7280', fontSize: 13, marginTop: 8 }}>
            A coordinator will talk through whether the household is a good match before any placement.
          </p>
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
          {f.website_url && <a href={f.website_url} target="_blank" rel="noopener noreferrer" className="listing-btn listing-btn-outline">Visit website</a>}
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
