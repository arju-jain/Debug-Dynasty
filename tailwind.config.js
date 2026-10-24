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
        dark: {
          bg: '#020817',
          surface: '#06152B',
          nav: '#031126',
          card: '#061B35',
          panel: '#082344',
          border: '#123F70',
          activeBorder: '#078BFF',
        },
        dynasty: {
          blue: '#087CFF',
          strongBlue: '#2563EB',
          cyan: '#22D3EE',
          brightCyan: '#00E5FF',
          teal: '#00D6B2',
          warning: '#FBBF24',
          error: '#FB5575',
          text: '#F1F7FF',
          mutedText: '#9DB6D5',
          subtleText: '#6F8BAF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px -3px rgba(34, 211, 238, 0.35)',
        'glow-blue': '0 0 20px -3px rgba(8, 124, 255, 0.4)',
        'glow-teal': '0 0 15px -3px rgba(0, 214, 178, 0.35)',
        'panel': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}
