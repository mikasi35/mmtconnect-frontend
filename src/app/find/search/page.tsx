'use client';
import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { resolvePublicImage, API_BASE } from '@/lib/api';

const API = API_BASE;

const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'SIL', label: 'SIL — Supported Living' },
  { value: 'SDA', label: 'SDA — Specialist Housing' },
  { value: 'STA', label: 'STA — Respite / Short-term' },
];

const CARE_OPTIONS = [
  { key: 'personal_care', label: 'Personal care' },
  { key: 'nursing', label: 'Nursing support' },
  { key: 'behavioural_support', label: 'Behavioural support' },
  { key: 'complex_medical', label: 'Complex medical' },
  { key: 'overnight_support', label: 'Overnight support' },
  { key: '24h_support', label: '24-hour support' },
];

const CARE_LABELS: Record<string, string> = Object.fromEntries(
  CARE_OPTIONS.map(o => [o.key, o.label]),
);

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'beds', label: 'Most beds' },
  { value: 'name', label: 'Name (A–Z)' },
];

function VacancyCard({ f }: { f: any }) {
  const img = f.image_urls?.[0] || f.image_url;
  const available = Number(f.available_beds) || 0;
  const total = Number(f.total_beds) || 0;
  const supports = Object.entries(f.supported_care ?? {})
    .filter(([, v]) => v)
    .map(([k]) => CARE_LABELS[k] ?? k);

  return (
    <a href={`/find/facilities/${f.id}`} className="vacancy-card">
      <div className="vacancy-card-media">
        {img
          ? <img src={resolvePublicImage(img)} alt={f.name} loading="lazy" />
          : <div className="vacancy-card-media-empty" />}
        <span className={`vacancy-card-badge ${available > 0 ? 'is-available' : 'is-full'}`}>
          {available > 0 ? '● Available' : 'Full'}
        </span>
      </div>
      <div className="vacancy-card-body">
        <div className="vacancy-card-type">{f.type}</div>
        <h3 className="vacancy-card-name">{f.name}</h3>
        <div className="vacancy-card-place">{f.suburb}, {f.state}</div>
        <div className="vacancy-card-meta">
          {available} bed{available === 1 ? '' : 's'} available{total > 0 ? ` · ${total} total` : ''}
        </div>
        {supports.length > 0 && (
          <div className="vacancy-card-supports">
            {supports.slice(0, 3).map(s => <span key={s}>✓ {s}</span>)}
            {supports.length > 3 && <span className="muted">+{supports.length - 3} more</span>}
          </div>
        )}
        <span className="vacancy-card-link">View vacancy &rarr;</span>
      </div>
    </a>
  );
}

function SearchContent() {
  const sp = useSearchParams();

  const [type, setType] = useState(sp.get('type') ?? '');
  const [state, setState] = useState(sp.get('state') ?? '');
  const [careNeeds, setCareNeeds] = useState<Record<string, boolean>>({});
  const [sort, setSort] = useState('recommended');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [touched, setTouched] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedNeeds = useMemo(
    () => Object.entries(careNeeds).filter(([, v]) => v).map(([k]) => k),
    [careNeeds],
  );
  const activeCount = (type ? 1 : 0) + (state ? 1 : 0) + selectedNeeds.length;

  const doSearch = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      if (state) params.set('state', state);
      if (selectedNeeds.length) params.set('care_needs', selectedNeeds.join(','));
      const res = await fetch(`${API}/public/facilities?${params}`);
      const json = await res.json();
      setResults(Array.isArray(json.data) ? json.data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [type, state, selectedNeeds]);

  // Live search: run on any filter change (debounced), or once on load if the URL carries filters
  useEffect(() => {
    const urlFilters = !!(sp.get('type') || sp.get('state'));
    if (!touched && !urlFilters) return;
    const t = setTimeout(doSearch, touched ? 250 : 0);
    return () => clearTimeout(t);
  }, [touched, doSearch, sp]);

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sheetOpen]);

  const mark = () => setTouched(true);
  const toggleCare = (key: string) => { mark(); setCareNeeds(p => ({ ...p, [key]: !p[key] })); };
  const clearFilters = () => { mark(); setType(''); setState(''); setCareNeeds({}); };

  const sorted = useMemo(() => {
    const list = [...results];
    if (sort === 'beds') list.sort((a, b) => (Number(b.available_beds) || 0) - (Number(a.available_beds) || 0));
    if (sort === 'name') list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return list;
  }, [results, sort]);

  const contextLabel = [
    state || null,
    type || null,
    selectedNeeds.length ? `${selectedNeeds.length} support need${selectedNeeds.length === 1 ? '' : 's'}` : null,
  ].filter(Boolean).join(' · ') || 'All available vacancies';

  const filters = (
    <>
      <div className="filter-sheet-head">
        <span>Filters</span>
        <button type="button" aria-label="Close filters" onClick={() => setSheetOpen(false)}>&times;</button>
      </div>

      <div className="filter-group">
        <div className="filter-group-title">Accommodation type</div>
        {TYPE_OPTIONS.map(o => (
          <label key={o.value} className="filter-radio">
            <input type="radio" name="type" checked={type === o.value}
              onChange={() => { mark(); setType(o.value); }} />
            {o.label}
          </label>
        ))}
      </div>

      <div className="filter-group">
        <div className="filter-group-title">State</div>
        <select className="filter-select" value={state}
          onChange={e => { mark(); setState(e.target.value); }}>
          <option value="">All states</option>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="filter-group">
        <div className="filter-group-title">Support needs</div>
        {CARE_OPTIONS.map(o => (
          <label key={o.key} className="filter-check">
            <input type="checkbox" checked={!!careNeeds[o.key]} onChange={() => toggleCare(o.key)} />
            {o.label}
          </label>
        ))}
      </div>

      <div className="filter-actions">
        {activeCount > 0 && (
          <button type="button" className="filter-clear" onClick={clearFilters}>Clear filters</button>
        )}
        <button type="button" className="filter-apply" onClick={() => setSheetOpen(false)}>
          {loading ? 'Searching…' : `Show ${sorted.length} vacanc${sorted.length === 1 ? 'y' : 'ies'}`}
        </button>
      </div>
    </>
  );

  return (
    <div className="results-page">
      <div className="results-header">
        <div>
          <h1 className="results-count">
            {loading && !results.length
              ? 'Searching…'
              : hasSearched
                ? `${sorted.length} vacanc${sorted.length === 1 ? 'y' : 'ies'}`
                : 'Find NDIS accommodation'}
          </h1>
          <div className="results-context">{hasSearched ? contextLabel : 'Real-time vacancies across Australia'}</div>
        </div>
        <div className="results-controls">
          <button type="button" className="filter-toggle" onClick={() => setSheetOpen(true)}>
            Filters{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
          <label className="sort-control">
            <span>Sort</span>
            <select value={sort} onChange={e => setSort(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="results-layout">
        <aside className={`results-sidebar${sheetOpen ? ' is-open' : ''}`}>{filters}</aside>
        {sheetOpen && <div className="filter-backdrop" onClick={() => setSheetOpen(false)} />}

        <div className="results-list">
          {loading && (
            <div className="results-skeletons">
              {[0, 1, 2].map(i => <div key={i} className="vacancy-card-skeleton" />)}
            </div>
          )}

          {!loading && !hasSearched && (
            <div className="results-empty">
              <p>Choose an accommodation type, a state or a support need to see available vacancies.</p>
            </div>
          )}

          {!loading && hasSearched && sorted.length === 0 && (
            <div className="results-empty">
              <h3>No vacancies match those filters</h3>
              <p>Try a different state or type, or remove a support need.</p>
              <a href="/find/submit" className="listing-btn listing-btn-primary">Submit a referral — we&rsquo;ll search our network</a>
            </div>
          )}

          {!loading && sorted.length > 0 && (
            <>
              <div className="results-grid">
                {sorted.map(f => <VacancyCard key={f.id} f={f} />)}
              </div>
              <div className="results-help">
                <div>
                  <strong>Can&rsquo;t find the right home?</strong>
                  <span> Submit a referral and our coordinators will search their full network for you.</span>
                </div>
                <a href="/find/submit" className="listing-btn listing-btn-primary">Submit referral</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="results-page"><div className="results-empty"><p>Loading…</p></div></div>}>
      <SearchContent />
    </Suspense>
  );
}
