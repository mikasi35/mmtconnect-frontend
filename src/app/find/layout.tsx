import type { Metadata } from 'next';
import Script from 'next/script';

const LOGO     = 'https://mmtcare.com.au/wp-content/uploads/2026/02/MMT-CARE-LOGO.webp';
const SITE_URL = 'https://app.mmtcare.com.au';

export const metadata: Metadata = {
  title: {
    default:  'Find NDIS Accommodation — SDA, SIL & STA Vacancies | MMT Care',
    template: '%s | MMT Care Connect',
  },
  description:
    'Search available NDIS accommodation near you. SDA, SIL and STA vacancies across NSW, VIC, QLD, WA, SA and more. Submit a referral for your loved one today.',
  keywords: [
    'NDIS accommodation', 'SDA housing', 'SIL vacancies', 'STA respite',
    'disability housing', 'NDIS referral', 'MMT Care',
    'specialist disability accommodation', 'supported independent living',
    'find NDIS housing', 'disability accommodation near me',
  ],
  openGraph: {
    type:        'website',
    siteName:    'MMT Care Connect',
    url:         `${SITE_URL}/find`,
    title:       'Find NDIS Accommodation — SDA, SIL & STA | MMT Care',
    description: 'Available SDA, SIL and STA accommodation vacancies across Australia. Find the right home for your loved one.',
    images:      [{ url: LOGO, width: 400, height: 150, alt: 'MMT Care Connect' }],
  },
  alternates: { canonical: `${SITE_URL}/find` },
};

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'MMT Care',
  url: 'https://mmtcare.com.au',
  logo: LOGO,
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '1300-066-822',
    contactType: 'customer support',
    areaServed: 'AU',
    availableLanguage: 'English',
  },
  sameAs: [
    'https://mmtcare.com.au',
    'https://app.mmtcare.com.au',
  ],
};

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'MMT Care Connect',
  url: `${SITE_URL}/find`,
  description: 'Find available NDIS accommodation — SDA, SIL and STA vacancies across Australia.',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'AUD' },
  provider: orgSchema,
};

export default function FindLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="find-page-shell">
      <Script
        id="schema-org"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([orgSchema, webAppSchema]) }}
      />

      <nav className="public-nav">
        <a href="/find" className="public-nav-logo">
          <img
            src={LOGO}
            alt="MMT Care Connect — NDIS Accommodation Platform"
            style={{ height: '38px', width: 'auto', display: 'block' }}
            width={120} height={38}
          />
        </a>
        <div className="public-nav-pill">
          <a href="/find/search" className="nav-link">Search</a>
          <a href="/find/submit" className="nav-link">Submit Referral</a>
          <a href="/find/track"  className="nav-link">Track My Referral</a>
        </div>
        <a href="/login" className="nav-button">Coordinator login &rarr;</a>
      </nav>

      <main>{children}</main>

      <footer style={{
        background: '#1F2937', color: '#9CA3AF',
        padding: '40px 24px', textAlign: 'center', marginTop: 60,
      }}>
        <img src={LOGO} alt="MMT Care" style={{ height: 32, marginBottom: 12, opacity: 0.85 }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 6 }}>MMT Care Connect</div>
        <div style={{ fontSize: 12, marginBottom: 16, maxWidth: 480, margin: '0 auto 16px' }}>
          Helping families and coordinators find NDIS accommodation across Australia.
          SDA, SIL and STA vacancies updated in real time.
        </div>
        <div style={{ fontSize: 12, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px 24px', marginBottom: 16 }}>
          <a href="/find/search" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Search placements</a>
          <a href="/find/submit" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Submit referral</a>
          <a href="/find/track"  style={{ color: '#9CA3AF', textDecoration: 'none' }}>Track referral</a>
          <a href="tel:1300066822" style={{ color: '#9CA3AF', textDecoration: 'none' }}>1300 066 822</a>
          <a href="mailto:info@mmtcare.com.au" style={{ color: '#9CA3AF', textDecoration: 'none' }}>info@mmtcare.com.au</a>
        </div>
        <div style={{ fontSize: 11, color: '#4B5563' }}>
          © {new Date().getFullYear()} MMT Care Connect · NDIS registered provider coordination platform ·{' '}
          <a href="https://mmtcare.com.au" style={{ color: '#6B7280', textDecoration: 'none' }}>mmtcare.com.au</a>
        </div>
      </footer>
    </div>
  );
}
