'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Container } from '@/components/Layout/Container';
import { BackButton } from '@/components/Layout/BackButton';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Progress } from '@/components/UI/Loading';
import { Badge } from '@/components/UI/Badge';
import { Icon, CheckCircleIcon } from '@/components/Icons';

type Step = 'intro' | 'verifying' | 'success';

export function VerifySelf() {
  const router = useRouter();
  const { setSelfVerification, setUser, user, language } = useApp();
  const [step, setStep] = useState<Step>('intro');
  const [progress, setProgress] = useState(0);
  const [verificationData, setVerificationData] = useState<{
    age?: number;
    country?: string;
    sanctionsCheck?: boolean;
    humanityCheck?: boolean;
  } | null>(null);

  const labels = {
    en: {
      title: 'Verify Your Identity',
      subtitle: 'Complete verification with Self Protocol',
      description: 'We will verify your age, location, and perform humanity checks to ensure you are a real person.',
      start: 'Start Verification',
      verifying: 'Verifying...',
      checkingAge: 'Checking age...',
      checkingCountry: 'Checking country...',
      checkingSanctions: 'Checking sanctions list...',
      checkingHumanity: 'Performing humanity check...',
      success: 'Verification Complete!',
      verified: 'You have been successfully verified.',
      continue: 'Continue',
    },
    es: {
      title: 'Verifica Tu Identidad',
      subtitle: 'Completa la verificación con Self Protocol',
      description: 'Verificaremos tu edad, ubicación y realizaremos verificaciones de humanidad para asegurar que eres una persona real.',
      start: 'Iniciar Verificación',
      verifying: 'Verificando...',
      checkingAge: 'Verificando edad...',
      checkingCountry: 'Verificando país...',
      checkingSanctions: 'Verificando lista de sanciones...',
      checkingHumanity: 'Realizando verificación de humanidad...',
      success: '¡Verificación Completa!',
      verified: 'Has sido verificado exitosamente.',
      continue: 'Continuar',
    },
  };

  const t = labels[language];

  const handleStart = async () => {
    setStep('verifying');
    
    // Simulate verification steps
    const steps = [
      { label: t.checkingAge, progress: 25 },
      { label: t.checkingCountry, progress: 50 },
      { label: t.checkingSanctions, progress: 75 },
      { label: t.checkingHumanity, progress: 100 },
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(step.progress);
    }

    // Mock verification data
    const data = {
      age: 25,
      country: 'MX',
      sanctionsCheck: true,
      humanityCheck: true,
    };

    setVerificationData(data);
    setSelfVerification({
      verified: true,
      ...data,
      proof: 'self_' + Math.random().toString(36).substr(2, 9),
    });

    if (user) {
      setUser({
        ...user,
        selfVerified: true,
      });
    }

    setStep('success');
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
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleStart}
              >
                {t.start}
              </Button>
            </div>
          )}

          {step === 'verifying' && (
            <div className="space-y-4">
              <Progress value={progress} />
              <p className="text-center text-gray-600">{t.verifying}</p>
              <div className="space-y-2 text-sm">
                {progress >= 25 && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Badge variant="success" size="sm">✓</Badge>
                    {t.checkingAge}
                  </div>
                )}
                {progress >= 50 && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Badge variant="success" size="sm">✓</Badge>
                    {t.checkingCountry}
                  </div>
                )}
                {progress >= 75 && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Badge variant="success" size="sm">✓</Badge>
                    {t.checkingSanctions}
                  </div>
                )}
                {progress >= 100 && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Badge variant="success" size="sm">✓</Badge>
                    {t.checkingHumanity}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'success' && verificationData && (
            <div className="space-y-4 text-center">
              <Icon size="xl" color="success" className="mb-2">
                <CheckCircleIcon />
              </Icon>
              <p className="text-lg font-semibold text-gray-900">{t.success}</p>
              <p className="text-sm text-gray-600">{t.verified}</p>
              <div className="mt-4 space-y-2 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Age:</span>
                  <span className="font-semibold">{verificationData.age}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Country:</span>
                  <span className="font-semibold">{verificationData.country}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sanctions Check:</span>
                  <Badge variant="success" size="sm">Passed</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Humanity Check:</span>
                  <Badge variant="success" size="sm">Passed</Badge>
                </div>
              </div>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleContinue}
              >
                {t.continue}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </Container>
  );
}
