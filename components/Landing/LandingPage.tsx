'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Container } from '@/components/Layout/Container';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { ProviderPickerModal } from '@/components/Wallet/ProviderPickerModal';
import {
  Icon,
  WalletIcon,
  SendIcon,
  ArrowDownIcon,
  SwapIcon,
  LanguageIcon,
  CreditCardIcon,
  HistoryIcon,
  ShieldIcon,
  BoltIcon,
  UserIcon,
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
import { LogoCarousel } from '@/components/UI/logo-carousel';

const COPY = {
  en: {
    brand: 'NeonPay',
    domain: 'neonpay.celo.mx',
    getStarted: 'Get started',
    openApp: 'Open app',
    connecting: 'Connecting…',
    heroEyebrow: 'Payments for Mexico & Latin America',
    heroTitle: 'Send digital dollars.',
    heroSubtitle: 'As simple as a transfer.',
    heroBody:
      'NeonPay is a wallet for sending, receiving, and converting money on Celo. Connect once, then pay with USDC, USDT, or cUSD — no crypto expertise required.',
    seeLive: 'See what’s live',
    partnersEyebrow: 'Built on Celo',
    partnersTitle: 'The stack behind NeonPay',
    whatTitle: 'What NeonPay is',
    whatBody:
      'A simple payments app. You log in with MiniPay on your phone, or with email / a wallet on the web. After that you can send to an address, a Celo name, or a QR code — and convert Argentine peso and Brazilian real tokens into USDT when you need to.',
    howTitle: 'How it works',
    howSteps: [
      {
        n: '1',
        title: 'Connect',
        body: 'MiniPay opens automatically. On the web, pick Privy, thirdweb, or human.tech.',
      },
      {
        n: '2',
        title: 'Send or receive',
        body: 'Pay USDC, USDT, or cUSD to a wallet, a name, or a QR. Share yours to get paid.',
      },
      {
        n: '3',
        title: 'Convert when you need to',
        body: 'Swap live ARS and BRL tokens to USDT — the corridor that is actually on today.',
      },
    ],
    liveTitle: 'Live today',
    liveSubtitle: 'This is what you can do after you log in.',
    live: [
      {
        title: 'Send',
        body: 'USDC, USDT, and cUSD to an address, Celo Name Service, or QR.',
      },
      {
        title: 'Receive',
        body: 'Show a QR or share a payment request from your wallet.',
      },
      {
        title: 'Convert',
        body: 'wARS and wBRL ↔ USDT through Textile FX.',
      },
      {
        title: 'Log in',
        body: 'MiniPay, email / social, or a wallet you already have.',
      },
      {
        title: 'Activity',
        body: 'See sends and swaps after you leave and come back.',
      },
      {
        title: 'English & Spanish',
        body: 'Switch language any time. MiniPay defaults to Spanish.',
      },
    ],
    roadmapTitle: 'What’s next',
    roadmapSubtitle: 'Honest roadmap. We will not fake these in the app.',
    later: [
      {
        title: 'Deposit from Mercado Pago',
        body: 'Move MXN from Mercado Pago into your wallet as USDC. You can connect the account today; funding is not live yet.',
      },
      {
        title: 'Card top-up',
        body: 'Add funds with a debit or credit card.',
      },
      {
        title: 'Pay Mexican bills',
        body: 'CFE, phone, and other services — without leaving NeonPay.',
      },
      {
        title: 'More conversion pairs',
        body: 'Stablecoin-to-stablecoin swaps, and Mexican peso when that corridor exists.',
      },
      {
        title: 'Contacts and receipts',
        body: 'Saved recipients and a shareable receipt after every send.',
      },
      {
        title: 'Identity verification',
        body: 'Optional Self Protocol check for flows that need it.',
      },
    ],
    ctaTitle: 'Ready to try it?',
    ctaBody: 'Log in, then you are in the same app we use today: send, receive, convert.',
    footer: 'A Celo MX product',
    error: 'Could not connect wallet',
  },
  es: {
    brand: 'NeonPay',
    domain: 'neonpay.celo.mx',
    getStarted: 'Empieza ahora',
    openApp: 'Abrir app',
    connecting: 'Conectando…',
    heroEyebrow: 'Pagos para México y América Latina',
    heroTitle: 'Envía dólares digitales.',
    heroSubtitle: 'Tan simple como una transferencia.',
    heroBody:
      'NeonPay es una billetera para enviar, recibir y convertir dinero en Celo. Conectas una vez y pagas con USDC, USDT o cUSD — sin saber de cripto.',
    seeLive: 'Ver lo que ya funciona',
    partnersEyebrow: 'Construido sobre Celo',
    partnersTitle: 'El stack detrás de NeonPay',
    whatTitle: 'Qué es NeonPay',
    whatBody:
      'Una app de pagos simple. Entras con MiniPay en el celular, o con correo / una billetera en la web. Después puedes enviar a una dirección, un nombre Celo o un QR — y convertir tokens de peso argentino y real brasileño a USDT cuando lo necesites.',
    howTitle: 'Cómo funciona',
    howSteps: [
      {
        n: '1',
        title: 'Conecta',
        body: 'MiniPay abre solo. En la web elige Privy, thirdweb o human.tech.',
      },
      {
        n: '2',
        title: 'Envía o recibe',
        body: 'Paga USDC, USDT o cUSD a una billetera, un nombre o un QR. Comparte el tuyo para que te paguen.',
      },
      {
        n: '3',
        title: 'Convierte cuando haga falta',
        body: 'Cambia tokens ARS y BRL a USDT — el corredor que sí está activo hoy.',
      },
    ],
    liveTitle: 'Hoy ya puedes',
    liveSubtitle: 'Esto es lo que funciona después de iniciar sesión.',
    live: [
      {
        title: 'Enviar',
        body: 'USDC, USDT y cUSD a una dirección, Celo Name Service o QR.',
      },
      {
        title: 'Recibir',
        body: 'Muestra un QR o comparte una solicitud de pago.',
      },
      {
        title: 'Convertir',
        body: 'wARS y wBRL ↔ USDT con Textile FX.',
      },
      {
        title: 'Entrar',
        body: 'MiniPay, correo / redes, o una billetera que ya tengas.',
      },
      {
        title: 'Actividad',
        body: 'Ves envíos y swaps aunque cierres la app y vuelvas.',
      },
      {
        title: 'Inglés y español',
        body: 'Cambia el idioma cuando quieras. MiniPay usa español por defecto.',
      },
    ],
    roadmapTitle: 'Qué sigue',
    roadmapSubtitle: 'Hoja de ruta honesta. No vamos a simular esto en la app.',
    later: [
      {
        title: 'Depositar desde Mercado Pago',
        body: 'Pasar MXN de Mercado Pago a tu billetera como USDC. Ya puedes conectar la cuenta; el fondeo aún no está activo.',
      },
      {
        title: 'Recarga con tarjeta',
        body: 'Agregar fondos con débito o crédito.',
      },
      {
        title: 'Pagar servicios en México',
        body: 'CFE, teléfono y otros pagos — sin salir de NeonPay.',
      },
      {
        title: 'Más pares de conversión',
        body: 'Swaps entre estables, y peso mexicano cuando exista el corredor.',
      },
      {
        title: 'Contactos y recibos',
        body: 'Destinatarios guardados y un recibo para compartir después de cada envío.',
      },
      {
        title: 'Verificación de identidad',
        body: 'Chequeo opcional con Self Protocol cuando un flujo lo pida.',
      },
    ],
    ctaTitle: '¿Listo para probarlo?',
    ctaBody: 'Inicia sesión y entras a la misma app de siempre: enviar, recibir, convertir.',
    footer: 'Un producto de Celo MX',
    error: 'No se pudo conectar la billetera',
  },
} as const;

const LIVE_ICONS = [SendIcon, ArrowDownIcon, SwapIcon, WalletIcon, HistoryIcon, LanguageIcon];
const LATER_ICONS = [CreditCardIcon, ArrowDownIcon, BoltIcon, SwapIcon, UserIcon, ShieldIcon];

export function LandingPage() {
  const router = useRouter();
  const { user, language, setLanguage, wallet } = useApp();
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const t = COPY[language];
  const loggedIn = Boolean(user && wallet.isConnected);

  useEffect(() => {
    if (wallet.isMiniPay) {
      router.replace('/home');
    }
  }, [wallet.isMiniPay, router]);

  const handleProviderSelect = async (provider: StandaloneWalletProviderType) => {
    setError('');
    try {
      if (provider !== wallet.selectedProvider) {
        await wallet.setProvider(provider);
      }
      await waitForWalletSession(provider);
      await wallet.connect();
      setPickerOpen(false);
      router.push('/home');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.error);
    }
  };

  const handleGetStarted = () => {
    setError('');
    if (loggedIn) {
      router.push('/home');
      return;
    }
    if (wallet.isMiniPay) {
      void wallet.connect()
        .then(() => router.push('/home'))
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : t.error);
        });
      return;
    }
    setPickerOpen(true);
  };

  if (wallet.isMiniPay) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">Abriendo NeonPay…</p>
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
              onClick={() => document.getElementById('live')?.scrollIntoView({ behavior: 'smooth' })}
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
            <LogoCarousel columnCount={3} />
          </div>
        </section>

        <section className="pb-16 md:pb-20 max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
            {t.whatTitle}
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            {t.whatBody}
          </p>
        </section>

        <section id="how" className="pb-16 md:pb-24 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-8 text-center">
            {t.howTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {t.howSteps.map((step) => (
              <Card key={step.n} padding="lg">
                <div className="w-10 h-10 rounded-xl bg-acid-lemon text-gray-900 font-extrabold flex items-center justify-center mb-4">
                  {step.n}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{step.body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="live" className="pb-16 md:pb-24 scroll-mt-24">
          <div className="text-center mb-8">
            <Badge variant="success" size="sm" className="mb-3">
              {language === 'en' ? 'Live' : 'Activo'}
            </Badge>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
              {t.liveTitle}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{t.liveSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.live.map((item, i) => {
              const LiveIcon = LIVE_ICONS[i];
              return (
                <Card key={item.title} padding="lg">
                  <div className="p-3 bg-acid-lemon/15 rounded-xl inline-flex mb-3">
                    <Icon color="neon" size="md">
                      <LiveIcon />
                    </Icon>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{item.body}</p>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="roadmap" className="pb-16 md:pb-24 scroll-mt-24">
          <div className="text-center mb-8">
            <Badge variant="warning" size="sm" className="mb-3">
              {language === 'en' ? 'Coming later' : 'Más adelante'}
            </Badge>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
              {t.roadmapTitle}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{t.roadmapSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.later.map((item, i) => {
              const LaterIcon = LATER_ICONS[i];
              return (
                <Card key={item.title} padding="lg" className="opacity-90">
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl inline-flex mb-3">
                    <Icon color="gray" size="md">
                      <LaterIcon />
                    </Icon>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{item.body}</p>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="pb-20">
          <Card variant="premium" padding="xl" className="text-center max-w-2xl mx-auto">
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
          </Card>
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
