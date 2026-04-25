/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0a0a0a',
        'bg-surface': '#111111',
        'bg-elevated': '#1a1a1a',
        'bg-border': '#222222',
        'text-primary': '#f5f5f5',
        'text-secondary': '#a3a3a3',
        'text-muted': '#525252',
        'accent': '#3b82f6',
        'status-available': '#22c55e',
        'status-occupied': '#ef4444',
        'status-pending': '#f59e0b',
        'status-abandoned': '#525252',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
