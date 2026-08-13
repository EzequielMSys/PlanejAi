/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: '#22C55E',
        accent: '#F59E0B',
        danger: '#EF4444',
        warning: '#F59E0B',
        success: '#22C55E',
        bgBase: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        cardBorder: 'rgb(var(--color-border) / <alpha-value>)',
        textBase: 'rgb(var(--color-text) / <alpha-value>)',
        textMuted: 'rgb(var(--color-muted) / <alpha-value>)',
        brandLight: '#9394CF',
        brandMid: '#7778BD',
        brandDark: '#4B4C9D'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'bounce-slow': 'bounce 2s infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'float-fast': 'float 4s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'gradient-x': 'gradientX 6s ease infinite',
        'spin-slow': 'spin 12s linear infinite',
        'spin-slower': 'spin 20s linear infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'shine': 'shine 3.5s ease-in-out infinite',
        'blink-caret': 'blinkCaret 1s step-end infinite',
        'wiggle': 'wiggle 2.5s ease-in-out infinite',
        'particle': 'particle 12s linear infinite',
        'bounce-glow': 'bounceGlow 2s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-20px) translateX(10px)' }
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        gradientX: {
          '0%, 100%': { backgroundSize: '200% 200%', backgroundPosition: '0% 50%' },
          '50%': { backgroundSize: '200% 200%', backgroundPosition: '100% 50%' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(147,148,207,0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(75,76,157,0.7)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' }
        },
        shine: {
          '0%': { transform: 'translateX(-150%) skewX(-20deg)' },
          '60%, 100%': { transform: 'translateX(250%) skewX(-20deg)' }
        },
        blinkCaret: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' }
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' }
        },
        particle: {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '10%': { opacity: '0.8' },
          '90%': { opacity: '0.4' },
          '100%': { transform: 'translateY(-40vh) translateX(20px)', opacity: '0' }
        },
        bounceGlow: {
          '0%, 100%': { transform: 'translateY(0)', textShadow: '0 0 20px rgba(147,148,207,0.5)' },
          '50%': { transform: 'translateY(-8px)', textShadow: '0 0 40px rgba(147,148,207,0.9)' }
        }
      }
    },
  },
  plugins: [],
}
