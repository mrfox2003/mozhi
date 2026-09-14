/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ground: '#0A0807',
        'surface-1': '#13100E',
        'surface-2': '#1A1410',
        'surface-3': '#271F17',
        'surface-elevated': '#3C3125',
        'text-primary': '#FBFBFC',
        'text-secondary': '#A89F91',
        'text-muted': '#73685C',
        accent: {
          primary: '#ED7002',
          'primary-hover': '#F97316',
          'primary-light': '#FF9138',
          cyan: '#38BDF8',
          green: '#10B981',
          amber: '#F59E0B',
          orange: '#ED7002',
        },
        'border-subtle': 'rgba(255, 255, 255, 0.08)',
        'border-warm': 'rgba(60, 49, 37, 0.7)',
        'border-focus': 'rgba(237, 112, 2, 0.6)',
      },
      fontFamily: {
        sans: ['"Google Sans"', '"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '22px',
      },
      boxShadow: {
        orange: '0 0 24px rgba(237, 112, 2, 0.35)',
        'orange-subtle': '0 0 16px rgba(237, 112, 2, 0.15)',
        'card-dark': '0 4px 24px rgba(0, 0, 0, 0.6)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '1' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin-slow 1s linear infinite',
      },
    },
  },
  plugins: [],
};
