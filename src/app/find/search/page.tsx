'use client';
import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { resolvePublicImage, API_BASE } from '@/lib/api';
import { SearchFilters, CARE_LABELS } from '@/components/SearchFilters';

const API = API_BASE;

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
  const [careNeeds, setCareNeeds] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    (sp.get('care_needs') ?? '').split(',').filter(Boolean).forEach(k => { init[k] = true; });
    return init;
  });
  const [sort, setSort] = useState('recommended');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const selectedNeeds = useMemo(
    () => Object.entries(careNeeds).filter(([, v]) => v).map(([k]) => k),
    [careNeeds],
  );

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

  // Run the search once on load only if the URL already carries filters
  // (e.g. arriving from the home page). Otherwise wait for the Search button.
  useEffect(() => {
    if (sp.get('type') || sp.get('state') || sp.get('care_needs')) doSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCare = (key: string) => setCareNeeds(p => ({ ...p, [key]: !p[key] }));

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
  ].filter(Boolean).join(' · ') || 'Everywhere in Australia';

  return (
    <div className="results-page">
      <div className="results-filterbar">
        <SearchFilters
          type={type} state={state} careNeeds={careNeeds}
          onType={setType} onState={setState} onToggleCare={toggleCare}
          onSubmit={doSearch} submitLabel="Search vacancies" loading={loading}
        />
      </div>

      {hasSearched && (
        <div className="results-topline">
          <div>
            <h1 className="results-count">
              {loading && !results.length
                ? 'Searching…'
                : `${sorted.length} vacanc${sorted.length === 1 ? 'y' : 'ies'}`}
            </h1>
            <div className="results-context">{contextLabel}</div>
          </div>
          <label className="sort-control">
            <span>Sort</span>
            <select value={sort} onChange={e => setSort(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
      )}

      <div className="results-list">
        {loading && !results.length && (
          <div className="results-skeletons">
            {[0, 1, 2].map(i => <div key={i} className="vacancy-card-skeleton" />)}
          </div>
        )}

        {!loading && !hasSearched && (
          <div className="results-empty">
            <p>Choose a type, a state and any support needs, then hit <strong>Search vacancies</strong>.</p>
          </div>
        )}

        {!loading && hasSearched && sorted.length === 0 && (
          <div className="results-empty">
            <h3>No vacancies match those filters</h3>
            <p>Try a different state or type, or remove a support need.</p>
            <a href="/find/submit" className="listing-btn listing-btn-primary">Submit a referral — we&rsquo;ll search our network</a>
          </div>
        )}

        {sorted.length > 0 && (
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
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="results-page"><div className="results-empty"><p>Loading…</p></div></div>}>
      <SearchContent />
    </Suspense>
  );
}
