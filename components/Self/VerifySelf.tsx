'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Container } from '@/components/Layout/Container';
import { BackButton } from '@/components/Layout/BackButton';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Icon, CheckCircleIcon } from '@/components/Icons';
import { SelfQRcodeWrapper, SelfAppBuilder, countries } from '@selfxyz/qrcode';

type Step = 'intro' | 'qr' | 'success';

export function VerifySelf() {
  const router = useRouter();
  const { setSelfVerification, setUser, user, language } = useApp();
  const [step, setStep] = useState<Step>('intro');
  const [selfApp, setSelfApp] = useState<any | null>(null);


  useEffect(() => {
    console.log("user in user",user)
  }, [user]);

  const labels = {
    en: {
      title: 'Verify Your Identity',
      subtitle: 'Complete verification with Self Protocol',
      description: 'Scan the QR with the Self app to verify you are 18+.',
      start: 'Start Verification',
      success: 'Verification Complete!',
      verified: 'You have been successfully verified.',
      continue: 'Continue',
    },
    es: {
      title: 'Verifica Tu Identidad',
      subtitle: 'Completa la verificación con Self Protocol',
      description: 'Escanea el QR con la app Self para verificar que eres mayor de 18 años.',
      start: 'Iniciar Verificación',
      success: '¡Verificación Completa!',
      verified: 'Has sido verificado exitosamente.',
      continue: 'Continuar',
    },
  };

  const t = labels[language];

  const endpoint = useMemo(() => {
    const envAddr = process.env.NEXT_PUBLIC_SELF_ENDPOINT;
    return String(envAddr).toLowerCase();
  }, []);

  const handleStart = () => {
    const userId = (user?.id || ethers.ZeroAddress).toLowerCase();
    const app = new SelfAppBuilder({
      version: 2,
      appName: 'Neon Pay KYC',
      scope:  'neon-pay',
      endpoint:"0x2a57095a0f93d23d03be23ea926b52c6c30d23bb" as any,
      logoBase64: 'https://i.postimg.cc/mrmVf9hm/self.png',
      userId,
      endpointType: 'staging_celo',
      chainID: 11142220 as any,
      userIdType: 'hex',
      disclosures: {
        minimumAge: 18,
      },
    }).build();

    setSelfApp(app);
    console.log('selfApp config', app);
    setStep('qr');
  };

  const handleSuccessfulVerification = () => {
    setSelfVerification({ verified: true });
    if (user) setUser({ ...user, selfVerified: true });
    setStep('success');
  };

  const handleError = () => {
    setStep('intro');
  };

  const handleContinue = () => {
    router.push('/');
  };

  return (
    <Container>
      <div className="py-8">
        <BackButton />

        <Card padding="lg" className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600 mb-6">{t.subtitle}</p>

          {step === 'intro' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{t.description}</p>
              <Button variant="primary" size="lg" fullWidth onClick={handleStart}>
                {t.start}
              </Button>
            </div>
          )}

          {step === 'qr' && selfApp && (
            <div className="space-y-4">
              <SelfQRcodeWrapper
                selfApp={selfApp}
                onSuccess={handleSuccessfulVerification}
                onError={handleError}
                type="deeplink"
                websocketUrl="wss://websocket.staging.self.xyz"
              />
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4 text-center">
              <Icon size="xl" color="success" className="mb-2">
                <CheckCircleIcon />
              </Icon>
              <p className="text-lg font-semibold text-gray-900">{t.success}</p>
              <p className="text-sm text-gray-600">{t.verified}</p>
              <Button variant="primary" size="lg" fullWidth onClick={handleContinue}>
                {t.continue}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </Container>
  );
}
