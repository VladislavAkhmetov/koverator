/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'soviet-lime': '#ccff00',
        'soviet-blue': '#3253EE',
        'soviet-black': '#0a0a0a',
        'soviet-dark': '#111111',
        'soviet-gray': '#222222',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Rubik Mono One"', 'sans-serif'],
      },
      backgroundImage: {
        'noise': "url('https://grainy-gradients.vercel.app/noise.svg')",
      }
    },
  },
  plugins: [],
}