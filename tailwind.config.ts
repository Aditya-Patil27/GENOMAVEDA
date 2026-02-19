import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          900: "#0A0F1E",
          800: "#0E1429",
          700: "#131B35",
          600: "#1A2340",
        },
        teal: {
          400: "#00E5CC",
          500: "#00C896",
          600: "#00A87D",
        },
        crimson: {
          400: "#FF4D6E",
          500: "#FF2D55",
          600: "#E0183F",
        },
        amber: {
          400: "#FFD000",
          500: "#FFB800",
          600: "#E5A500",
        },
        jade: {
          400: "#00E5A0",
          500: "#00C896",
          600: "#00A87D",
        },
        offwhite: "#E8EFF7",
        muted: "#8B95A8",
      },
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "slide-up": "slideUp 0.6s ease-out",
        "fade-in": "fadeIn 0.5s ease-out",
        "cascade": "cascade 0.5s ease-out",
      },
      keyframes: {
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 229, 204, 0.15)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 229, 204, 0.3)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        cascade: {
          "0%": { transform: "translateY(30px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
