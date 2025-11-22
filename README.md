# NeonPay MX - Next.js

A MiniApp mock for MiniPay that demonstrates the full UX flow connecting:
- Mercado Pago (fiat rails and ramps) → Mock OAuth integration
- Privy (embedded wallets) → Mock authentication
- Self Protocol (humanity verification) → Mock verification flow
- Squid Router (cross-chain swaps) → Mock swap quotes
- Celo blockchain → Mock wallet operations

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Icons**: react-icons
- **Animations**: GSAP

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
app/
├── layout.tsx                 # Root layout with AppProvider and CardNav
├── page.tsx                   # HomeScreen (/) 
├── auth/page.tsx              # AuthScreen (/auth)
├── connect-mercado/page.tsx   # ConnectMercadoPago (/connect-mercado)
├── topup/page.tsx             # TopUpScreen (/topup)
├── verify-self/page.tsx       # VerifySelf (/verify-self)
└── send/page.tsx              # SendScreen (/send)

components/
├── Auth/
├── CardNav/
├── Home/
├── Icons/
├── Layout/
├── MercadoPago/
├── Self/
├── Send/
├── TopUp/
└── UI/

context/
└── AppContext.tsx

types/
└── index.ts

utils/
└── cn.ts
```

## Features

- ✅ Glassmorphism design system
- ✅ Acid lemon color scheme
- ✅ Bilingual support (EN/ES)
- ✅ All screen components
- ✅ State management (Context API)
- ✅ Mock integrations (Privy, Mercado Pago, Squid, Self)
- ✅ Responsive design
- ✅ GSAP animations (CardNav)
- ✅ Icon system
- ✅ UI components (Button, Card, Input, Badge, Loading)
- ✅ Accessibility features

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [GSAP](https://greensock.com/docs/)


