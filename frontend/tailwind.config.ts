import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFFFFF',
        paper: '#FFFFFF',
        surface: '#F8F9FA',
        ink: '#111111',
        ink2: '#333333',
        muted: '#888888',
        border: '#E5E5E5',
        green: { DEFAULT: '#00A335', light: '#00C040', dark: '#007A28', pale: '#E8F5E9' },
        gold: { DEFAULT: '#E6A817', pale: '#FFF8E1' },
        red: { DEFAULT: '#D32F2F', pale: '#FFEBEE' },
        blue: { DEFAULT: '#1565C0', light: '#1E88E5', pale: '#E3F2FD' },
        accent: '#0066CC',
      },
      fontFamily: {
        display: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
        body: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        hover: '0 4px 12px rgba(0,0,0,0.1)',
        modal: '0 20px 60px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
} satisfies Config;
