'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Container } from '@/components/Layout/Container';
import { Header } from '@/components/Layout/Header';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Icon, CreditCardIcon, WalletIcon, SendIcon, CheckCircleIcon } from '@/components/Icons';

export function HomeScreen() {
  const router = useRouter();
  const { user, mercadoPago, language } = useApp();

  const labels = {
    en: {
      title: 'Welcome to NeonPay MX',
      subtitle: 'Your gateway to seamless payments',
      connectWallet: 'Connect Wallet',
      connectMercado: 'Connect Mercado Pago',
      addFunds: 'Add Funds',
      sendPay: 'Send / Pay',
      verifyIdentity: 'Verify Identity',
      walletConnected: 'Wallet Connected',
      mercadoConnected: 'Mercado Pago Connected',
    },
    es: {
      title: 'Bienvenido a NeonPay MX',
      subtitle: 'Tu puerta de entrada a pagos sin problemas',
      connectWallet: 'Conectar Billetera',
      connectMercado: 'Conectar Mercado Pago',
      addFunds: 'Agregar Fondos',
      sendPay: 'Enviar / Pagar',
      verifyIdentity: 'Verificar Identidad',
      walletConnected: 'Billetera Conectada',
      mercadoConnected: 'Mercado Pago Conectado',
    },
  };

  const t = labels[language];

  if (!user) {
    return (
      <Container>
        <div className="min-h-screen flex items-center justify-center py-12">
          <Card padding="lg" className="max-w-md w-full text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
            <p className="text-gray-600 mb-6">{t.subtitle}</p>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => router.push('/auth')}
            >
              <Icon>
                <WalletIcon />
              </Icon>
              {t.connectWallet}
            </Button>
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-8">
        <Header />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!mercadoPago.connected && (
            <Card variant="interactive" padding="lg" onClick={() => router.push('/connect-mercado')}>
              <div className="flex items-center gap-4">
                <Icon size="lg" color="neon">
                  <CreditCardIcon />
                </Icon>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{t.connectMercado}</h3>
                  <p className="text-sm text-gray-600">Link your Mercado Pago account</p>
                </div>
              </div>
            </Card>
          )}

          <Card variant="interactive" padding="lg" onClick={() => router.push('/topup')}>
            <div className="flex items-center gap-4">
              <Icon size="lg" color="neon">
                <CreditCardIcon />
              </Icon>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{t.addFunds}</h3>
                <p className="text-sm text-gray-600">Add funds to your wallet</p>
              </div>
            </div>
          </Card>

          <Card variant="interactive" padding="lg" onClick={() => router.push('/send')}>
            <div className="flex items-center gap-4">
              <Icon size="lg" color="neon">
                <SendIcon />
              </Icon>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{t.sendPay}</h3>
                <p className="text-sm text-gray-600">Send payments to anyone</p>
              </div>
            </div>
          </Card>

          {!user.selfVerified && (
            <Card variant="interactive" padding="lg" onClick={() => router.push('/verify-self')}>
              <div className="flex items-center gap-4">
                <Icon size="lg" color="neon">
                  <CheckCircleIcon />
                </Icon>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{t.verifyIdentity}</h3>
                  <p className="text-sm text-gray-600">Verify your identity with Self Protocol</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Container>
  );
}
