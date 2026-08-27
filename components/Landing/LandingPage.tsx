'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Container } from '@/components/Layout/Container';
import { Button } from '@/components/UI/Button';
import { NeonHoverCard } from '@/components/UI/NeonHoverCard';
import { Badge } from '@/components/UI/Badge';
import { YieldCard } from '@/components/UI/yield-card';
import { ProviderPickerModal } from '@/components/Wallet/ProviderPickerModal';
import {
  Icon,
  WalletIcon,
  SendIcon,
  ArrowDownIcon,
  SwapIcon,
  LanguageIcon,
} from '@/components/Icons';
import type { StandaloneWalletProviderType } from '@/utils/wallet/types';
import { waitForWalletSession } from '@/utils/wallet/waitForSession';
import {
  HeroColorPanelsActions,
  HeroColorPanelsContainer,
  HeroColorPanelsContent,
  HeroColorPanelsDescription,
  HeroColorPanelsHeading,
  HeroColorPanelsMobileVisual,
  HeroColorPanelsRoot,
  HeroColorPanelsVisual,
} from '@/components/Landing/hero-color-panel';
import { PartnerStackedLogos } from '@/components/Landing/PartnerStackedLogos';

const COPY = {
  en: {
    brand: 'NeonPay',
    domain: 'neonpay.celo.mx',
    getStarted: 'Get started',
    openApp: 'Open app',
    connecting: 'Connecting…',
    heroEyebrow: 'Payments on Celo for Mexico and LATAM',
    heroTitle: 'LATAM stablecoins. One wallet.',
    heroSubtitle: 'Hold. Send. Swap. Spend.',
    heroBody:
      'NeonPay is a stablecoin wallet and payments app built on Celo. Use it on the web or directly inside MiniPay to hold supported Ripio and Mento stablecoins, send and receive payments, and swap available pairs.',
    seeLive: 'See how it works',
    partnersEyebrow: 'Built on Celo',
    partnersTitle: 'The stack behind NeonPay',
    howTitle: 'How it works',
    howSteps: [
      {
        n: '1',
        title: 'Connect',
        body: 'Use NeonPay on the web or open it directly inside MiniPay.',
      },
      {
        n: '2',
        title: 'Move money',
        body: 'Hold, send and receive supported LATAM and dollar stablecoins.',
      },
      {
        n: '3',
        title: 'Swap when you need to',
        body: 'Trade available Ripio and Mento pairs, including wARS and wBRL today. wMXN coming next.',
      },
    ],
    liveTitle: 'What you can do',
    live: [
      {
        title: 'Hold',
        body: 'Supported LATAM and dollar stablecoins.',
      },
      {
        title: 'Send',
        body: 'To a wallet, Celo name or QR.',
      },
      {
        title: 'Receive',
        body: 'Share an address, QR or payment request.',
      },
      {
        title: 'Swap',
        body: 'Trade available pairs through integrated liquidity.',
      },
    ],
    miniPayTitle: 'Built for MiniPay too',
    miniPayBody:
      "NeonPay runs directly inside MiniPay, extending the wallet to supported LATAM stablecoins that aren't natively available in the app.",
    miniPaySpend:
      'Swap local stables into MiniPay-supported dollar stablecoins and use them with the MiniPay Card.',
    ctaTitle: 'Use NeonPay',
    ctaBody: 'On the web, or directly inside MiniPay.',
    footer: 'A Celo MX product',
    error: 'Could not connect wallet',
  },
  es: {
    brand: 'NeonPay',
    domain: 'neonpay.celo.mx',
    getStarted: 'Empieza ahora',
    openApp: 'Abrir app',
    connecting: 'Conectando…',
    heroEyebrow: 'Pagos en Celo para México y LATAM',
    heroTitle: 'Stables de LATAM. Una wallet.',
    heroSubtitle: 'Guarda. Envía. Cambia. Gasta.',
    heroBody:
      'NeonPay es una wallet de stablecoins y una app de pagos construida sobre Celo. Úsala en la web o directo en MiniPay para guardar stables de Ripio y Mento, enviar y recibir pagos, y cambiar los pares disponibles.',
    seeLive: 'Ver cómo funciona',
    partnersEyebrow: 'Construido sobre Celo',
    partnersTitle: 'El stack detrás de NeonPay',
    howTitle: 'Cómo funciona',
    howSteps: [
      {
        n: '1',
        title: 'Conecta',
        body: 'Usa NeonPay en la web o ábrela directo en MiniPay.',
      },
      {
        n: '2',
        title: 'Mueve dinero',
        body: 'Guarda, envía y recibe stables de LATAM y en dólares.',
      },
      {
        n: '3',
        title: 'Cambia cuando lo necesites',
        body: 'Cambia pares de Ripio y Mento disponibles, incluidos wARS y wBRL hoy. wMXN viene después.',
      },
    ],
    liveTitle: 'Qué puedes hacer',
    live: [
      {
        title: 'Guardar',
        body: 'Stables de LATAM y en dólares.',
      },
      {
        title: 'Enviar',
        body: 'A una wallet, un nombre Celo o un QR.',
      },
      {
        title: 'Recibir',
        body: 'Comparte una dirección, un QR o una solicitud de pago.',
      },
      {
        title: 'Cambiar',
        body: 'Cambia pares disponibles con liquidez integrada.',
      },
    ],
    miniPayTitle: 'También para MiniPay',
    miniPayBody:
      'NeonPay corre directo en MiniPay y extiende la wallet a stables de LATAM que no están nativos en la app.',
    miniPaySpend:
      'Cambia stables locales a dólares que MiniPay sí soporta y úsalos con la MiniPay Card.',
    ctaTitle: 'Usa NeonPay',
    ctaBody: 'En la web, o directo en MiniPay.',
    footer: 'Un producto de Celo MX',
    error: 'No se pudo conectar la billetera',
  },
} as const;

const LIVE_ICONS = [WalletIcon, SendIcon, ArrowDownIcon, SwapIcon];

export function LandingPage() {
  const router = useRouter();
  const { user, language, setLanguage, wallet } = useApp();
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  // MiniPay: boot until connected, then /home; fail open to marketing UI.
  const [miniPayBoot, setMiniPayBoot] = useState<'idle' | 'booting' | 'failed'>('idle');
  const t = COPY[language];
  const loggedIn = Boolean(user && wallet.isConnected);

  useEffect(() => {
    if (!wallet.isMiniPay) {
      setMiniPayBoot('idle');
      return;
    }
    if (loggedIn) {
      setMiniPayBoot('idle');
      router.replace('/home');
      return;
    }

    setMiniPayBoot((prev) => (prev === 'failed' ? 'failed' : 'booting'));
    const timer = window.setTimeout(() => {
      setMiniPayBoot((prev) => (prev === 'booting' ? 'failed' : prev));
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [wallet.isMiniPay, loggedIn, router]);

  const handleProviderSelect = async (provider: StandaloneWalletProviderType) => {
    setError('');
    try {
      if (provider !== wallet.selectedProvider) {
        await wallet.setProvider(provider);
      }
      await waitForWalletSession(provider);
      setPickerOpen(false);
      await wallet.connect();
      router.push('/home');
    } catch (e: unknown) {
      setPickerOpen(true);
      setError(e instanceof Error ? e.message : t.error);
      throw e;
    }
  };

  const handleGetStarted = () => {
    setError('');
    if (loggedIn) {
      router.push('/home');
      return;
    }
    if (wallet.isMiniPay) {
      setMiniPayBoot('booting');
      void wallet.connect()
        .then(() => router.push('/home'))
        .catch((e: unknown) => {
          setMiniPayBoot('failed');
          setError(e instanceof Error ? e.message : t.error);
        });
      return;
    }
    setPickerOpen(true);
  };

  if (wallet.isMiniPay && miniPayBoot !== 'failed' && !loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {language === 'es' ? 'Abriendo NeonPay…' : 'Opening NeonPay…'}
        </p>
      </div>
    );
  }

  const ctaLabel = wallet.isConnecting ? t.connecting : loggedIn ? t.openApp : t.getStarted;

  return (
    <div className="min-h-screen">
      <div className="container flex justify-end pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
          aria-label="Toggle language"
          className="border border-gray-200 dark:border-gray-700"
        >
          <Icon>
            <LanguageIcon />
          </Icon>
          {language.toUpperCase()}
        </Button>
      </div>

      <HeroColorPanelsRoot
        srTitle={`${t.heroTitle} ${t.heroSubtitle}`}
        title={t.heroTitle}
        subtitle={t.heroSubtitle}
        description={t.heroBody}
        showCta
        showBadges={false}
        renderCta={() => (
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pb-4 md:pb-0">
            {error && <p className="w-full text-sm text-semantic-error lg:text-left">{error}</p>}
            <Button
              variant="primary"
              size="lg"
              onClick={handleGetStarted}
              loading={wallet.isConnecting}
              disabled={wallet.isConnecting}
            >
              <Icon>
                <WalletIcon />
              </Icon>
              {ctaLabel}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t.seeLive}
            </Button>
          </div>
        )}
      >
        <HeroColorPanelsContainer className="pb-6 sm:pb-8 lg:pb-10">
          <HeroColorPanelsContent>
            <Badge variant="neon" size="md" className="mx-auto lg:mx-0 w-fit">
              {t.heroEyebrow}
            </Badge>
            <HeroColorPanelsHeading />
            <HeroColorPanelsDescription />
            <HeroColorPanelsActions />
          </HeroColorPanelsContent>
          <HeroColorPanelsVisual />
        </HeroColorPanelsContainer>
        <HeroColorPanelsMobileVisual />
      </HeroColorPanelsRoot>

      <Container>
        <section className="pt-4 md:pt-6 pb-16 md:pb-20">
          <div className="mx-auto flex w-full max-w-screen-lg flex-col items-center gap-3">
            <div className="text-center">
              <p className="mb-1 text-sm font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                {t.partnersEyebrow}
              </p>
              <h2 className="bg-gradient-to-t from-neutral-600 to-neutral-800 bg-clip-text text-2xl leading-tight text-transparent dark:from-stone-200 dark:to-neutral-200 sm:text-3xl lg:text-4xl">
                {t.partnersTitle}
              </h2>
            </div>
            <PartnerStackedLogos />
          </div>
        </section>

        <section id="how" className="pb-16 md:pb-24 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-8 text-center">
            {t.howTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {t.howSteps.map((step) => (
              <NeonHoverCard key={step.n} padding="lg">
                <div className="w-10 h-10 rounded-xl bg-acid-lemon text-gray-900 font-extrabold flex items-center justify-center mb-4">
                  {step.n}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{step.body}</p>
              </NeonHoverCard>
            ))}
          </div>
        </section>

        <section id="live" className="pb-16 md:pb-24 scroll-mt-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
              {t.liveTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {t.live.map((item, i) => {
              const LiveIcon = LIVE_ICONS[i];
              return (
                <NeonHoverCard key={item.title} padding="lg">
                  <div className="p-3 bg-acid-lemon/15 rounded-xl inline-flex mb-3">
                    <Icon color="neon" size="md">
                      <LiveIcon />
                    </Icon>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{item.body}</p>
                </NeonHoverCard>
              );
            })}
          </div>
        </section>

        <section id="minipay" className="pb-16 md:pb-24 scroll-mt-24">
          <YieldCard
            title={t.miniPayTitle}
            description={t.miniPayBody}
            detail={t.miniPaySpend}
          />
        </section>

        <section className="pb-20">
          <NeonHoverCard variant="premium" padding="xl" className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
              {t.ctaTitle}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{t.ctaBody}</p>
            <Button
              variant="primary"
              size="lg"
              onClick={handleGetStarted}
              loading={wallet.isConnecting}
              disabled={wallet.isConnecting}
            >
              <Icon>
                <WalletIcon />
              </Icon>
              {ctaLabel}
            </Button>
          </NeonHoverCard>
        </section>

        <footer className="pb-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p className="font-logo text-[28px] text-gray-900 dark:text-white mb-3">{t.brand}</p>
          <p>
            {t.footer} · {t.domain}
          </p>
        </footer>
      </Container>

      <ProviderPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selected={wallet.selectedProvider}
        language={language}
        connecting={wallet.isConnecting}
        onSelect={handleProviderSelect}
      />
    </div>
  );
}
