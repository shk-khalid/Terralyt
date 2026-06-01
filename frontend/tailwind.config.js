/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        esg: {
          sage: '#ccd5ae',      // primary / approved
          moss: '#e9edc9',      // secondary accent / active border
          ivory: '#fefae0',     // page background / warm white
          clay: '#faedcd',      // card background / warm sand
          sand: '#d4a373',      // warnings / anomalies / orange-tan
          dark: '#1c2514',      // primary high contrast text
          text: '#2f3b25',      // body text
          muted: '#667554',     // secondary text
          border: '#d3d7be',    // border accent
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(47, 59, 37, 0.08)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
