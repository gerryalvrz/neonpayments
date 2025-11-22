# NeonPay MX - Next.js Migration Guide

## 📋 Project Overview

**NeonPay MX** is a MiniApp mock for MiniPay that demonstrates the full UX flow connecting:

- Mercado Pago (fiat rails) → Mock OAuth integration
- Privy (embedded wallets) → Mock authentication
- Self Protocol (humanity verification) → Mock verification flow
- Squid Router (cross-chain swaps) → Mock swap quotes
- Celo blockchain → Mock wallet operations

### Current Stack
- **Framework**: Vite + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Routing**: State-based (currentStep in context)
- **Icons**: react-icons
- **Animations**: GSAP (for CardNav)

### Target Stack (Next.js)
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (same)
- **State Management**: React Context API (same)
- **Routing**: URL-based (Next.js App Router)
- **Icons**: react-icons (same)
- **Animations**: GSAP (same)

---

## 🏗️ Current Architecture

### Project Structure

```
src/
├── components/
│   ├── Auth/
│   │   └── AuthScreen.tsx          # Privy authentication (email/phone)
│   ├── CardNav/
│   │   └── CardNav.tsx             # Animated navigation menu (GSAP)
│   ├── Home/
│   │   └── HomeScreen.tsx          # Main dashboard with actions
│   ├── Icons/
│   │   ├── Icon.tsx                # Icon wrapper component
│   │   ├── IconSet.tsx             # Pre-configured icons
│   │   └── index.ts
│   ├── Layout/
│   │   ├── BackButton.tsx          # Navigation back button
│   │   ├── Container.tsx           # Page container wrapper
│   │   └── Header.tsx              # User header with wallet info
│   ├── MercadoPago/
│   │   └── ConnectMercadoPago.tsx  # MP OAuth connection flow
│   ├── Self/
│   │   └── VerifySelf.tsx          # Self Protocol verification
│   ├── Send/
│   │   └── SendScreen.tsx          # Send/payment flow
│   ├── TopUp/
│   │   └── TopUpScreen.tsx         # Top-up flow (MXN → USDC)
│   └── UI/
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Loading.tsx             # Spinner, Skeleton, Progress
│       └── index.ts
├── context/
│   └── AppContext.tsx              # Global state management
├── types/
│   └── index.ts                    # TypeScript definitions
├── utils/
│   └── cn.ts                       # className utility (clsx + tailwind-merge)
├── App.tsx                         # Main app component (state-based routing)
├── main.tsx                        # Vite entry point
└── index.css                       # Global styles + Tailwind
```

---

## 🎨 Design System

### Color Palette

**Primary Colors:**
- **Acid Lemon**: `#CCFF00` - Primary accent, borders, highlights
- **Acid Lemon Light**: `#E5FF66` - Hover states
- **Acid Lemon Dark**: `#B3E600` - Active states
- **Yellow Border**: `#FFEB3B` - Navbar outline
- **Yellow Green**: `#9ACD32` - Gradient accents

**Semantic Colors:**
- Success: `#10B981`
- Error: `#EF4444`
- Warning: `#F59E0B`
- Info: `#3B82F6`

**Neutral Grays:** Full scale from 50-900

### Typography
- **Primary Font**: Inter (300, 400, 500, 600, 700)
- **Monospace**: JetBrains Mono (400, 500, 600)
- **Type Scale**: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl

### Glassmorphism Effects

**Card Style:**

```css
background: rgba(255, 255, 255, 0.9);
backdrop-filter: blur(20px) saturate(180%);
border: 2px solid #CCFF00;
box-shadow: 0 8px 32px 0 rgba(204, 255, 0, 0.1);
```

**Navbar Style:**

```css
background: rgba(204, 255, 0, 0.2);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid #FFEB3B;
```

### Tailwind Config

See `tailwind.config.js` for complete configuration including:
- Custom colors (acid, neon, glass, semantic)
- Custom fonts
- Custom spacing
- Custom shadows (acid, neon, glass)
- Custom animations (pulse-neon, glow, fade-in, slide-up/down)

---

## 🔄 State Management

### AppContext Structure

**State:**
- `user`: User | null
- `mercadoPago`: MercadoPagoAccount
- `walletBalance`: WalletBalance (cUSD, USDC, cREAL)
- `selfVerification`: SelfVerification
- `currentStep`: FlowStep (state-based routing)
- `language`: 'en' | 'es'

**Actions:**
- `setUser`, `setMercadoPago`, `setWalletBalance`
- `setSelfVerification`, `setCurrentStep`, `setLanguage`

### Type Definitions

```typescript
interface User {
  id: string;
  email?: string;
  phone?: string;
  walletAddress?: string;
  isVerified: boolean;
  selfVerified?: boolean;
}

interface MercadoPagoAccount {
  connected: boolean;
  balance: number; // MXN
  accountId?: string;
}

interface WalletBalance {
  cUSD: number;
  USDC: number;
  cREAL: number;
}

interface SwapQuote {
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  route: string[];
  estimatedTime: string;
}

interface SelfVerification {
  verified: boolean;
  age?: number;
  country?: string;
  sanctionsCheck?: boolean;
  humanityCheck?: boolean;
  proof?: string;
}

type FlowStep = 
  | 'home'
  | 'auth'
  | 'connect-mercado'
  | 'topup'
  | 'swap'
  | 'verify-self'
  | 'send'
  | 'payment';

type Language = 'en' | 'es';
```

---

## 🧩 Component Details

### Core UI Components

**Button** (`components/UI/Button.tsx`)
- Variants: primary, secondary, ghost, danger
- Sizes: sm, md, lg
- Props: loading, fullWidth, disabled
- Glassmorphism styling with acid lemon theme

**Card** (`components/UI/Card.tsx`)
- Variants: default, elevated, interactive
- Padding: none, sm, md, lg
- Glassmorphism with hover effects

**Input** (`components/UI/Input.tsx`)
- Props: label, error, helperText, success, leadingIcon, trailingIcon
- Glassmorphism styling
- Full accessibility support

**Badge** (`components/UI/Badge.tsx`)
- Variants: default, success, error, warning, info, neon
- Sizes: sm, md, lg

**Loading** (`components/UI/Loading.tsx`)
- Spinner component
- Skeleton component (single/multi-line)
- Progress component

### Screen Components

**HomeScreen** (`components/Home/HomeScreen.tsx`)
- Main dashboard
- Conditional rendering based on user state
- Actions: Connect Wallet, Connect Mercado Pago, Add Funds, Send/Pay, Verify Identity
- Bilingual support (EN/ES)

**AuthScreen** (`components/Auth/AuthScreen.tsx`)
- Email or phone authentication (mock Privy)
- Form validation
- Mock wallet creation
- Creates user with wallet address

**ConnectMercadoPago** (`components/MercadoPago/ConnectMercadoPago.tsx`)
- Mock OAuth flow
- Simulates account connection
- Sets mercadoPago balance (5000 MXN mock)

**TopUpScreen** (`components/TopUp/TopUpScreen.tsx`)
- Multi-step flow: input → review → processing → success
- MXN amount input
- Mock Squid Router quote
- Transaction review
- Updates wallet balance

**SendScreen** (`components/Send/SendScreen.tsx`)
- Multi-step flow: method → address/qr → amount → confirm → success
- Token selection (cUSD, USDC, cREAL)
- Address or QR code input
- Transaction confirmation

**VerifySelf** (`components/Self/VerifySelf.tsx`)
- Multi-step flow: intro → verifying → success
- Mock Self Protocol verification
- Age, country, sanctions check
- Sets verification status

### Layout Components

**Container** (`components/Layout/Container.tsx`)
- Responsive container with max-width options
- Padding: sm, md, lg, xl, full

**Header** (`components/Layout/Header.tsx`)
- User info display
- Wallet address with copy functionality
- Language toggle
- Token balance display

**BackButton** (`components/Layout/BackButton.tsx`)
- Navigation back button
- Uses setCurrentStep from context
- Bilingual labels

**CardNav** (`components/CardNav/CardNav.tsx`)
- Animated navigation menu using GSAP
- Hamburger menu
- Expandable cards
- Connect Wallet button
- Logo display

### Icon System

**Icon** (`components/Icons/Icon.tsx`)
- Wrapper for react-icons
- Sizes: xs, sm, md, lg, xl, number
- Colors: neon, gray, white, current, error, success, warning, info

**IconSet** (`components/Icons/IconSet.tsx`)
- Pre-configured icons: CreditCardIcon, WalletIcon, SendIcon, CheckCircleIcon, MapMarkerIcon, QRIcon, ArrowRightIcon, ChevronLeftIcon, CopyIcon, CheckIcon, SpinnerIcon, ExclamationCircleIcon, UserIcon, LanguageIcon

---

## 🔄 Routing Conversion Strategy

### Current (State-Based)

```typescript
// Uses currentStep state in AppContext
switch (currentStep) {
  case 'auth': return <AuthScreen />;
  case 'connect-mercado': return <ConnectMercadoPago />;
  case 'topup': return <TopUpScreen />;
  case 'verify-self': return <VerifySelf />;
  case 'send': return <SendScreen />;
  case 'home': default: return <HomeScreen />;
}
```

### Target (Next.js App Router)

```
app/
├── layout.tsx                 # Root layout with AppProvider and CardNav
├── page.tsx                   # HomeScreen (/) 
├── auth/
│   └── page.tsx               # AuthScreen (/auth)
├── connect-mercado/
│   └── page.tsx               # ConnectMercadoPago (/connect-mercado)
├── topup/
│   └── page.tsx               # TopUpScreen (/topup)
├── verify-self/
│   └── page.tsx               # VerifySelf (/verify-self)
└── send/
    └── page.tsx               # SendScreen (/send)
```

### Navigation Changes

**Replace `setCurrentStep()` with Next.js router:**

```typescript
// OLD
import { useApp } from '@/context/AppContext';
const { setCurrentStep } = useApp();
setCurrentStep('auth');

// NEW
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/auth');
```

**BackButton Component:**

```typescript
// Update to use router.back() or router.push()
import { useRouter } from 'next/navigation';
const router = useRouter();
router.back(); // or router.push('/');
```

---

## 📦 Dependencies

### Required Dependencies

```json
{
  "dependencies": {
    "clsx": "^2.1.1",
    "gsap": "^3.13.0",
    "next": "^14.0.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-icons": "^5.5.0",
    "tailwind-merge": "^3.4.0"
  },
  "devDependencies": {
    "@types/node": "^24.10.1",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "autoprefixer": "^10.4.22",
    "eslint": "^9.39.1",
    "eslint-config-next": "^14.0.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.18",
    "typescript": "~5.9.3"
  }
}
```

---

## 🚀 Migration Steps

### Step 1: Create Next.js Project

```bash
npx create-next-app@latest neo-payments-nextjs --typescript --tailwind --app --no-src-dir
cd neo-payments-nextjs
```

### Step 2: Install Dependencies

```bash
npm install clsx gsap react-icons tailwind-merge
npm install -D @types/node @types/react @types/react-dom
```

### Step 3: Configure Tailwind CSS

- Copy `tailwind.config.js` from current project
- Update content paths to include `app/**/*.{js,ts,jsx,tsx}`
- Copy `postcss.config.js`

### Step 4: Setup Global Styles

- Create `app/globals.css` with content from `src/index.css`
- Update font imports
- Ensure Tailwind directives are included

### Step 5: Create Folder Structure

```
app/
├── layout.tsx
├── page.tsx
├── auth/page.tsx
├── connect-mercado/page.tsx
├── topup/page.tsx
├── verify-self/page.tsx
└── send/page.tsx

components/          # Same structure as current
context/
types/
utils/
```

### Step 6: Migrate Context

- Copy `context/AppContext.tsx` as-is
- Remove `currentStep` state (routing handled by Next.js)
- Keep all other state management

### Step 7: Migrate Components

- Copy all components from `src/components/` to `components/`
- Update imports (remove `../../` relative paths, use `@/` alias)
- Update screen components to use `useRouter()` instead of `setCurrentStep()`

### Step 8: Create Root Layout

```typescript
// app/layout.tsx
import { AppProvider } from '@/context/AppContext';
import CardNav from '@/components/CardNav/CardNav';
import logo from '@/assets/react.svg';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const navItems = [/* ... */];
  
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <CardNav logo={logo} items={navItems} />
          <main id="main-content" className="pt-24 md:pt-28">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
```

### Step 9: Create Route Pages

```typescript
// app/page.tsx (Home)
import { HomeScreen } from '@/components/Home/HomeScreen';

export default function Home() {
  return <HomeScreen />;
}

// app/auth/page.tsx
import { AuthScreen } from '@/components/Auth/AuthScreen';

export default function Auth() {
  return <AuthScreen />;
}

// Repeat for other routes...
```

### Step 10: Update Navigation

- Replace all `setCurrentStep()` calls with `router.push()`
- Update `BackButton` to use `router.back()`
- Update `CardNav` connect wallet handler

### Step 11: Configure TypeScript

- Create `tsconfig.json` with Next.js settings
- Add path alias: `"@/*": ["./*"]`
- Update `next.config.js` if needed

### Step 12: Test & Polish

- Test all routes
- Verify state persistence
- Check responsive design
- Test bilingual switching
- Verify all animations (GSAP)

---

## 📝 Key Code Conversions

### Navigation Example

```typescript
// OLD - State-based
const { setCurrentStep } = useApp();
<Button onClick={() => setCurrentStep('auth')}>Connect</Button>

// NEW - URL-based
import { useRouter } from 'next/navigation';
const router = useRouter();
<Button onClick={() => router.push('/auth')}>Connect</Button>
```

### BackButton Example

```typescript
// OLD
const { setCurrentStep } = useApp();
const handleClick = () => setCurrentStep('home');

// NEW
import { useRouter } from 'next/navigation';
const router = useRouter();
const handleClick = () => router.back(); // or router.push('/');
```

### Conditional Rendering

```typescript
// OLD - In App.tsx
function AppContent() {
  const { currentStep } = useApp();
  switch (currentStep) {
    case 'auth': return <AuthScreen />;
    // ...
  }
}

// NEW - In Next.js routes
// Each route is a separate page file
// No need for switch statement
```

---

## 🎯 Features to Preserve

### ✅ Must Have

- [ ] Glassmorphism design system
- [ ] Acid lemon color scheme
- [ ] Bilingual support (EN/ES)
- [ ] All screen components
- [ ] State management (Context API)
- [ ] Mock integrations (Privy, Mercado Pago, Squid, Self)
- [ ] Responsive design
- [ ] GSAP animations (CardNav)
- [ ] Icon system
- [ ] UI components (Button, Card, Input, Badge, Loading)
- [ ] Accessibility features

### 🔄 Changes Needed

- [ ] Convert state-based routing to URL-based
- [ ] Update navigation calls
- [ ] Move entry point from `main.tsx` to Next.js structure
- [ ] Update import paths
- [ ] Remove `currentStep` from AppContext (or keep for legacy compatibility)

---

## 🐛 Potential Issues & Solutions

### Issue 1: GSAP in Next.js

**Solution:** Use dynamic import with `ssr: false`

```typescript
import dynamic from 'next/dynamic';
const CardNav = dynamic(() => import('@/components/CardNav/CardNav'), { ssr: false });
```

### Issue 2: Client Components

**Solution:** Add `'use client'` directive to components using hooks

```typescript
'use client';
import { useApp } from '@/context/AppContext';
```

### Issue 3: State Persistence

**Solution:** Consider using cookies or localStorage for user state if needed across page reloads

### Issue 4: Image Assets

**Solution:** Use Next.js Image component or move to `public/` folder

---

## 📋 Checklist

- [ ] Create Next.js project
- [ ] Install dependencies
- [ ] Configure Tailwind
- [ ] Setup global styles
- [ ] Create folder structure
- [ ] Migrate context (remove currentStep)
- [ ] Migrate all components
- [ ] Create root layout with AppProvider
- [ ] Create route pages
- [ ] Update navigation (router.push)
- [ ] Update BackButton
- [ ] Configure TypeScript paths
- [ ] Test all routes
- [ ] Test state management
- [ ] Test bilingual support
- [ ] Test responsive design
- [ ] Test animations
- [ ] Verify accessibility
- [ ] Update README

---

## 🎨 Design System Reference

See `DESIGN_SYSTEM.md` for complete design specifications including:
- Color palette
- Typography scale
- Spacing system
- Border radius
- Glassmorphism effects
- Shadows
- Animations
- Component patterns

---

## 📚 Additional Resources

- Next.js App Router Docs: https://nextjs.org/docs/app
- Next.js Migration Guide: https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration
- Tailwind CSS: https://tailwindcss.com/docs
- GSAP: https://greensock.com/docs/

---

## 🚦 Ready to Migrate

This document contains everything needed to recreate the NeonPay MX application in Next.js. Follow the migration steps sequentially, and refer to the component details and code examples for guidance.

**Good luck with your migration!** 🚀


