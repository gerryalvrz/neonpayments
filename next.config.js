/** @type {import('next').NextConfig} */

/**
 * Privy production checklist requires:
 * - Content-Security-Policy (allow Privy/WalletConnect iframes + APIs)
 * - X-Frame-Options / CSP frame-ancestors (block clickjacking of your app)
 *
 * @see https://docs.privy.io/security/implementation-guide/content-security-policy
 *
 * Tip: to validate without breaking the app, temporarily rename the CSP key to
 * Content-Security-Policy-Report-Only, then flip back once login/tx flows work.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js + Privy CAPTCHA (Cloudflare Turnstile). 'unsafe-inline'/'unsafe-eval'
  // are commonly needed for Next without nonce-based CSP; tighten later if desired.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Allow same-origin frames/workers plus Privy / WaaP / WalletConnect / thirdweb
  // WaaP (human.tech) still loads Silk/WaaP hosts — see @human.tech/waap-constants
  "child-src 'self' blob: https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://*.human.tech https://human.tech https://*.thirdweb.com https://thirdweb.com https://silksecure.net https://*.silksecure.net https://waap.xyz https://*.waap.xyz https://auth.waap.xyz https://staging.waap.xyz https://*.silk.sc https://*.silkwallet.net https://*.silk-protector.com https://*.silk-protector-microservice-pe.com https://*.silk-protector-microservice-km.com https://*.evervault.com https://*.fly.dev",
  "frame-src 'self' https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://challenges.cloudflare.com https://*.human.tech https://human.tech https://accounts.google.com https://twitter.com https://x.com https://discord.com https://*.thirdweb.com https://thirdweb.com https://*.google.com https://appleid.apple.com https://silksecure.net https://*.silksecure.net https://waap.xyz https://*.waap.xyz https://auth.waap.xyz https://staging.waap.xyz https://*.silk.sc https://*.silkwallet.net https://*.evervault.com https://*.fly.dev https://staging.human-wallet.com",
  [
    "connect-src 'self'",
    'http://localhost:*',
    'https://localhost:*',
    'ws://localhost:*',
    'wss://localhost:*',
    // Privy
    'https://auth.privy.io',
    'wss://relay.walletconnect.com',
    'wss://relay.walletconnect.org',
    'wss://www.walletlink.org',
    'https://*.rpc.privy.systems',
    'https://explorer-api.walletconnect.com',
    // thirdweb
    'https://*.thirdweb.com',
    'https://thirdweb.com',
    'https://api.thirdweb.com',
    'https://embedded-wallet.thirdweb.com',
    'https://bundler.thirdweb.com',
    'https://pay.thirdweb.com',
    'wss://*.thirdweb.com',
    // human.tech WaaP / Silk infra (required — not under human.tech)
    'https://*.human.tech',
    'https://human.tech',
    'wss://*.human.tech',
    'https://silksecure.net',
    'https://*.silksecure.net',
    'https://waap.xyz',
    'https://*.waap.xyz',
    'https://auth.waap.xyz',
    'https://staging.waap.xyz',
    'https://staging.human-wallet.com',
    'https://*.silk.sc',
    'https://dashboard.silk.sc',
    'https://server.silkwallet.net',
    'https://*.silkwallet.net',
    'https://*.silk-protector.com',
    'https://main.silk-protector.com',
    'https://*.silk-protector-microservice-pe.com',
    'https://*.silk-protector-microservice-km.com',
    'https://lbr.silk-protector-microservice-pe.com',
    'https://lbr.silk-protector-microservice-km.com',
    'https://*.evervault.com',
    'https://*.fly.dev',
    'https://prod-waap-ws-relay.fly.dev',
    'https://staging-waap-ws-relay.fly.dev',
    'wss://prod-waap-ws-relay.fly.dev',
    'wss://staging-waap-ws-relay.fly.dev',
    'wss://*.fly.dev',
    'https://imagedelivery.net',
    // Celo + Mercado Pago
    'https://forno.celo.org',
    'https://*.celo.org',
    'https://api.mercadopago.com',
    'https://auth.mercadopago.com',
    'https://auth.mercadopago.com.mx',
    'https://www.mercadopago.com',
    'https://www.mercadopago.com.mx',
  ].join(' '),
  "worker-src 'self' blob:",
  "manifest-src 'self'",
]
  .join('; ')
  .replace(/\s{2,}/g, ' ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy,
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
