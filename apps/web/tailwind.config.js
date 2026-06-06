/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#090B0A',
        'background-secondary': '#101512',
        'background-tertiary': '#18201C',
        card: '#151A17',
        panel: '#F2EAD8',
        ink: '#101512',
        cream: '#F7F0E0',
        graphite: '#242A27',
        border: '#2D3932',
        'border-light': '#4C5C52',
        signal: '#C7F000',
        aqua: '#30D5C8',
        ember: '#FF5A45',
      },
      fontFamily: {
        sans: ['Avenir Next', 'Bahnschrift', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
