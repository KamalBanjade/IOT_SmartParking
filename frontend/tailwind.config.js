/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── New short names (used in all redesigned components) ──
        'base':     { DEFAULT: '#0a0a0f', light: '#f8f9fc' },
        'surface':  { DEFAULT: '#111118', light: '#ffffff' },
        'elevated': { DEFAULT: '#1a1a24', light: '#f1f3f9' },
        'border':   { DEFAULT: '#2a2a3a', light: '#e2e8f0' },
        'primary':  { DEFAULT: '#f0f0ff', light: '#0f0f1a' },
        'secondary':{ DEFAULT: '#9090b0', light: '#4a5568' },
        'muted':    { DEFAULT: '#505070', light: '#9ca3af' },
        'accent':   { DEFAULT: '#6366f1', hover: '#4f46e5' },

        // ── Status colors (never change) ──
        'available': '#22c55e',
        'occupied':  '#ef4444',
        'pending':   '#f59e0b',
        'abandoned': '#525270',

        // ── Role colors ──
        'admin':    '#a78bfa',
        'operator': '#38bdf8',
        'customer': '#34d399',

        // ── OLD names kept for backward compat (untouched components) ──
        'bg-base':            '#0a0a0f',
        'bg-surface':         '#111118',
        'bg-elevated':        '#1a1a24',
        'bg-border':          '#2a2a3a',
        'text-primary':       '#f0f0ff',
        'text-secondary':     '#9090b0',
        'text-muted':         '#505070',
        'status-available':   '#22c55e',
        'status-occupied':    '#ef4444',
        'status-pending':     '#f59e0b',
        'status-abandoned':   '#525270',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
