/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        acid: {
          lemon: '#CCFF00',
          'lemon-light': '#E5FF66',
          'lemon-dark': '#B3E600',
          'lemon-50': 'rgba(204, 255, 0, 0.05)',
          'lemon-100': 'rgba(204, 255, 0, 0.1)',
          'lemon-200': 'rgba(204, 255, 0, 0.2)',
          'lemon-300': 'rgba(204, 255, 0, 0.3)',
        },
        yellow: {
          border: '#FFEB3B',
          green: '#9ACD32',
        },
        neon: {
          green: '#39FF14',
          cyan: '#00FFFF',
          pink: '#FF10F0',
        },
        glass: {
          white: 'rgba(255, 255, 255, 0.85)',
          'white-elevated': 'rgba(255, 255, 255, 0.9)',
          acid: 'rgba(204, 255, 0, 0.15)',
        },
        semantic: {
          success: '#10B981',
          'success-light': 'rgba(16, 185, 129, 0.1)',
          error: '#EF4444',
          'error-light': 'rgba(239, 68, 68, 0.1)',
          warning: '#F59E0B',
          'warning-light': 'rgba(245, 158, 11, 0.1)',
          info: '#3B82F6',
          'info-light': 'rgba(59, 130, 246, 0.1)',
        },
        gray: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'display': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-sm': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      boxShadow: {
        'acid': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 8px 24px 0 rgba(204, 255, 0, 0.08)',
        'acid-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 12px 32px -4px rgba(204, 255, 0, 0.12)',
        'acid-xl': '0 8px 16px -4px rgba(0, 0, 0, 0.05), 0 20px 40px -8px rgba(204, 255, 0, 0.15)',
        'neon': '0 0 20px rgba(204, 255, 0, 0.4), 0 0 40px rgba(204, 255, 0, 0.2)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'inner-acid': 'inset 0 0 0 1px rgba(255, 255, 255, 0.5)',
        'elevation-1': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'elevation-2': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'elevation-3': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'elevation-4': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      backdropBlur: {
        xs: '2px',
        '4xl': '72px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-in-slow': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'bounce-subtle': 'bounce-subtle 0.6s ease-out',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'glow': {
          '0%': { boxShadow: '0 0 5px rgba(204, 255, 0, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(204, 255, 0, 0.6), 0 0 30px rgba(204, 255, 0, 0.3)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
}


