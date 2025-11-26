import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        wood: {
          lightest: '#f5e6d3',
          lighter: '#e8d4b8',
          light: '#d4c4a8',
          DEFAULT: '#c9a882',
          dark: '#8b6f47',
          darker: '#6b5438',
          darkest: '#4a3a26',
        },
      },
      backgroundImage: {
        'wood-pattern': `
          linear-gradient(90deg, #d4c4a8 0%, #c9a882 25%, #d4c4a8 50%, #c9a882 75%, #d4c4a8 100%),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(139, 111, 71, 0.1) 2px,
            rgba(139, 111, 71, 0.1) 4px
          )
        `,
      },
      boxShadow: {
        'wood-sm': '0 2px 4px rgba(74, 58, 38, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'wood-md': '0 4px 8px rgba(74, 58, 38, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'wood-lg': '0 8px 16px rgba(74, 58, 38, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(-20px) translateX(10px)' },
        },
        'float-delayed': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(-15px) translateX(-10px)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.4' },
        },
        grow: {
          '0%': { height: '0%' },
          '100%': { height: '100%' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out',
        slideUp: 'slideUp 0.4s ease-out',
        slideDown: 'slideDown 0.3s ease-out',
        float: 'float 6s ease-in-out infinite',
        'float-delayed': 'float-delayed 8s ease-in-out infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
        'bounce-slow': 'bounce-slow 2s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
        grow: 'grow 0.5s ease-out',
      },
    },
  },
  plugins: [],
}
export default config





