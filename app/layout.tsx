import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Inter, JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { AppProvider } from '@/context/AppContext';
import { WalletSdkShell } from '@/components/Wallet/WalletSdkShell';
import { ToastProvider } from '@/components/UI/Toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const prophit = localFont({
  src: './fonts/V5Prophit-Fading.ttf',
  variable: '--font-prophit',
  display: 'block',
  weight: '400',
});

const retroPixel = localFont({
  src: './fonts/RetroPixel.otf',
  variable: '--font-retro-pixel',
  display: 'block',
  weight: '400',
});

const CardNavWrapper = dynamic(() => import('@/components/CardNav/CardNavWrapper').then(mod => ({ default: mod.CardNavWrapper })), {
  ssr: false,
});

export const metadata: Metadata = {
  title: 'NeonPay — Send digital dollars in Mexico',
  description:
    'NeonPay is a payments app for Mexico and Latin America. Send, receive, and convert USDC, USDT, and USDm on Celo.',
  metadataBase: new URL('https://neonpay.celo.mx'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${prophit.variable} ${retroPixel.variable}`}
    >
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();",
          }}
        />
        <WalletSdkShell>
          <AppProvider>
            <ToastProvider>
              <CardNavWrapper />
              <main id="main-content" className="pt-24 md:pt-28">
                {children}
              </main>
            </ToastProvider>
          </AppProvider>
        </WalletSdkShell>
      </body>
    </html>
  );
}
