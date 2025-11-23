import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { AppProvider } from '@/context/AppContext';
import { PrivyProviderWrapper } from '@/components/Wallet/PrivyProvider';
import { ToastProvider } from '@/components/UI/Toast';
import './globals.css';

const CardNavWrapper = dynamic(() => import('@/components/CardNav/CardNavWrapper').then(mod => ({ default: mod.CardNavWrapper })), {
  ssr: false,
});

export const metadata: Metadata = {
  title: 'NeonPay MX - MiniPay MiniApp',
  description: 'A MiniApp mock for MiniPay demonstrating the full UX flow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PrivyProviderWrapper>
          <AppProvider>
            <ToastProvider>
              <CardNavWrapper />
              <main id="main-content" className="pt-24 md:pt-28">
                {children}
              </main>
            </ToastProvider>
          </AppProvider>
        </PrivyProviderWrapper>
      </body>
    </html>
  );
}
