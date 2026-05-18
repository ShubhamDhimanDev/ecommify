/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        'card': '20px',
        'pill': '50px',
      },
      colors: {
        primary: '#1D4ED8',
        secondary: '#6B7280',
        foreground: '#111827',
        surface: '#F9FAFB',
        'surface-container': '#E5E7EB',
        'on-primary': '#FFFFFF',
        'outline-variant': '#D1D5DB',
      },
      boxShadow: {
        'card-shadow': '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};