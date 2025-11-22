import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { AppProvider } from '@/context/AppContext';
import './globals.css';

const CardNav = dynamic(() => import('@/components/CardNav/CardNav'), {
  ssr: false,
});

export const metadata: Metadata = {
  title: 'NeonPay MX - MiniPay MiniApp',
  description: 'A MiniApp mock for MiniPay demonstrating the full UX flow',
};

const navItems = [
  {
    label: 'Home',
    bgColor: '#ffffff', // white background
    textColor: '#000000', // black text for readability
    links: [
      { label: 'Dashboard', href: '/', ariaLabel: 'Go to Dashboard' },
      { label: 'Overview', href: '/', ariaLabel: 'View Overview' }
    ]
  },
  {
    label: 'Payments',
    bgColor: '#ffffff', // white background
    textColor: '#000000', // black text for readability
    links: [
      { label: 'Add Funds', href: '/topup', ariaLabel: 'Add Funds' },
      { label: 'Send Money', href: '/send', ariaLabel: 'Send Money' }
    ]
  },
  {
    label: 'Account',
    bgColor: '#ffffff', // white background
    textColor: '#000000', // black text for readability
    links: [
      { label: 'Verify', href: '/verify-self', ariaLabel: 'Verify Identity' },
      { label: 'Settings', href: '/', ariaLabel: 'Account Settings' }
    ]
  }
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <CardNav 
            logo="NeonPay MX" 
            items={navItems}
            baseColor="rgba(204, 255, 0, 0.2)"
            menuColor="#CCFF00"
            buttonBgColor="#CCFF00"
            buttonTextColor="#000"
          />
          <main id="main-content" className="pt-24 md:pt-28">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}

