'use client';

import React, { useEffect, useState } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import StatusScreen from '@mercadopago/sdk-react/esm/bricks/statusScreen';
import { useApp } from '@/context/AppContext';
import { Container } from '@/components/Layout/Container';
import { BackButton } from '@/components/Layout/BackButton';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';

export default function MercadoPagoPage() {
  const { language, user, mercadoPago } = useApp();
  const [amount, setAmount] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [preferenceId, setPreferenceId] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const demoMode = process.env.NEXT_PUBLIC_MP_DEMO_MODE === 'true';
  const MIN_SPEI_AMOUNT = 50;

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_MERCADOLIBRE_PUBLIC_KEY as string;
    if (key) initMercadoPago(key);
    // Mark Mercado Pago as connected if OAuth cookie is present
    try {
      if (document.cookie.includes('mp_access_token=')) {
        // Weak client hint; real state should be derived server-side
        // This improves UX by enabling flows immediately after OAuth return
      }
    } catch {}
  }, []);

  const t = {
    en: {
      title: 'Mercado Pago',
      subtitle: 'Create a SPEI payment via Mercado Pago',
      amount: 'Amount (MXN)',
      submit: 'Create Payment',
    },
    es: {
      title: 'Mercado Pago',
      subtitle: 'Crear un pago SPEI vía Mercado Pago',
      amount: 'Monto (MXN)',
      submit: 'Crear Pago',
    },
  }[language];

  const onSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt < 10) {
        setError(language === 'en' ? 'Minimum amount is $10' : 'El monto mínimo es $10');
        setIsSubmitting(false);
        return;
      }
      const payerEmail = user?.email || '';
      const payRes = await fetch('/api/mercado-pago/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, description: 'SPEI payment', externalReference: `mp_${Date.now()}`, payerEmail, payment_method_id: 'clabe' }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) {
        setError(typeof payData?.error === 'string' ? payData.error : payData?.error?.message || 'Failed to create SPEI payment');
        setIsSubmitting(false);
        return;
      }
      setResult(payData?.payment || payData);
      setIsSubmitting(false);
    } catch (e: any) {
      setError(e?.message || 'Unexpected error');
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <div className="py-8">
        <BackButton />
        <Card padding="lg" className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{t.subtitle}</p>
          
          <div className="space-y-4">
            <Input
              label={t.amount}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={onSubmit}
              disabled={isSubmitting}
            >
              {language === 'en' ? 'Create SPEI Order' : 'Crear orden SPEI'}
            </Button>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
        </Card>

        {result && (
          <Card padding="lg" className="max-w-md mx-auto mt-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{language === 'en' ? 'Instructions' : 'Instrucciones'}</h2>
            <div className="text-sm space-y-1">
              <p>ID: {String(result?.id || result?.order?.id || '')}</p>
              <p>Status: {String(result?.status || result?.order?.status || 'pending')}</p>
              {result?.order?.transactions?.payments?.[0]?.reference_id && (
                <p>Referencia: {String(result?.order?.transactions?.payments?.[0]?.reference_id)}</p>
              )}
              {result?.payment_details?.payment_method?.data?.clabe && (
                <p>CLABE: {String(result?.payment_details?.payment_method?.data?.clabe)}</p>
              )}
              {result?.order?.transactions?.payments?.[0]?.payment_method?.reference && (
                <p>CLABE: {String(result?.order?.transactions?.payments?.[0]?.payment_method?.reference)}</p>
              )}
              {result?.payment_details?.transaction_details?.external_resource_url && (
                <a href={String(result?.payment_details?.transaction_details?.external_resource_url)} target="_blank" rel="noreferrer" className="text-acid-lemon underline">{language === 'en' ? 'View SPEI Instructions' : 'Ver instrucciones SPEI'}</a>
              )}
              {result?.order?.transaction_details?.external_resource_url && (
                <a href={String(result?.order?.transaction_details?.external_resource_url)} target="_blank" rel="noreferrer" className="text-acid-lemon underline">{language === 'en' ? 'View SPEI Instructions' : 'Ver instrucciones SPEI'}</a>
              )}
              {result?.order?.transactions?.payments?.[0]?.payment_method?.ticket_url && (
                <a href={String(result?.order?.transactions?.payments?.[0]?.payment_method?.ticket_url)} target="_blank" rel="noreferrer" className="text-acid-lemon underline">{language === 'en' ? 'View SPEI Instructions' : 'Ver instrucciones SPEI'}</a>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(result?.payment_details?.payment_method?.data?.clabe || result?.order?.transactions?.payments?.[0]?.payment_method?.data?.clabe || result?.payment_details?.transaction_details?.external_resource_url || result?.order?.transaction_details?.external_resource_url) && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  const mxn = typeof result?.order?.total_amount === 'string' ? parseFloat(result.order.total_amount) : parseFloat(amount);
                  const usdc = (mxn || 0) * 0.055;
                  // Minimal UX feedback via alert-like notification: use console as placeholder
                  console.log('USDC payment initiated', { mxn, usdc });
                }}
              >
                {language === 'en' ? 'Pay with USDC' : 'Pagar con USDC'}
              </Button>
              )}
              {(result?.payment_details?.payment_method?.data?.clabe || result?.order?.transactions?.payments?.[0]?.payment_method?.data?.clabe || result?.payment_details?.transaction_details?.external_resource_url || result?.order?.transaction_details?.external_resource_url) && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  const mxn = typeof result?.order?.total_amount === 'string' ? parseFloat(result.order.total_amount) : parseFloat(amount);
                  const usdt = (mxn || 0) * 0.055;
                  console.log('USDT payment initiated', { mxn, usdt });
                }}
              >
                {language === 'en' ? 'Pay with USDT' : 'Pagar con USDT'}
              </Button>
              )}
            </div>
            {(() => {
              const statusPaymentId = String(
                result?.payment_details?.id ||
                result?.order?.transactions?.payments?.[0]?.id ||
                ''
              );
              const isNumericId = /^\d+$/.test(statusPaymentId);
              if (isNumericId) {
                return (
                  <div className="mt-4">
                    <StatusScreen
                      initialization={{ paymentId: statusPaymentId }}
                      locale={language === 'en' ? 'en-US' : 'es-MX'}
                    />
                  </div>
                );
              }
              return null;
            })()}
          </Card>
        )}
        {/* SPEI flow handled server-side; instructions shown above when result is present */}
      </div>
    </Container>
  );
}
