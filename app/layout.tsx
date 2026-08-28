import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Inter, JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { AppProvider } from '@/context/AppContext';
import { WalletEmbedRoot } from '@/components/Wallet/WalletEmbedRoot';
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

const APP_ICON = '/logos/icon-neonpay.png';

export const metadata: Metadata = {
  title: 'NeonPay — LATAM stablecoins. One wallet.',
  description:
    'NeonPay is a stablecoin wallet and payments app built on Celo. Hold Ripio and Mento stables, send and receive, and swap available pairs — on the web or inside MiniPay.',
  metadataBase: new URL('https://neonpay.celo.mx'),
  applicationName: 'NeonPay',
  icons: {
    icon: [{ url: APP_ICON, type: 'image/png', sizes: '200x200' }],
    shortcut: [{ url: APP_ICON, type: 'image/png' }],
    apple: [{ url: APP_ICON, type: 'image/png', sizes: '200x200' }],
  },
  appleWebApp: {
    capable: true,
    title: 'NeonPay',
    statusBarStyle: 'default',
  },
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
        <WalletEmbedRoot>
          <AppProvider>
            <ToastProvider>
              <CardNavWrapper />
              <main id="main-content" className="pt-24 md:pt-28">
                {children}
              </main>
            </ToastProvider>
          </AppProvider>
        </WalletEmbedRoot>
      </body>
    </html>
  );
}
