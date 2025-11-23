'use client';

import React, { useCallback, useState } from 'react';
import { useX402Fetch } from '@privy-io/react-auth';
import { Container } from '@/components/Layout/Container';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';

export default function X402PrivyPage() {
  const [result, setResult] = useState<any>(null);
  const { wrapFetchWithPayment } = useX402Fetch();

  const run = useCallback(async () => {
    const fetchWithPayment = wrapFetchWithPayment({ fetch });
    const res = await fetchWithPayment('/api/x402/usdc');
    const json = await res.json();
    setResult(json);
  }, [wrapFetchWithPayment]);

  return (
    <Container>
      <div className="py-8">
        <Card padding="lg" className="max-w-md mx-auto space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">X402 with Privy</h1>
          <p className="text-sm text-gray-700">This calls /api/x402/usdc and relies on Privy to fulfill 402 payments.</p>
          <Button variant="primary" size="md" fullWidth onClick={run}>Fetch with Payment</Button>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        </Card>
      </div>
    </Container>
  );
}

