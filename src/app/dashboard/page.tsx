'use client';
import { Topbar } from '@/components/layout/Topbar';
import { useAnalytics, useFacilities, useActivityFeed } from '@/hooks/useData';
import { useRouter } from 'next/navigation';

const PIPELINE_STAGES = [
  { key: 'new',       label: 'New',       color: '#3B82F6' },
  { key: 'reviewing', label: 'Reviewing', color: '#EAB308' },
  { key: 'matched',   label: 'Matched',   color: '#F97316' },
  { key: 'placed',    label: 'Placed',    color: '#22C55E' },
  { key: 'rejected',  label: 'Closed',    color: '#EF4444' },
] as const;

function relTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ACTION_LABELS: Record<string, string> = {
  referral_created:          'New referral submitted',
  public_referral_submitted: 'New referral submitted',
  referral_updated:          'Referral updated',
  match_selected:            'Match confirmed',
  vacancy_status_changed:    'Bed status changed',
  vacancy_created:           'Bed added',
  facility_created:          'Facility added',
  user_created_by_admin:     'User added',
  user_login:                'User signed in',
};

function StatTile({ label, value, onClick }: { label: string; value: string | number; onClick?: () => void }) {
  return (
    <button className="stat-tile" onClick={onClick} disabled={!onClick}>
      <div className="stat-tile-value">{value}</div>
      <div className="stat-tile-label">{label}</div>
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { summary, isLoading } = useAnalytics();
  const { facilities } = useFacilities();
  const { logs } = useActivityFeed();

  const now = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });

  if (isLoading && !summary) {
    return (
      <div>
        <Topbar title="Dashboard" subtitle={now} />
        <div className="page-body">
          <div className="dash-stats">{[0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: 84 }} />)}</div>
          <div className="skeleton" style={{ height: 110, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 280 }} />
        </div>
      </div>
    );
  }

  const s = summary ?? {};
  const byStatus = s.referrals_by_status ?? {};
  const total = PIPELINE_STAGES.reduce((sum, st) => sum + (byStatus[st.key] ?? 0), 0);
  const facs = Array.isArray(facilities) ? facilities : [];

  return (
    <div>
      <Topbar
        title="Dashboard"
        subtitle={now}
        actions={<button className="btn btn-primary btn-sm" onClick={() => router.push('/dashboard/referrals')}>View referrals</button>}
      />
      <div className="page-body fade-in">
        <div className="dash-stats">
          <StatTile label="Total referrals"  value={s.total_referrals ?? 0}  onClick={() => router.push('/dashboard/referrals')} />
          <StatTile label="Active referrals" value={s.active_referrals ?? 0} onClick={() => router.push('/dashboard/referrals')} />
          <StatTile label="Beds available"   value={s.available_beds ?? 0}   onClick={() => router.push('/dashboard/facilities')} />
        </div>

        {/* Referral pipeline */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 12 }}>Referral pipeline</div>
          <div className="dash-pipeline">
            {PIPELINE_STAGES.map(({ key, label, color }) => {
              const cnt = byStatus[key] ?? 0;
              const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
              return (
                <button key={key} className="dash-pipeline-stage" onClick={() => router.push(`/dashboard/referrals?status=${key}`)}
                  style={{ border: `1px solid ${color}22`, background: `${color}0a` }}>
                  <div style={{ fontSize: 24, fontFamily: 'Sora,sans-serif', fontWeight: 700, color, lineHeight: 1 }}>{cnt}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', margin: '4px 0 8px' }}>{label}</div>
                  <div style={{ height: 3, background: `${color}20`, borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="dash-two-col">
          {/* Live vacancies */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-800)' }}>Live vacancies</span>
              <span style={{ fontSize: 12, color: 'var(--brand)', cursor: 'pointer', fontWeight: 600 }} onClick={() => router.push('/dashboard/facilities')}>Manage →</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {facs.slice(0, 6).map((f: any) => {
                const avail = (f.vacancies ?? []).filter((v: any) => v.status === 'available').length;
                return (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--gray-50)', borderRadius: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--gray-800)' }}>{f.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{f.suburb}, {f.state} · {f.type}</div>
                    </div>
                    <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 18, fontWeight: 700, color: avail > 0 ? '#16A34A' : '#EF4444', lineHeight: 1, flexShrink: 0 }}>{avail}</div>
                  </div>
                );
              })}
              {facs.length === 0 && <div style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center', padding: '20px 0' }}>No facilities yet</div>}
            </div>
          </div>

          {/* Recent activity */}
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 8 }}>Recent activity</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {logs.slice(0, 8).map((log: any) => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '0.5px solid var(--gray-100)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 12, color: 'var(--gray-700)' }}>
                    {ACTION_LABELS[log.action] ?? log.action}
                    {log.performer?.name && <span style={{ color: 'var(--gray-400)' }}> · {log.performer.name}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', flexShrink: 0 }}>{relTime(log.created_at)}</div>
                </div>
              ))}
              {logs.length === 0 && <div style={{ fontSize: 12, color: 'var(--gray-400)', padding: '16px 0' }}>No recent activity</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
