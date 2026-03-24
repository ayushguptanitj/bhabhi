/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        apple: {
          blue: '#0071e3',
          blue2: '#0077ED',
          gray: {
            50: '#f5f5f7',
            100: '#e8e8ed',
            200: '#d2d2d7',
            300: '#adadb8',
            400: '#86868b',
            500: '#6e6e73',
            600: '#48484a',
            700: '#3a3a3c',
            800: '#2c2c2e',
            900: '#1c1c1e',
            950: '#111113',
          },
        },
      },
      backgroundImage: {
        'apple-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'hero-gradient': 'linear-gradient(180deg, #1d1d1f 0%, #000000 100%)',
      },
      boxShadow: {
        'apple': '0 2px 20px rgba(0,0,0,0.08)',
        'apple-lg': '0 8px 40px rgba(0,0,0,0.12)',
        'apple-xl': '0 20px 60px rgba(0,0,0,0.16)',
        'glass': '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        'apple': '18px',
        'apple-sm': '12px',
        'apple-xs': '8px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
