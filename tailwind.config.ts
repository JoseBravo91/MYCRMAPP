import type { Config } from 'tailwindcss';

// Los colores de marca salen de variables CSS que el administrador define en
// Configuración → Apariencia. Cada color trae variantes calculadas con contraste garantizado.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: token('brand'),
          dark: token('brand-dark'),
          light: token('brand-light'),
          fg: token('brand-fg'),
          ink: token('brand-ink'),
        },
        accent: {
          DEFAULT: token('accent'),
          dark: token('accent-dark'),
          light: token('accent-light'),
          fg: token('accent-fg'),
          ink: token('accent-ink'),
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        pop: '0 10px 30px -10px rgb(15 23 42 / 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
