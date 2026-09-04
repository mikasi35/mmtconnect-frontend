'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Topbar } from '@/components/layout/Topbar';
import { FacilityTypeBadge, VacancyBadge, Modal, PageLoader, EmptyState, Spinner, SectionHeader } from '@/components/ui';
import { useFacilities } from '@/hooks/useData';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { api, resolvePublicImage } from '@/lib/api';
import { refreshFacilities } from '@/hooks/useData';
import type { LocationData } from '@/components/LocationPicker';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false });

// ── Constants ──────────────────────────────────────────────────
const CARE_OPTIONS = [
  { key: 'personal_care',       label: 'Personal care' },
  { key: 'nursing',             label: 'Nursing' },
  { key: 'behavioural_support', label: 'Behavioural support' },
  { key: 'complex_medical',     label: 'Complex medical' },
  { key: 'overnight_support',   label: 'Overnight support' },
  { key: '24h_support',         label: '24h support' },
  { key: 'domestic_assistance', label: 'Domestic assistance' },
  { key: 'community_access',    label: 'Community access' },
  { key: 'therapy_services',    label: 'Therapy services' },
];

const AMENITY_OPTIONS = [
  { key: 'ensuite_bathroom',    label: 'Ensuite bathroom' },
  { key: 'extra_bathrooms',     label: 'Extra bathrooms' },
  { key: 'accessible_kitchen',  label: 'Accessible kitchen' },
  { key: 'large_living_area',   label: 'Large living area' },
  { key: 'alfresco_outdoor',    label: 'Alfresco / outdoor area' },
  { key: 'double_garage',       label: 'Double garage' },
  { key: 'single_garage',       label: 'Single garage' },
  { key: 'ducted_ac',           label: 'Ducted air conditioning' },
  { key: 'split_system_ac',     label: 'Split system AC' },
  { key: 'beautiful_gardens',   label: 'Beautiful gardens' },
  { key: 'fully_furnished',     label: 'Fully furnished' },
  { key: 'backup_power',        label: 'Backup power supply' },
  { key: 'out_of_hours_access', label: 'Out-of-hours access (OOA)' },
  { key: 'overnight_support_24_7', label: '24/7 overnight support' },
  { key: 'registered_nurse',    label: 'Registered nurse support' },
  { key: 'clinical_support',    label: 'Clinical support staff' },
  { key: 'wheelchair_accessible', label: 'Wheelchair accessible' },
  { key: 'ceiling_hoist',       label: 'Ceiling hoist' },
  { key: 'pool',                label: 'Swimming pool' },
  { key: 'gym',                 label: 'Gym / exercise room' },
  { key: 'sensory_room',        label: 'Sensory room' },
  { key: 'therapy_room',        label: 'Therapy room' },
];

const SDA_CATEGORIES = ['High Physical Support', 'Improved Liveability', 'Fully Accessible', 'Robust', 'Basic'];

const BLANK_VAC = { label: '', start_date: new Date().toISOString().slice(0, 10), notes: '', care_level_supported: {} as Record<string, boolean> };
const BLANK_LOC: LocationData = { address: '', suburb: '', state: '', postcode: '', lat: null, lng: null };
const BLANK_FAC = {
  name: '', type: 'SIL', capacity: '1', description: '',
  bedrooms: '', bathrooms: '',
  sdaCategory: '', websiteUrl: '',
  contact: { name: '', email: '', phone: '' },
  amenities: [] as string[],
  features: [''],
  careTypes: [] as string[],
  eligibility: '', tenantProfile: '',
  isPublished: true,
};

const VAC_DOT: Record<string, string> = { available: '#16A34A', reserved: '#EAB308', occupied: '#EF4444' };

const AMENITY_LABELS: Record<string, string> = Object.fromEntries(AMENITY_OPTIONS.map(a => [a.key, a.label]));

// ── Section tab component ──────────────────────────────────────
function Tabs({ tabs, active, onChange }: { tabs: string[]; active: number; onChange: (i: number) => void }) {
  return (
    <div style={{
      display: 'flex', borderBottom: '0.5px solid var(--gray-200)',
      marginBottom: 18, overflowX: 'auto', flexShrink: 0,
      position: 'sticky', top: 0, zIndex: 3, background: '#fff',
    }}>
      {tabs.map((t, i) => (
        <button key={t} onClick={() => onChange(i)} style={{
          padding: '10px 14px', fontSize: 13, fontWeight: active === i ? 700 : 400,
          background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
          color: active === i ? 'var(--brand)' : 'var(--gray-500)',
          borderBottom: `2px solid ${active === i ? 'var(--brand)' : 'transparent'}`,
          marginBottom: -1,
        }}>
          {t}
        </button>
      ))}
    </div>
  );
}

// ── Checkbox pill helper ───────────────────────────────────────
function CheckPill({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13,
      padding: '8px 10px', borderRadius: 6,
      background: checked ? 'var(--brand-light)' : 'var(--gray-50)',
      border: `0.5px solid ${checked ? 'var(--brand)' : 'var(--gray-200)'}`,
      color: checked ? 'var(--brand)' : 'var(--gray-700)',
      minHeight: 44,
    }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ width: 16, height: 16 }} />
      {label}
    </label>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function FacilitiesPage() {
  const { facilities, total, isLoading, mutate } = useFacilities();
  const [selected,      setSelected]      = useState<any>(null);
  const [showFac,       setShowFac]       = useState(false);
  const [showVac,       setShowVac]       = useState(false);
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [formTab,       setFormTab]       = useState(0);
  const [fac,           setFac]           = useState({ ...BLANK_FAC });
  const [location,      setLocation]      = useState<LocationData>({ ...BLANK_LOC });
  const [vacForm,       setVacForm]       = useState({ ...BLANK_VAC });
  const [imageFiles,    setImageFiles]    = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [toggling,      setToggling]      = useState<string | null>(null);
  const [err,           setErr]           = useState('');
  const [typeFilter,    setTypeFilter]    = useState<string>('all');

  const rows: any[] = Array.isArray(facilities) ? facilities : (facilities as any)?.data ?? [];
  const visible = typeFilter === 'all' ? rows : rows.filter((f: any) => f.type === typeFilter);

  useBodyScrollLock(showFac || showVac || !!selected);

  useEffect(() => {
    const urls = imageFiles.map(f => URL.createObjectURL(f));
    setImagePreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [imageFiles]);

  const resetForm = () => {
    setEditingId(null);
    setFac({ ...BLANK_FAC, features: [''] });
    setLocation({ ...BLANK_LOC });
    setImageFiles([]); setImagePreviews([]); setExistingImages([]);
    setErr(''); setFormTab(0);
  };

  const BEDBATH_RE = /^\s*\d+\s+(bed|bath)rooms?\s*$/i;

  const openEdit = (f: any) => {
    const feats: string[] = Array.isArray(f.features) ? f.features : [];
    const bedLine  = feats.find(x => /^\s*\d+\s+bedrooms?\s*$/i.test(x));
    const bathLine = feats.find(x => /^\s*\d+\s+bathrooms?\s*$/i.test(x));
    setEditingId(f.id);
    setFac({
      name: f.name ?? '', type: f.type ?? 'SIL', capacity: String(f.capacity ?? 1),
      description: f.description ?? '',
      bedrooms:  bedLine  ? (bedLine.match(/\d+/)?.[0]  ?? '') : '',
      bathrooms: bathLine ? (bathLine.match(/\d+/)?.[0] ?? '') : '',
      sdaCategory: f.sda_design_category ?? '',
      websiteUrl: f.website_url ?? '',
      contact: { name: f.contact_name ?? '', email: f.contact_email ?? '', phone: f.contact_phone ?? '' },
      amenities: Array.isArray(f.amenities) ? f.amenities : [],
      features: (feats.filter(x => !BEDBATH_RE.test(x)).length ? feats.filter(x => !BEDBATH_RE.test(x)) : ['']),
      careTypes: Array.isArray(f.care_types) ? f.care_types : [],
      eligibility: f.eligibility ?? '', tenantProfile: f.tenant_profile ?? '',
      isPublished: f.is_published !== false,
    });
    setLocation({
      address: f.address ?? '', suburb: f.suburb ?? '', state: f.state ?? '', postcode: f.postcode ?? '',
      lat: f.latitude != null ? Number(f.latitude) : null,
      lng: f.longitude != null ? Number(f.longitude) : null,
    });
    setExistingImages(f.image_urls?.length ? f.image_urls : (f.image_url ? [f.image_url] : []));
    setImageFiles([]); setImagePreviews([]);
    setErr(''); setFormTab(0);
    setShowFac(true);
  };

  const deleteFacility = async (f: any) => {
    if (!confirm(`Remove ${f.name} from the platform? It will be hidden from the public site and dashboard.`)) return;
    setDeleting(true); setErr('');
    try {
      await api.facilities.delete(f.id);
      setSelected(null);
      await mutate(); refreshFacilities();
    } catch (e: any) {
      alert(e.message || 'Failed to remove facility');
    } finally { setDeleting(false); }
  };

  const toggleAmenity = (key: string) =>
    setFac(f => ({ ...f, amenities: f.amenities.includes(key) ? f.amenities.filter(a => a !== key) : [...f.amenities, key] }));

  const toggleCareType = (key: string) =>
    setFac(f => ({ ...f, careTypes: f.careTypes.includes(key) ? f.careTypes.filter(a => a !== key) : [...f.careTypes, key] }));

  const updateFeature = (i: number, val: string) =>
    setFac(f => { const nf = [...f.features]; nf[i] = val; return { ...f, features: nf }; });

  const addFeature = () => setFac(f => ({ ...f, features: [...f.features, ''] }));
  const removeFeature = (i: number) => setFac(f => ({ ...f, features: f.features.filter((_, j) => j !== i) }));

  const addImages = (files: File[]) => {
    const imgs = files.filter(f => f.type.startsWith('image/'));
    if (imgs.length) setImageFiles(prev => [...prev, ...imgs]);
  };
  const removeImage = (i: number) => setImageFiles(prev => prev.filter((_, j) => j !== i));

  const saveFacility = async () => {
    if (!fac.name || !fac.type || !location.address || !location.suburb || !location.state) {
      setErr('Name, type, and a full address are required'); setFormTab(0); return;
    }
    setSaving(true); setErr('');
    try {
      const payload: any = {
        name: fac.name, type: fac.type,
        address: location.address, suburb: location.suburb,
        state: location.state, postcode: location.postcode,
        latitude: location.lat ?? undefined, longitude: location.lng ?? undefined,
        description: fac.description,
        sda_design_category: fac.sdaCategory || undefined,
        website_url: fac.websiteUrl || undefined,
        contact_name: fac.contact.name, contact_email: fac.contact.email, contact_phone: fac.contact.phone,
        capacity: parseInt(fac.capacity || '1'),
        amenities: fac.amenities,
        features: [
          ...(fac.bedrooms ? [`${fac.bedrooms} bedroom${fac.bedrooms === '1' ? '' : 's'}`] : []),
          ...(fac.bathrooms ? [`${fac.bathrooms} bathroom${fac.bathrooms === '1' ? '' : 's'}`] : []),
          ...fac.features.map(f => f.trim()).filter(Boolean).filter(f => !BEDBATH_RE.test(f)),
        ],
        care_types: fac.careTypes,
        eligibility: fac.eligibility || undefined,
        tenant_profile: fac.tenantProfile || undefined,
        is_published: fac.isPublished,
      };

      if (editingId) {
        // Upload any new photos (endpoint appends + returns the full array),
        // then PATCH the final ordered list — which also drops removed ones.
        let images = [...existingImages];
        if (imageFiles.length) {
          const before: string[] = selected?.image_urls ?? [];
          const form = new FormData();
          imageFiles.forEach(f => form.append('images', f));
          const res = await api.facilities.uploadImages(editingId, form);
          const added = ((res.data?.image_urls ?? []) as string[]).filter(u => !before.includes(u));
          images = [...images, ...added];
        }
        payload.image_urls = images;
        payload.image_url = images[0] ?? null;
        const updated = await api.facilities.update(editingId, payload);
        if (selected?.id === editingId) setSelected(updated.data);
      } else {
        const created = await api.facilities.create(payload);
        if (imageFiles.length) {
          const form = new FormData();
          imageFiles.forEach(f => form.append('images', f));
          await api.facilities.uploadImages(created.data.id, form);
        }
      }
      await mutate(); refreshFacilities();
      setShowFac(false); resetForm();
    } catch (e: any) { setErr(e.message || 'Failed to save facility'); }
    finally { setSaving(false); }
  };

  const saveVacancy = async () => {
    if (!selected) return;
    setSaving(true); setErr('');
    try {
      await api.facilities.createVacancy(selected.id, vacForm);
      const updated = await api.facilities.get(selected.id);
      setSelected(updated.data);
      await mutate(); refreshFacilities();
      setShowVac(false); setVacForm({ ...BLANK_VAC });
    } catch (e: any) { setErr(e.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const toggleVacancy = async (vacId: string, current: string) => {
    const next = current === 'available' ? 'occupied' : 'available';
    setToggling(vacId);
    try {
      await api.facilities.vacancyStatus(vacId, next);
      const updated = await api.facilities.get(selected.id);
      setSelected(updated.data);
      await mutate();
    } finally { setToggling(null); }
  };

  const totalAvail = rows.reduce((n: number, f: any) => n + (f.vacancies ?? []).filter((v: any) => v.status === 'available').length, 0);

  const FORM_TABS = ['Basic', 'Location', 'Contact', 'Amenities', 'Care & Eligibility', 'Photos'];

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar
          title="Facilities"
          subtitle={`${total || rows.length} facilities · ${totalAvail} beds available`}
          actions={
            <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowFac(true); }}>
              + Add facility
            </button>
          }
        />

        {/* Type filter chips */}
        <div style={{ background: '#fff', borderBottom: '0.5px solid var(--gray-200)', padding: '10px 16px', display: 'flex', gap: 8, overflowX: 'auto' }}>
          {['all', 'SIL', 'SDA', 'STA'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: 'none', whiteSpace: 'nowrap', flexShrink: 0,
              background: typeFilter === t ? 'var(--brand)' : 'var(--gray-100)',
              color: typeFilter === t ? '#fff' : 'var(--gray-600)',
            }}>
              {t === 'all' ? 'All types' : t}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {isLoading && rows.length === 0 ? <PageLoader /> : rows.length === 0 ? (
            <EmptyState title="No facilities yet" message="Add your first facility to get started."
              action={<button className="btn btn-primary" onClick={() => { resetForm(); setShowFac(true); }}>+ Add facility</button>}
            />
          ) : (
            <div className="facilities-grid">
              {visible.map((f: any) => {
                const vacancies = f.vacancies ?? [];
                const avail = vacancies.filter((v: any) => v.status === 'available').length;
                const occ   = vacancies.filter((v: any) => v.status === 'occupied').length;
                const pct   = vacancies.length > 0 ? Math.round(occ / vacancies.length * 100) : 0;
                const isSelected = selected?.id === f.id;
                const imageSrc = resolvePublicImage(f.image_urls?.[0] || f.image_url);

                return (
                  <div key={f.id} className="card facility-card" onClick={() => setSelected(isSelected ? null : f)}
                    style={{ cursor: 'pointer', border: isSelected ? '1.5px solid var(--brand)' : undefined, transition: 'all 0.15s' }}>
                    {imageSrc && (
                      <div style={{ width: '100%', height: 130, overflow: 'hidden', borderRadius: 10, marginBottom: 10, background: '#F3F4F6' }}>
                        <img src={imageSrc} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                          <FacilityTypeBadge type={f.type} />
                          {f.sda_design_category && <span style={{ fontSize: 10, color: 'var(--gray-400)', fontWeight: 500 }}>{f.sda_design_category}</span>}
                          <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{f.suburb}, {f.state}</span>
                        </div>
                        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                        <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 22, fontWeight: 700, lineHeight: 1, color: avail > 0 ? '#16A34A' : '#EF4444' }}>{avail}</div>
                        <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>/{vacancies.length} avail.</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray-400)', marginBottom: 3 }}>
                        <span>Occupancy</span><span>{pct}%</span>
                      </div>
                      <div style={{ height: 4, background: 'var(--gray-100)', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--brand)', borderRadius: 3, transition: 'width 0.4s' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {vacancies.map((v: any) => (
                        <div key={v.id} title={`${v.label ?? 'Bed'} — ${v.status}`}
                          style={{ width: 26, height: 26, borderRadius: 6, background: VAC_DOT[v.status] + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 9, height: 9, borderRadius: '50%', background: VAC_DOT[v.status] }} />
                        </div>
                      ))}
                      {vacancies.length === 0 && <span style={{ fontSize: 11, color: 'var(--gray-300)' }}>No beds yet</span>}
                    </div>

                    {/* Amenity pills preview */}
                    {(f.amenities ?? []).length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                        {(f.amenities as string[]).slice(0, 4).map(a => (
                          <span key={a} style={{ fontSize: 10, padding: '2px 7px', background: 'var(--gray-100)', color: 'var(--gray-600)', borderRadius: 10 }}>
                            {AMENITY_LABELS[a] ?? a}
                          </span>
                        ))}
                        {f.amenities.length > 4 && <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>+{f.amenities.length - 4} more</span>}
                      </div>
                    )}

                    {f.contact_phone && <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 8 }}>📞 {f.contact_phone}</div>}
                    {!f.is_published && (
                      <div style={{ marginTop: 6, fontSize: 10, fontWeight: 600, color: '#9A3412', background: '#FFF7ED', padding: '2px 7px', borderRadius: 10, display: 'inline-block' }}>
                        UNPUBLISHED
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Detail side panel ── */}
      {selected && (
        <div className="facility-detail-panel">
          <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--gray-200)', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h2 style={{ fontSize: 14, margin: 0 }}>Facility</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--gray-400)', lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}>✎ Edit details</button>
              <button className="btn btn-primary btn-sm" onClick={() => { setShowVac(true); setErr(''); }}>+ Add bed</button>
            </div>
          </div>
          <div className="panel-scroll" style={{ padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{selected.name}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              <FacilityTypeBadge type={selected.type} />
              {selected.sda_design_category && (
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--gray-500)', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: 10 }}>
                  {selected.sda_design_category}
                </span>
              )}
            </div>
            {selected.description && <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 0, lineHeight: 1.5 }}>{selected.description}</p>}

            {/* Amenities */}
            {(selected.amenities ?? []).length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Amenities</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {(selected.amenities as string[]).map(a => (
                    <span key={a} style={{ fontSize: 11, padding: '3px 9px', background: 'var(--brand-light)', color: 'var(--brand)', borderRadius: 10, fontWeight: 500 }}>
                      {AMENITY_LABELS[a] ?? a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            {(selected.features ?? []).length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Features</div>
                {(selected.features as string[]).map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-600)', marginBottom: 3 }}>
                    <span style={{ color: '#16A34A', flexShrink: 0 }}>✓</span>{f}
                  </div>
                ))}
              </div>
            )}

            {/* Care types */}
            {(selected.care_types ?? []).length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Care services</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {(selected.care_types as string[]).map(c => (
                    <span key={c} style={{ fontSize: 11, padding: '3px 9px', background: '#F0FDF4', color: '#166534', borderRadius: 10, fontWeight: 500 }}>
                      {CARE_OPTIONS.find(o => o.key === c)?.label ?? c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Eligibility */}
            {selected.eligibility && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Eligibility</div>
                <div style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.5 }}>{selected.eligibility}</div>
              </div>
            )}

            {/* Tenant profile */}
            {selected.tenant_profile && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Current tenant profile</div>
                <div style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.5 }}>{selected.tenant_profile}</div>
              </div>
            )}

            {/* Vacancies */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Beds</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(selected.vacancies ?? []).map((v: any, i: number) => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--gray-50)', borderRadius: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: VAC_DOT[v.status], flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{v.label ?? `Bed ${i + 1}`}</div>
                  </div>
                  <VacancyBadge status={v.status} />
                  <button onClick={() => toggleVacancy(v.id, v.status)} disabled={toggling === v.id}
                    className="btn btn-secondary btn-sm" style={{ fontSize: 10, padding: '3px 7px' }}>
                    {toggling === v.id ? <Spinner size={10} /> : 'Toggle'}
                  </button>
                </div>
              ))}
              {(selected.vacancies ?? []).length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--gray-300)', fontSize: 12, padding: '16px 0' }}>No beds configured yet</div>
              )}
            </div>

            {/* Photos summary */}
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
                Photos ({(selected.image_urls ?? []).length || (selected.image_url ? 1 : 0)})
              </div>
              {((selected.image_urls ?? []).length || selected.image_url) ? (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(selected.image_urls?.length ? selected.image_urls : [selected.image_url]).slice(0, 6).map((src: string, i: number) => (
                    <img key={i} src={resolvePublicImage(src)} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6 }} />
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>No photos — add them from “Edit details → Photos”.</div>
              )}
            </div>

            {/* Danger zone */}
            <div style={{ marginTop: 22, paddingTop: 14, borderTop: '0.5px solid var(--gray-200)' }}>
              <button className="btn btn-danger btn-sm" disabled={deleting}
                onClick={() => deleteFacility(selected)} style={{ width: '100%', justifyContent: 'center' }}>
                {deleting ? <Spinner size={12} /> : 'Remove this facility'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Facility Modal (tabbed) ── */}
      <Modal
        open={showFac}
        onClose={() => { setShowFac(false); resetForm(); }}
        title={editingId ? 'Edit Facility' : 'Add Facility'}
        footer={
          <>
            {formTab > 0 && (
              <button className="btn btn-secondary" onClick={() => setFormTab(t => t - 1)}>← Back</button>
            )}
            {formTab < FORM_TABS.length - 1 && (
              <button className="btn btn-secondary" onClick={() => setFormTab(t => t + 1)}>Next →</button>
            )}
            {(editingId || formTab === FORM_TABS.length - 1) && (
              <button className="btn btn-primary" onClick={saveFacility} disabled={saving}>
                {saving ? <><Spinner size={14} /> Saving…</> : editingId ? 'Save changes' : 'Add facility'}
              </button>
            )}
          </>
        }
      >
        {err && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '8px 12px', borderRadius: 7, fontSize: 13, marginBottom: 12 }}>{err}</div>}

        <Tabs tabs={FORM_TABS} active={formTab} onChange={setFormTab} />

        {/* ── Tab 0: Basic ── */}
        {formTab === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Facility name *</label>
              <input className="form-input" value={fac.name} onChange={e => setFac(f => ({ ...f, name: e.target.value }))} placeholder="Bognuda House" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Type *</label>
                <select className="form-select" value={fac.type} onChange={e => setFac(f => ({ ...f, type: e.target.value }))}>
                  {['SIL', 'SDA', 'STA'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Capacity</label>
                <input className="form-input" type="number" min={1} value={fac.capacity} onChange={e => setFac(f => ({ ...f, capacity: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Bedrooms</label>
                <input className="form-input" type="number" min={0} value={fac.bedrooms} onChange={e => setFac(f => ({ ...f, bedrooms: e.target.value }))} placeholder="3" />
              </div>
              <div className="form-group">
                <label className="form-label">Bathrooms</label>
                <input className="form-input" type="number" min={0} value={fac.bathrooms} onChange={e => setFac(f => ({ ...f, bathrooms: e.target.value }))} placeholder="2" />
              </div>
            </div>
            {fac.type === 'SDA' && (
              <div className="form-group">
                <label className="form-label">SDA design category</label>
                <select className="form-select" value={fac.sdaCategory} onChange={e => setFac(f => ({ ...f, sdaCategory: e.target.value }))}>
                  <option value="">— select —</option>
                  {SDA_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows={3} value={fac.description} onChange={e => setFac(f => ({ ...f, description: e.target.value }))} placeholder="A beautiful SDA registered property designed for high physical support…" />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={fac.isPublished} onChange={e => setFac(f => ({ ...f, isPublished: e.target.checked }))} style={{ width: 16, height: 16 }} />
                Publish to public website
              </label>
              <p style={{ fontSize: 11, color: 'var(--gray-400)', margin: '4px 0 0' }}>When checked, this facility appears on the public API and can be shown on mmtcare.com.au</p>
            </div>
          </div>
        )}

        {/* ── Tab 1: Location ── */}
        {formTab === 1 && (
          <div className="form-group">
            <label className="form-label">Address — search or tap the map *</label>
            <LocationPicker value={location} onChange={setLocation} />
          </div>
        )}

        {/* ── Tab 2: Contact ── */}
        {formTab === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Contact name</label>
              <input className="form-input" value={fac.contact.name} onChange={e => setFac(f => ({ ...f, contact: { ...f.contact, name: e.target.value } }))} placeholder="Jane Smith" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={fac.contact.phone} onChange={e => setFac(f => ({ ...f, contact: { ...f.contact, phone: e.target.value } }))} placeholder="1300 066 822" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={fac.contact.email} onChange={e => setFac(f => ({ ...f, contact: { ...f.contact, email: e.target.value } }))} placeholder="manager@mmtcare.com.au" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Website URL</label>
              <input className="form-input" value={fac.websiteUrl} onChange={e => setFac(f => ({ ...f, websiteUrl: e.target.value }))} placeholder="https://mmtcare.com.au/accomodation/bognuda/" />
            </div>
          </div>
        )}

        {/* ── Tab 3: Amenities & Features ── */}
        {formTab === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 10 }}>Amenities</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {AMENITY_OPTIONS.map(a => (
                  <CheckPill key={a.key} checked={fac.amenities.includes(a.key)} label={a.label} onChange={() => toggleAmenity(a.key)} />
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 8 }}>Feature bullets <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--gray-400)' }}>(shown on listing page)</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {fac.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6 }}>
                    <input className="form-input" style={{ flex: 1 }} value={f} onChange={e => updateFeature(i, e.target.value)} placeholder={`e.g. 3 large bedrooms with ensuite (room ${i + 1})`} />
                    {fac.features.length > 1 && (
                      <button onClick={() => removeFeature(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>✕</button>
                    )}
                  </div>
                ))}
                <button onClick={addFeature} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>+ Add feature</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 4: Care & Eligibility ── */}
        {formTab === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 10 }}>Care services offered</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {CARE_OPTIONS.map(o => (
                  <CheckPill key={o.key} checked={fac.careTypes.includes(o.key)} label={o.label} onChange={() => toggleCareType(o.key)} />
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Eligibility requirements</label>
              <textarea className="form-textarea" rows={2} value={fac.eligibility} onChange={e => setFac(f => ({ ...f, eligibility: e.target.value }))} placeholder="Requires SDA funding in NDIS plan" />
            </div>
            <div className="form-group">
              <label className="form-label">Current tenant profile</label>
              <textarea className="form-textarea" rows={3} value={fac.tenantProfile} onChange={e => setFac(f => ({ ...f, tenantProfile: e.target.value }))} placeholder="Gentleman in his 60s with physical disability; enjoys gardening, cards, football, BBQs…" />
            </div>
          </div>
        )}

        {/* ── Tab 5: Photos ── */}
        {formTab === 5 && (
          <div className="form-group">
            <label className="form-label">
              Facility photos <span style={{ fontWeight: 400, color: 'var(--gray-400)' }}>— add as many as you like</span>
            </label>
            <div className="photo-grid">
              {existingImages.map((src, i) => (
                <div key={`ex-${src}`} className="photo-tile">
                  <img src={resolvePublicImage(src)} alt={`Photo ${i + 1}`} />
                  {i === 0 && <span className="photo-cover-tag">Cover</span>}
                  <button type="button" className="photo-remove" title="Remove photo"
                    onClick={() => setExistingImages(list => list.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
              {imagePreviews.map((src, i) => (
                <div key={`new-${i}`} className="photo-tile">
                  <img src={src} alt={`New photo ${i + 1}`} />
                  {existingImages.length === 0 && i === 0 && <span className="photo-cover-tag">Cover</span>}
                  <button type="button" className="photo-remove" title="Remove photo"
                    onClick={() => removeImage(i)}>✕</button>
                </div>
              ))}
              <label className="photo-add">
                <input type="file" accept="image/*" multiple hidden
                  onChange={e => { addImages(Array.from(e.target.files || [])); e.currentTarget.value = ''; }} />
                <span className="photo-add-plus">＋</span>
                <span>Add photos</span>
              </label>
            </div>
            <p style={{ fontSize: 12, color: 'var(--gray-400)', margin: '8px 0 0' }}>
              The first photo is the cover image on the public listing. Removing a photo here takes effect when you save.
            </p>
          </div>
        )}
      </Modal>

      {/* ── Add Vacancy Modal ── */}
      <Modal open={showVac} onClose={() => setShowVac(false)} title={`Add Bed — ${selected?.name ?? ''}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowVac(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveVacancy} disabled={saving}>
              {saving ? <><Spinner size={14} /> Saving…</> : 'Add bed'}
            </button>
          </>
        }
      >
        {err && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '8px 12px', borderRadius: 7, fontSize: 13 }}>{err}</div>}
        <div className="form-group">
          <label className="form-label">Bed label</label>
          <input className="form-input" value={vacForm.label} onChange={e => setVacForm(f => ({ ...f, label: e.target.value }))} placeholder="Room A – Ground floor, ensuite" />
        </div>
        <div className="form-group">
          <label className="form-label">Available from</label>
          <input className="form-input" type="date" value={vacForm.start_date} onChange={e => setVacForm(f => ({ ...f, start_date: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Care levels supported</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {CARE_OPTIONS.map(o => (
              <CheckPill key={o.key}
                checked={!!vacForm.care_level_supported[o.key]}
                label={o.label}
                onChange={() => setVacForm(f => ({ ...f, care_level_supported: { ...f.care_level_supported, [o.key]: !f.care_level_supported[o.key] } }))}
              />
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={vacForm.notes} onChange={e => setVacForm(f => ({ ...f, notes: e.target.value }))} placeholder="Accessibility features, restrictions…" style={{ minHeight: 60 }} />
        </div>
      </Modal>
    </div>
  );
}
