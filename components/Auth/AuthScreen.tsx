'use client';

import React, { useState } from 'react';
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
  const { setUser, language } = useApp();
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const labels = {
    en: {
      title: 'Connect Your Wallet',
      subtitle: 'Sign in with email or phone to create your wallet',
      email: 'Email',
      phone: 'Phone',
      emailPlaceholder: 'Enter your email',
      phonePlaceholder: 'Enter your phone number',
      continue: 'Continue',
      back: 'Back',
    },
    es: {
      title: 'Conecta Tu Billetera',
      subtitle: 'Inicia sesión con correo o teléfono para crear tu billetera',
      email: 'Correo',
      phone: 'Teléfono',
      emailPlaceholder: 'Ingresa tu correo',
      phonePlaceholder: 'Ingresa tu número de teléfono',
      continue: 'Continuar',
      back: 'Atrás',
    },
  };

  const t = labels[language];

  const generateWalletAddress = () => {
    return '0x' + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Mock authentication delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const walletAddress = generateWalletAddress();

      setUser({
        id: method === 'email' ? email : phone,
        [method]: method === 'email' ? email : phone,
        walletAddress,
        isVerified: true,
        selfVerified: false,
      });

      router.push('/');
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="py-8">
        <BackButton />
        
        <Card padding="lg" className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600 mb-6">{t.subtitle}</p>

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
        </Card>
      </div>
    </Container>
  );
}
