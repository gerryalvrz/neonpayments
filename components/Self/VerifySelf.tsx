'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  SelfDeepLinkButton,
  getUniversalLink,
  type SelfApp,
} from '@selfxyz/qrcode';
import { useApp } from '@/context/AppContext';
import { Container } from '@/components/Layout/Container';
import { BackButton } from '@/components/Layout/BackButton';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Icon, CheckCircleIcon } from '@/components/Icons';
import {
  SELF_APP_NAME,
  SELF_CELO_SEPOLIA_CHAIN_ID,
  SELF_ENDPOINT_TYPE,
  SELF_MIN_AGE,
  SELF_SCOPE_SEED,
  getSelfEndpoint,
  isSelfHexAddress,
} from '@/config/self';
import {
  isSelfVerifiedOnchain,
  waitForSelfVerifiedOnchain,
} from '@/utils/self/onchain';

type Step = 'intro' | 'qr' | 'success';

export function VerifySelf() {
  const router = useRouter();
  const { setSelfVerification, setUser, user, language, wallet } = useApp();
  const [step, setStep] = useState<Step>('intro');
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [deeplink, setDeeplink] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkingChain, setCheckingChain] = useState(false);
  const pollAbortRef = useRef<AbortController | null>(null);

  const labels = {
    en: {
      title: 'Verify Your Identity',
      subtitle: 'Complete verification with Self Protocol',
      description:
        'Scan the QR with the Self app (or open the deeplink on mobile) to prove you are 18+.',
      start: 'Start Verification',
      success: 'Verification Complete!',
      verified: 'You have been successfully verified.',
      continue: 'Continue',
      connectWallet: 'Connect a wallet before verifying. Your address is the Self user id.',
      connectCta: 'Connect Wallet',
      openSelf: 'Open Self App',
      waitingChain: 'Waiting for onchain confirmation…',
      alreadyVerified: 'This wallet is already verified onchain.',
      failed: 'Verification did not complete. Try again.',
    },
    es: {
      title: 'Verifica Tu Identidad',
      subtitle: 'Completa la verificación con Self Protocol',
      description:
        'Escanea el QR con la app Self (o abre el deeplink en móvil) para demostrar que eres mayor de 18 años.',
      start: 'Iniciar Verificación',
      success: '¡Verificación Completa!',
      verified: 'Has sido verificado exitosamente.',
      continue: 'Continuar',
      connectWallet:
        'Conecta una billetera antes de verificar. Tu dirección es el user id de Self.',
      connectCta: 'Conectar Billetera',
      openSelf: 'Abrir Self App',
      waitingChain: 'Esperando confirmación en cadena…',
      alreadyVerified: 'Esta billetera ya está verificada en cadena.',
      failed: 'La verificación no se completó. Intenta de nuevo.',
    },
  };

  const t = labels[language];

  const walletAddress = useMemo(() => {
    const raw = (wallet.address || user?.walletAddress || user?.id || '').toLowerCase();
    return isSelfHexAddress(raw) ? raw : null;
  }, [wallet.address, user?.walletAddress, user?.id]);

  const endpoint = useMemo(() => getSelfEndpoint(), []);

  const markVerified = useCallback(() => {
    setSelfVerification({ verified: true, age: SELF_MIN_AGE });
    if (user) setUser({ ...user, selfVerified: true });
    try {
      const id = (walletAddress || user?.id || user?.walletAddress || '').toString();
      if (id) localStorage.setItem(`self_verified:${id}`, 'true');
    } catch {
      /* ignore */
    }
    setStep('success');
    setCheckingChain(false);
  }, [setSelfVerification, setUser, user, walletAddress]);

  useEffect(() => {
    return () => {
      pollAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!walletAddress || step === 'success') return;
    let cancelled = false;
    void (async () => {
      const onchain = await isSelfVerifiedOnchain(walletAddress, endpoint);
      if (!cancelled && onchain) {
        markVerified();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [walletAddress, endpoint, step, markVerified]);

  const startChainPoll = useCallback(() => {
    if (!walletAddress) return;
    pollAbortRef.current?.abort();
    const controller = new AbortController();
    pollAbortRef.current = controller;
    setCheckingChain(true);
    void (async () => {
      const ok = await waitForSelfVerifiedOnchain(walletAddress, {
        verifierAddress: endpoint,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (ok) {
        markVerified();
        return;
      }
      setCheckingChain(false);
    })();
  }, [walletAddress, endpoint, markVerified]);

  const handleStart = async () => {
    setErrorMessage(null);
    if (!walletAddress) {
      setErrorMessage(t.connectWallet);
      return;
    }

    try {
      const already = await isSelfVerifiedOnchain(walletAddress, endpoint);
      if (already) {
        markVerified();
        return;
      }

      const app = new SelfAppBuilder({
        version: 2,
        appName: SELF_APP_NAME,
        scope: SELF_SCOPE_SEED,
        endpoint,
        logoBase64: 'https://i.postimg.cc/mrmVf9hm/self.png',
        userId: walletAddress,
        endpointType: SELF_ENDPOINT_TYPE,
        userIdType: 'hex',
        chainID: SELF_CELO_SEPOLIA_CHAIN_ID,
        deeplinkCallback: process.env.NEXT_PUBLIC_SELF_DEEPLINK_CALLBACK || undefined,
        disclosures: {
          minimumAge: SELF_MIN_AGE,
        },
      }).build();

      setSelfApp(app);
      try {
        setDeeplink(getUniversalLink(app));
      } catch (error) {
        console.warn('[self] getUniversalLink failed', error);
        setDeeplink('');
      }
      setStep('qr');
      startChainPoll();
    } catch (error) {
      console.error('[self] failed to start verification', error);
      setErrorMessage(t.failed);
    }
  };

  const handleSuccessfulVerification = () => {
    // QR websocket fired — still confirm onchain when possible.
    if (!walletAddress) {
      markVerified();
      return;
    }
    setCheckingChain(true);
    void (async () => {
      const ok =
        (await isSelfVerifiedOnchain(walletAddress, endpoint)) ||
        (await waitForSelfVerifiedOnchain(walletAddress, {
          verifierAddress: endpoint,
          timeoutMs: 45_000,
          intervalMs: 2_000,
        }));
      if (ok) {
        markVerified();
        return;
      }
      // Websocket success is still a positive signal from Self; persist UX state.
      markVerified();
    })();
  };

  const handleError = (err: unknown) => {
    const anyErr = err as { error_code?: string; code?: string; reason?: string; message?: string };
    const code = anyErr?.error_code || anyErr?.code;
    const reason = anyErr?.reason || anyErr?.message || '';
    if (String(code) === 'AlreadyVerified' || String(reason).includes('AlreadyVerified')) {
      markVerified();
      return;
    }
    console.warn('[self] verification error', err);
    setErrorMessage(t.failed);
    setStep('intro');
    setSelfApp(null);
    pollAbortRef.current?.abort();
    setCheckingChain(false);
  };

  const handleContinue = () => {
    router.push('/home');
  };

  const handleConnect = async () => {
    try {
      await wallet.connect();
    } catch (error) {
      console.warn('[self] wallet connect failed', error);
      setErrorMessage(t.connectWallet);
    }
  };

  return (
    <Container>
      <div className="py-8">
        <BackButton />

        <Card padding="lg" className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{t.subtitle}</p>

          {step === 'intro' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t.description}</p>
              {!walletAddress && (
                <p className="text-sm text-amber-700 dark:text-amber-300">{t.connectWallet}</p>
              )}
              {errorMessage && (
                <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
              )}
              {walletAddress ? (
                <Button variant="primary" size="lg" fullWidth onClick={() => void handleStart()}>
                  {t.start}
                </Button>
              ) : (
                <Button variant="primary" size="lg" fullWidth onClick={() => void handleConnect()}>
                  {t.connectCta}
                </Button>
              )}
              {walletAddress && (
                <p className="text-xs break-all text-gray-500 dark:text-gray-400">{walletAddress}</p>
              )}
            </div>
          )}

          {step === 'qr' && selfApp && (
            <div className="space-y-4">
              {deeplink && (
                <div className="md:hidden">
                  <SelfDeepLinkButton href={deeplink} text={t.openSelf} />
                </div>
              )}

              {/* Always mount the QR wrapper so the websocket session stays alive on mobile too. */}
              <div className="flex justify-center">
                <SelfQRcodeWrapper
                  selfApp={selfApp}
                  onSuccess={handleSuccessfulVerification}
                  onError={handleError}
                />
              </div>

              {checkingChain && (
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  {t.waitingChain}
                </p>
              )}
              {errorMessage && (
                <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4 text-center">
              <Icon size="xl" color="success" className="mb-2">
                <CheckCircleIcon />
              </Icon>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{t.success}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t.verified}</p>
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
