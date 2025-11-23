'use client';

import { useApp } from '@/context/AppContext';
import type { CardNavItem } from './CardNav';

type CardNavLink = {
  label: string;
  href?: string;
  ariaLabel: string;
};

export function useNavItems(): CardNavItem[] {
  const { mercadoPago, user, language, theme } = useApp();

  const labels = {
    en: {
      wallet: 'Wallet',
      payments: 'Payments',
      account: 'Account',
      home: 'Home',
      receive: 'Receive',
      transactions: 'Transactions',
      activity: 'Activity',
      sendMoney: 'Send Money',
      addFunds: 'Add Funds',
      payServices: 'Pay Services',
      swapTokens: 'Swap Tokens',
      connectMercado: 'Connect Mercado Pago',
      verifyIdentity: 'Verify Identity',
      settings: 'Settings',
    },
    es: {
      wallet: 'Billetera',
      payments: 'Pagos',
      account: 'Cuenta',
      home: 'Inicio',
      receive: 'Recibir',
      transactions: 'Transacciones',
      activity: 'Actividad',
      sendMoney: 'Enviar Dinero',
      addFunds: 'Agregar Fondos',
      payServices: 'Pagar Servicios',
      swapTokens: 'Intercambiar Tokens',
      connectMercado: 'Conectar Mercado Pago',
      verifyIdentity: 'Verificar Identidad',
      settings: 'Configuración',
    },
  };

  const t = labels[language];

  const walletLinks: CardNavLink[] = [
    { label: t.home, href: '/', ariaLabel: 'Go to Home' },
    { label: t.receive, href: '/receive', ariaLabel: 'Receive Payment' },
    { label: t.transactions, href: '/transactions', ariaLabel: 'View Transactions' },
    { label: t.activity, href: '/activity', ariaLabel: 'View Activity' },
  ];

  const paymentLinks: CardNavLink[] = [
    { label: t.sendMoney, href: '/send', ariaLabel: 'Send Money' },
    { label: t.addFunds, href: '/topup', ariaLabel: 'Add Funds' },
    { label: language === 'en' ? 'Mercado Pago' : 'Mercado Pago', href: '/mercado-pago', ariaLabel: 'Mercado Pago' },
    { label: t.payServices, href: '/services', ariaLabel: 'Pay Services' },
    { label: t.swapTokens, href: '/swap', ariaLabel: 'Swap Tokens' },
  ];

  const accountLinks: CardNavLink[] = [
    ...(user && !user.selfVerified
      ? [{ label: t.verifyIdentity, href: '/verify-self', ariaLabel: 'Verify Identity' } as CardNavLink]
      : []),
    { label: t.settings, href: '/settings', ariaLabel: 'Account Settings' },
  ];

  // Theme-aware colors for better readability
  const isDark = theme === 'dark';
  
  const items: CardNavItem[] = [
    {
      label: t.wallet,
      bgColor: isDark 
        ? 'rgba(59, 130, 246, 0.25)' // More opaque blue for dark mode
        : 'rgba(59, 130, 246, 0.15)',
      textColor: isDark 
        ? '#93c5fd' // Light blue text for dark mode
        : '#1e40af', // Dark blue text for light mode
      links: walletLinks,
    },
    {
      label: t.payments,
      bgColor: isDark 
        ? 'rgba(34, 197, 94, 0.25)' // More opaque green for dark mode
        : 'rgba(34, 197, 94, 0.15)',
      textColor: isDark 
        ? '#86efac' // Light green text for dark mode
        : '#15803d', // Dark green text for light mode
      links: paymentLinks,
    },
    {
      label: t.account,
      bgColor: isDark 
        ? 'rgba(168, 85, 247, 0.25)' // More opaque purple for dark mode
        : 'rgba(168, 85, 247, 0.15)',
      textColor: isDark 
        ? '#c4b5fd' // Light purple text for dark mode
        : '#7c3aed', // Dark purple text for light mode
      links: accountLinks,
    },
  ];

  return items;
}
