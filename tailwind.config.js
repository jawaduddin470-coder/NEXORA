/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          light: '#F4F8FF',
          dark: '#030712',
        },
        ice: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          light: '#F4F8FF',
          glow: '#EEF4FF',
          subtle: '#EAF0FF',
        },
        navy: {
          950: '#030712',
          900: '#0B1120',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#0F172A',
          subtle: {
            light: '#F1F5F9',
            dark: '#1E293B',
          },
        },
        brand: {
          purple: '#6D3DF5',
          violet: '#7C3AED',
          'violet-light': '#8B5CF6',
          indigo: '#4F46E5',
          cyan: '#06B6D4',
          glow: '#818CF8',
          emerald: '#10B981',
          rose: '#F43F5E',
          amber: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -2px rgba(15, 23, 42, 0.05)',
        'soft': '0 8px 30px -4px rgba(15, 23, 42, 0.08)',
        'soft-lg': '0 20px 40px -8px rgba(15, 23, 42, 0.12)',
        'glow-violet': '0 10px 35px -5px rgba(109, 61, 245, 0.25)',
        'glow-cyan': '0 10px 35px -5px rgba(6, 182, 212, 0.25)',
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
