"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/Layout/Container';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';

export default function ConnectMercadoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/mercado-pago/oauth/status', { cache: 'no-store' });
        const data = await res.json();
        setConnected(Boolean(data?.connected));
      } catch (e: any) {
        setError(e?.message || '');
      }
    })();
  }, []);

  const startConnect = async () => {
    try {
      setLoading(true);
      router.push('/api/mercado-pago/oauth/start');
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || '');
    }
  };

  const refreshToken = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/mercado-pago/oauth/refresh', { method: 'POST' });
      setLoading(false);
      if (!res.ok) {
        const data = await res.json();
        setError(typeof data?.error === 'string' ? data.error : data?.error?.message || 'Refresh failed');
        return;
      }
      setError('');
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || '');
    }
  };

  const disconnect = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/mercado-pago/oauth/disconnect', { method: 'POST' });
      setLoading(false);
      if (res.ok) {
        setConnected(false);
        router.push('/');
      }
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || '');
    }
  };

  return (
    <Container>
      <div className="max-w-md mx-auto">
        <Card padding="lg">
          <h2 className="text-xl font-bold mb-2">Connect Mercado Pago</h2>
          {!connected ? (
            <Button variant="primary" size="lg" fullWidth onClick={startConnect} loading={loading}>Connect</Button>
          ) : (
            <div className="space-y-3">
              <Button variant="secondary" size="lg" fullWidth onClick={() => router.push('/services')}>Continue to Services</Button>
              <Button variant="ghost" size="lg" fullWidth onClick={refreshToken} loading={loading}>Refresh Token</Button>
              <Button variant="danger" size="lg" fullWidth onClick={disconnect} loading={loading}>Disconnect</Button>
            </div>
          )}
          {!connected && (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="lg"
                fullWidth
                onClick={async () => {
                  try {
                    setLoading(true);
                    const res = await fetch('/api/mercado-pago/oauth/client', { method: 'POST' });
                    setLoading(false);
                    if (!res.ok) {
                      const data = await res.json();
                      setError(typeof data?.error === 'string' ? data.error : data?.error?.message || 'Client credentials failed');
                      return;
                    }
                    setError('');
                    setConnected(true);
                  } catch (e: any) {
                    setLoading(false);
                    setError(e?.message || '');
                  }
                }}
              >
                Connect via Client Credentials
              </Button>
            </div>
          )}
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </Card>
      </div>
    </Container>
  );
}
