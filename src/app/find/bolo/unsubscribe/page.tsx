'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function UnsubscribeBoloContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!token) {
      setError('This link is missing an unsubscribe token.');
      setLoading(false);
      return;
    }
    api.public.unsubscribeBolo(token)
      .then(res => setMessage((res as any).data?.message || 'You have been unsubscribed from BOLO alerts.'))
      .catch(err => setError(err.message || 'Something went wrong. Please try again.'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div style={{
      background: '#fff', borderRadius: 18, padding: '32px 32px', textAlign: 'center',
      boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)', border: '1.5px solid var(--gray-200)',
    }}>
      <h2 style={{ fontSize: 20, margin: '0 0 8px', color: 'var(--gray-900)' }}>BOLO alerts</h2>

      {loading && <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Unsubscribing…</p>}

      {!loading && message && (
        <div style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
          {message}
        </div>
      )}

      {!loading && error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <a href="/find" style={{ fontSize: 13, color: '#1A56CC', textDecoration: 'none', fontWeight: 600 }}>
          ← Back to Find a Home
        </a>
      </div>
    </div>
  );
}

export default function UnsubscribeBoloPage() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <Suspense fallback={<div style={{ color: 'var(--gray-500)', textAlign: 'center' }}>Loading…</div>}>
          <UnsubscribeBoloContent />
        </Suspense>
      </div>
    </div>
  );
}
