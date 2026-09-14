'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function ConfirmBoloContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError]     = useState('');

  const confirm = async () => {
    if (loading) return;
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await api.public.confirmBolo(token);
      setMessage((res as any).data?.message || 'Your BOLO subscription is confirmed.');
    } catch (err: any) {
      setError(err.message || 'This confirmation link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: '#fff', borderRadius: 18, padding: '32px 32px', textAlign: 'center',
      boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)', border: '1.5px solid var(--gray-200)',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%', background: '#F5F3FF', margin: '0 auto 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#5B21B6', fontWeight: 700,
      }}>
        !
      </div>
      <h2 style={{ fontSize: 20, margin: '0 0 8px', color: 'var(--gray-900)' }}>Confirm your BOLO alerts</h2>
      <p style={{ color: 'var(--gray-500)', margin: '0 0 24px', fontSize: 13, lineHeight: 1.6 }}>
        Click below to start receiving real-time alerts for the accommodation type and area you chose.
      </p>

      {!message && (
        <button
          className="btn btn-primary btn-lg"
          onClick={confirm}
          disabled={!token || loading}
          style={{ justifyContent: 'center', width: '100%' }}
        >
          {loading ? 'Confirming…' : 'Confirm subscription'}
        </button>
      )}

      {!token && !message && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginTop: 16 }}>
          This link is missing a confirmation token. Please use the link from your email.
        </div>
      )}

      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginTop: 16 }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginTop: 4 }}>
          {message}
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

export default function ConfirmBoloPage() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <Suspense fallback={<div style={{ color: 'var(--gray-500)', textAlign: 'center' }}>Loading…</div>}>
          <ConfirmBoloContent />
        </Suspense>
      </div>
    </div>
  );
}
