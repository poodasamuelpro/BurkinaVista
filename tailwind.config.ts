/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx}',
  ],
  // Dark mode via attribut data-theme
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Couleurs du drapeau Burkina Faso
        faso: {
          red: '#EF2B2D',
          green: '#009A00',
          gold: '#EFC031',
          'red-dark': '#C41E20',
          'green-dark': '#007A00',
          'gold-dark': '#C9A025',
          'red-light': '#FF4D4F',
          'green-light': '#52C41A',
          cream: '#FDF6E3',
          earth: '#8B4513',
          sand: '#F4D03F',
          night: '#0D0905',
          dusk: '#1A1410',
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-down': 'slideDown 0.4s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'shimmer': 'shimmer 1.5s infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'glow-red': 'glowRed 2s ease-in-out infinite',
        'glow-green': 'glowGreen 2s ease-in-out infinite',
        'gradient': 'gradientShift 4s ease infinite',
        'bounce-in': 'bounceIn 0.6s ease-out forwards',
        'slide-left': 'slideInLeft 0.5s ease-out forwards',
        'slide-right': 'slideInRight 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 192, 49, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(239, 192, 49, 0)' },
        },
        glowRed: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(239,43,45,0.3)' },
          '50%': { boxShadow: '0 0 24px rgba(239,43,45,0.7)' },
        },
        glowGreen: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0,154,0,0.3)' },
          '50%': { boxShadow: '0 0 24px rgba(0,154,0,0.7)' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      backgroundImage: {
        'faso-gradient': 'linear-gradient(135deg, #EF2B2D 0%, #EFC031 50%, #009A00 100%)',
        'faso-gradient-v': 'linear-gradient(180deg, #EF2B2D 33%, #EFC031 33%, #EFC031 66%, #009A00 66%)',
        'hero-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23EFC031' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'faso': '0 4px 24px rgba(239, 43, 45, 0.15)',
        'faso-gold': '0 4px 24px rgba(239, 192, 49, 0.25)',
        'faso-green': '0 4px 24px rgba(0, 154, 0, 0.15)',
        'card': '0 2px 8px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.12), 0 16px 48px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
}
