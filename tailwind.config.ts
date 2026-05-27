import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#fff9f3',
        text: '#1f2937',
        primary: '#7c3aed',
        accent: '#22c55e',
        card: '#ffffff',
      },
      spacing: {
        18: '4.5rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
