import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { RouteProgress } from '@/components/RouteProgress';

const LOGO = '/logo.png';
const SITE_URL = 'https://app.mmtcare.com.au';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'MMT Care Connect — NDIS Accommodation & Placement Platform',
    template: '%s | MMT Care Connect',
  },
  description:
    'Find available SDA, SIL and STA accommodation for NDIS participants across Australia. Submit referrals, track placements and connect with MMT Care coordinators instantly.',
  keywords: [
    'NDIS accommodation', 'SDA housing', 'SIL accommodation', 'STA respite',
    'disability housing Australia', 'NDIS placement', 'specialist disability accommodation',
    'supported independent living', 'MMT Care', 'NDIS referral',
  ],
  authors: [{ name: 'MMT Care', url: 'https://mmtcare.com.au' }],
  creator: 'MMT Care',
  publisher: 'MMT Care',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  // Favicon / touch icon come from src/app/icon.png and src/app/apple-icon.png
  openGraph: {
    type:        'website',
    siteName:    'MMT Care Connect',
    url:         SITE_URL,
    title:       'MMT Care Connect — NDIS Accommodation & Placement',
    description: 'Find SDA, SIL and STA accommodation vacancies across Australia. Connect families and coordinators with MMT Care.',
    images:      [{ url: LOGO, width: 512, height: 512, alt: 'MMT Care Connect' }],
  },
  twitter: {
    card:        'summary',
    site:        '@mmtcare',
    title:       'MMT Care Connect',
    description: 'Find NDIS accommodation vacancies across Australia.',
    images:      [LOGO],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RouteProgress />
        {children}
      </body>
    </html>
  );
}
