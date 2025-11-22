'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Container } from '@/components/Layout/Container';
import { BackButton } from '@/components/Layout/BackButton';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Spinner } from '@/components/UI/Loading';

export function AuthScreen() {
  const router = useRouter();
  const { setUser, language, wallet } = useApp();
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If in MiniPay and wallet is connected, auto-redirect
  useEffect(() => {
    if (wallet.isMiniPay && wallet.isConnected && wallet.address) {
      setUser({
        id: wallet.address,
        walletAddress: wallet.address,
        isVerified: true,
        selfVerified: false,
      });
      router.push('/');
    }
  }, [wallet.isMiniPay, wallet.isConnected, wallet.address, router, setUser]);

  const labels = {
    en: {
      title: wallet.isMiniPay ? 'Connect to MiniPay' : 'Connect Your Wallet',
      subtitle: wallet.isMiniPay 
        ? 'Connect your MiniPay wallet to continue'
        : 'Sign in with email or phone to create your wallet',
      connectWallet: 'Connect Wallet',
      email: 'Email',
      phone: 'Phone',
      emailPlaceholder: 'Enter your email',
      phonePlaceholder: 'Enter your phone number',
      continue: 'Continue',
      back: 'Back',
      connecting: 'Connecting...',
    },
    es: {
      title: wallet.isMiniPay ? 'Conectar a MiniPay' : 'Conecta Tu Billetera',
      subtitle: wallet.isMiniPay
        ? 'Conecta tu billetera MiniPay para continuar'
        : 'Inicia sesión con correo o teléfono para crear tu billetera',
      connectWallet: 'Conectar Billetera',
      email: 'Correo',
      phone: 'Teléfono',
      emailPlaceholder: 'Ingresa tu correo',
      phonePlaceholder: 'Ingresa tu número de teléfono',
      continue: 'Continuar',
      back: 'Atrás',
      connecting: 'Conectando...',
    },
  };

  const t = labels[language];

  const generateWalletAddress = () => {
    return '0x' + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };

  const handleConnectWallet = async () => {
    setError('');
    setLoading(true);

    try {
      await wallet.connect();
      // Wallet connection will trigger the useEffect that redirects
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If in MiniPay, use wallet connection instead
    if (wallet.isMiniPay) {
      await handleConnectWallet();
      return;
    }

    setError('');
    setLoading(true);

    try {
      // For standalone mode with Privy, this would trigger Privy login
      // For now, mock authentication
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Try to connect wallet first (Privy)
      if (!wallet.isConnected) {
        await wallet.connect();
      }

      const walletAddress = wallet.address || generateWalletAddress();

      setUser({
        id: method === 'email' ? email : phone,
        [method]: method === 'email' ? email : phone,
        walletAddress,
        isVerified: true,
        selfVerified: false,
      });

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="py-8">
        <BackButton />
        
        <Card padding="lg" className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{t.subtitle}</p>

          {/* MiniPay: Show wallet connect button */}
          {wallet.isMiniPay ? (
            <div>
              {error && (
                <div className="mb-4 text-sm text-semantic-error">{error}</div>
              )}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleConnectWallet}
                loading={loading || wallet.isConnecting}
                disabled={loading || wallet.isConnecting || wallet.isConnected}
              >
                {wallet.isConnecting ? t.connecting : t.connectWallet}
              </Button>
            </div>
          ) : (
            <>
              {/* Standalone: Show email/phone form */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={method === 'email' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setMethod('email')}
                  className="flex-1"
                >
                  {t.email}
                </Button>
                <Button
                  variant={method === 'phone' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setMethod('phone')}
                  className="flex-1"
                >
                  {t.phone}
                </Button>
              </div>

              <form onSubmit={handleSubmit}>
                {method === 'email' ? (
                  <Input
                    type="email"
                    label={t.email}
                    placeholder={t.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mb-4"
                  />
                ) : (
                  <Input
                    type="tel"
                    label={t.phone}
                    placeholder={t.phonePlaceholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="mb-4"
                  />
                )}

                {error && (
                  <div className="mb-4 text-sm text-semantic-error">{error}</div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  disabled={loading || (method === 'email' ? !email : !phone)}
                >
                  {t.continue}
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </Container>
  );
}
