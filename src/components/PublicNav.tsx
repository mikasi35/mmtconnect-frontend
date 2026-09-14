'use client';
import { usePathname } from 'next/navigation';

const LOGO = '/logo.png';

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 3 3 10.5l7 2.5 2 7L21 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M12.5 13.5 21 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="4.2" cy="6" r="1.3" fill="currentColor" />
      <path d="M8.5 6h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="4.2" cy="12" r="1.3" fill="currentColor" />
      <path d="M8.5 12h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="4.2" cy="18" r="1.3" fill="currentColor" />
      <path d="M8.5 18h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20c0-3.9 3.13-7 7-7s7 3.1 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const LINKS = [
  { href: '/find/search', label: 'Search', icon: SearchIcon, match: (p: string) => p === '/find' || p.startsWith('/find/search') || p.startsWith('/find/facilities') },
  { href: '/find/submit', label: 'Submit Referral', icon: SendIcon, match: (p: string) => p.startsWith('/find/submit') },
  { href: '/find/track', label: 'Track My Referral', icon: ListIcon, match: (p: string) => p.startsWith('/find/track') },
];

export function PublicNav() {
  const pathname = usePathname() ?? '/find';

  return (
    <nav className="public-nav">
      <a href="/find" className="public-nav-logo">
        <img
          src={LOGO}
          alt=""
          style={{ height: '32px', width: '32px', display: 'block', borderRadius: 8 }}
          width={32} height={32}
        />
        <span className="public-nav-wordmark">MMT Care Connect</span>
      </a>

      <div className="public-nav-links">
        {LINKS.map(({ href, label, icon: Icon, match }) => (
          <a key={href} href={href} className={`nav-link${match(pathname) ? ' active' : ''}`}>
            <Icon />
            <span>{label}</span>
          </a>
        ))}
      </div>

      <a href="/login" className="nav-button">
        <UserIcon />
        <span>Coordinator login &rarr;</span>
      </a>
    </nav>
  );
}
