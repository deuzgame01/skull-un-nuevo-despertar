import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        skull: {
          bg: '#F6F3EE',           // Lienzo cálido (Fondo principal)
          surface: '#FFFFFF',      // Blanco (Tarjetas y bloques secundarios)
          card: '#FFFFFF',         // Superficie editorial intermedia
          plum: '#F1ECE5',         // Plum claro (Superficie del estilo del logo)
          'plum-light': '#EDE7DE', // Plum claro hover / elevado
          border: '#E7DFD3',       // Hairline cálido 1px
          'border-strong': '#DCCFC0',
          alabaster: '#21162C',    // Texto principal tinta ciruela
          silver: '#4A3B58',       // Detalles y metal
          muted: '#6B6272',        // Texto secundario
          champagne: '#9A7B4F',    // Acento champán sobre fondo claro
          amethyst: '#5B2B84',     // Acento técnico discreto
          sage: '#3F8F6B',         // Indicador sutil de disponibilidad
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cormorant)', 'var(--font-cinzel)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      backgroundImage: {
        'skull-editorial': 'linear-gradient(180deg, #F6F3EE 0%, #FFFFFF 100%)',
        'skull-macro': 'radial-gradient(circle at center, #FFFFFF 0%, #F1ECE5 100%)',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
