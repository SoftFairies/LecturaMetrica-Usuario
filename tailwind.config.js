/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // LecturaMetrica brand colors
        brand: {
          gold: "#D4890A",
          "gold-light": "#F59E0B",
          "gold-dark": "#92610B",
        },
        dark: {
          900: "#0D1117",
          800: "#111827",
          750: "#141C27",
          700: "#1A2332",
          600: "#1E2A3A",
          500: "#243044",
          400: "#2E3D52",
          300: "#3A4D66",
        },
        accent: {
          green: "#22C55E",
          blue: "#3B82F6",
          red: "#EF4444",
          purple: "#8B5CF6",
          cyan: "#06B6D4",
          pink: "#EC4899",
        }
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #F59E0B 0%, #D4890A 100%)",
        "dark-gradient": "linear-gradient(180deg, #1A2332 0%, #0D1117 100%)",
      },
    },
  },
  plugins: [],
}
