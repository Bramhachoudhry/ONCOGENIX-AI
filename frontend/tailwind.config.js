/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dark: {
          950: "#030712",
          900: "#070b14",
          850: "#0b1120",
          800: "#0f172a",
          700: "#1e293b",
          600: "#334155"
        },
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
          glow: "#00f2fe"
        },
        electric: {
          500: "#00c6ff",
          600: "#0284c7"
        },
        violet: {
          500: "#8b5cf6",
          600: "#7c3aed"
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"]
      },
      boxShadow: {
        "cyan-glow": "0 0 25px -5px rgba(0, 242, 254, 0.35)",
        "violet-glow": "0 0 25px -5px rgba(139, 92, 246, 0.35)",
        "card-glow": "0 8px 32px 0 rgba(0, 198, 255, 0.08)"
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      }
    },
  },
  plugins: [],
}
