/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          900: "#0B0F19",
          800: "#111827",
          700: "#1f2937",
          600: "#374151",
        },
        brand: {
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
        },
      },
      boxShadow: {
        glow: "0 0 12px rgba(59,130,246,0.5)",
        card: "0 6px 20px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};
