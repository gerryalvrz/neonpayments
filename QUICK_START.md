# Quick Start Guide

## Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `app/` - Next.js App Router pages and layout
- `components/` - React components organized by feature
- `context/` - React Context for global state
- `types/` - TypeScript type definitions
- `utils/` - Utility functions

## Key Features

✅ **Routing**: URL-based routing with Next.js App Router
✅ **State Management**: React Context API (no currentStep, uses router)
✅ **Design System**: Glassmorphism with acid lemon theme
✅ **Bilingual**: English/Spanish support
✅ **Animations**: GSAP for CardNav (dynamically imported for SSR)

## Navigation

All navigation uses Next.js router:
- `router.push('/path')` instead of `setCurrentStep('step')`
- `router.back()` for back navigation
- All routes are in `app/` directory

## Next Steps

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Test all routes and features
4. Customize as needed

For detailed migration information, see `NEXTJS_MIGRATION_GUIDE.md`.


