/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "Cairo",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: ["Inter", "Cairo", "sans-serif"],
      },
      colors: {
        ink: {
          900: "#05060a",
          800: "#0a0c12",
          700: "#10131b",
          600: "#171b27",
          500: "#1f2433",
          400: "#2a3040",
        },
        accent: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
        },
        cine: {
          gold: "#f5c16c",
          purple: "#8b5cf6",
          cyan: "#22d3ee",
          pink: "#ec4899",
        },
      },
      backgroundImage: {
        "cine-radial":
          "radial-gradient(1200px 600px at 10% 10%, rgba(139,92,246,0.25), transparent 60%), radial-gradient(1000px 600px at 90% 20%, rgba(34,211,238,0.18), transparent 60%), radial-gradient(1200px 800px at 50% 100%, rgba(244,63,94,0.18), transparent 60%)",
        "cine-grid":
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 10px 40px -10px rgba(139,92,246,0.35), 0 10px 40px -20px rgba(34,211,238,0.35)",
        card: "0 10px 30px -10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        shimmer: "shimmer 2.4s linear infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        aurora: "aurora 22s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-600px 0" },
          "100%": { backgroundPosition: "600px 0" },
        },
        aurora: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(-3%, 2%, 0) scale(1.05)" },
        },
      },
    },
  },
  plugins: [],
};
