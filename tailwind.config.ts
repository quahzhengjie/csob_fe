// =================================================================================
// FILE: tailwind.config.ts
// =================================================================================
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        'slide-in-right': {
          'from': {
            transform: 'translateX(100%)',
            opacity: '0',
          },
          'to': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        'scale-in': {
          'from': {
            transform: 'scale(0.95)',
            opacity: '0',
          },
          'to': {
            transform: 'scale(1)',
            opacity: '1',
          },
        },
        'fade-in': {
          'from': {
            opacity: '0',
          },
          'to': {
            opacity: '1',
          },
        },
        'slide-down': {
          'from': {
            transform: 'translateY(-100%)',
            opacity: '0',
          },
          'to': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
      },
    },
  },
  plugins: [],
  darkMode: 'class', // Enable class-based dark mode
};

export default config;