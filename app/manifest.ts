import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NeonPay',
    short_name: 'NeonPay',
    description:
      'NeonPay is a stablecoin wallet and payments app built on Celo. Hold Ripio and Mento stables, send and receive, and swap available pairs.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f0fdf9',
    theme_color: '#f0fdf9',
    icons: [
      {
        src: '/logos/icon-neonpay.png',
        sizes: '200x200',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logos/icon-neonpay.png',
        sizes: '200x200',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
