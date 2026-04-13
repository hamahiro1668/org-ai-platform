/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FFFFFF',
        elevated: '#FFFFFF',
        muted: '#FBFBFB',
        overlay: 'rgba(15, 23, 42, 0.24)',

        primary: '#181A1F',
        secondary: '#6D7178',
        'text-muted': '#A3A7AE',
        inverse: '#FFFFFF',

        accent: {
          DEFAULT: '#8FD8FF',
          hover: '#7C76F2',
          soft: '#F3F4FF',
          glow: 'rgba(143, 216, 255, 0.28)',
        },

        rainbow: {
          coral: '#FFFFFF',
          peach: '#F2F4F8',
          gold: '#ECEFF7',
          mint: '#E7EBFB',
          sky: '#DDE2FF',
          'fresh-blue': '#BFE7FF',
          rose: '#EEF1FF',
        },

        dept: {
          sales: '#8FD8FF',
          marketing: '#A6E3FF',
          accounting: '#BFE7FF',
          analytics: '#8D9DFF',
          general: '#8FD8FF',
          assistant: '#B8B4FF',
        },

        success: '#6BCB77',
        warning: '#F9C74F',
        danger: '#F07167',
        info: '#8ECAE6',

        glass: {
          'tint-thin': 'rgba(255, 255, 255, 0.55)',
          'tint-regular': 'rgba(255, 255, 255, 0.70)',
          'tint-thick': 'rgba(255, 255, 255, 0.82)',
          'tint-chrome': 'rgba(255, 255, 255, 0.92)',
          'border-soft': 'rgba(255, 255, 255, 0.60)',
          'border-bright': 'rgba(255, 255, 255, 0.92)',
          highlight: 'rgba(255, 255, 255, 0.45)',
        },
      },

      backgroundImage: {
        'rainbow-prism':
          'linear-gradient(135deg, #FFB5A7 0%, #FFD6A5 18%, #FDFFB6 35%, #CAFFBF 52%, #9BF6FF 70%, #8FD8FF 85%, #FFC6FF 100%)',
        'rainbow-prism-soft':
          'linear-gradient(135deg, rgba(255,181,167,0.35) 0%, rgba(255,214,165,0.35) 20%, rgba(253,255,182,0.35) 38%, rgba(202,255,191,0.35) 55%, rgba(155,246,255,0.35) 72%, rgba(189,178,255,0.35) 88%, rgba(255,198,255,0.35) 100%)',
      },

      backdropBlur: {
        thin: '8px',
        regular: '16px',
        thick: '24px',
        chrome: '32px',
      },

      boxShadow: {
        'elev-0': 'none',
        'elev-1': '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 4px rgba(15, 23, 42, 0.03)',
        'elev-2': '0 2px 8px rgba(15, 23, 42, 0.05), 0 4px 16px rgba(15, 23, 42, 0.035)',
        'elev-3': '0 8px 24px rgba(15, 23, 42, 0.06), 0 16px 40px rgba(15, 23, 42, 0.04)',
        'elev-4': '0 16px 44px rgba(15, 23, 42, 0.08), 0 28px 72px rgba(15, 23, 42, 0.05)',
        'glass-inset':
          'inset 0 1px 0 rgba(255, 255, 255, 0.78), inset 0 -1px 0 rgba(15, 23, 42, 0.03)',
        'glow-primary': '0 0 32px rgba(143, 216, 255, 0.24)',
        'glow-rainbow':
          '0 0 18px rgba(255,255,255,0.18), 0 0 34px rgba(191,231,255,0.14), 0 0 52px rgba(143,216,255,0.1)',
        'glow-sales': '0 0 30px rgba(139, 133, 255, 0.24)',
        'glow-marketing': '0 0 30px rgba(154, 149, 255, 0.24)',
        'glow-accounting': '0 0 30px rgba(176, 172, 255, 0.24)',
        'glow-analytics': '0 0 30px rgba(141, 157, 255, 0.24)',
        'glow-general': '0 0 30px rgba(139, 133, 255, 0.24)',
        'glow-assistant': '0 0 30px rgba(143, 216, 255, 0.24)',
      },

      borderRadius: {
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '20px',
        xl: '28px',
        '2xl': '36px',
      },

      fontFamily: {
        sans: ["'Noto Sans JP'", 'system-ui', 'sans-serif'],
        display: ["'Playfair Display'", 'serif'],
        mono: ["'JetBrains Mono'", 'ui-monospace', 'monospace'],
      },

      fontSize: {
        micro: ['10px', { lineHeight: '1.3' }],
        xs: ['11px', { lineHeight: '1.4' }],
        sm: ['13px', { lineHeight: '1.5' }],
        body: ['15px', { lineHeight: '1.6' }],
        h3: ['20px', { lineHeight: '1.4' }],
        h2: ['24px', { lineHeight: '1.3' }],
        h1: ['32px', { lineHeight: '1.2' }],
        display: ['48px', { lineHeight: '1.1' }],
      },

      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '400ms',
        dramatic: '700ms',
      },

      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
        emphasized: 'cubic-bezier(0.2, 0, 0, 1.2)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      keyframes: {
        'aurora-drift-1': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(40px, -30px) scale(1.08)' },
          '66%': { transform: 'translate(-20px, 40px) scale(0.95)' },
        },
        'aurora-drift-2': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-35px, 25px) scale(1.05)' },
          '66%': { transform: 'translate(30px, -20px) scale(0.92)' },
        },
        'aurora-drift-3': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(25px, 35px) scale(1.1)' },
        },
        'glass-shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 24px rgba(184, 180, 255, 0.32)' },
          '50%': { boxShadow: '0 0 44px rgba(207, 213, 255, 0.28)' },
        },
      },

      animation: {
        'aurora-1': 'aurora-drift-1 28s ease-in-out infinite',
        'aurora-2': 'aurora-drift-2 32s ease-in-out infinite',
        'aurora-3': 'aurora-drift-3 25s ease-in-out infinite',
        shimmer: 'glass-shimmer 3s linear infinite',
        float: 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
