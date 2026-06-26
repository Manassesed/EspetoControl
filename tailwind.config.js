/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          300: "#6EE7B7",
          500: "#10B981",
          600: "#059669",
          700: "#047857"
        },
        ink: "#0F172A",
        muted: "#64748B",
        line: "#E2E8F0",
        canvas: "#F8FAFC",
        danger: "#EF4444",
        warning: "#F59E0B"
      },
      fontFamily: {
        sans: ["Inter", "System"]
      }
    }
  },
  plugins: []
};
