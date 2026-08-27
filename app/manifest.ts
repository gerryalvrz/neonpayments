import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NeonPay',
    short_name: 'NeonPay',
    description:
      'NeonPay is a stablecoin wallet and payments app built on Celo. Hold, send, receive, and swap LATAM stables — on the web or inside MiniPay.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ccff00',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
