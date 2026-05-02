import type { Config } from "tailwindcss";

const rgbVar = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

const preset = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: rgbVar("bg"),
          deep: rgbVar("bg-deep"),
          dark: rgbVar("bg-dark"),
        },
        surface: {
          DEFAULT: rgbVar("surface"),
          soft: rgbVar("surface-soft"),
          dim: rgbVar("surface-dim"),
        },
        accent: {
          violet: rgbVar("accent-violet"),
          pink: rgbVar("accent-pink"),
          green: rgbVar("accent-green"),
          yellow: rgbVar("accent-yellow"),
          mint: rgbVar("accent-mint"),
        },
        ink: {
          DEFAULT: rgbVar("ink"),
          soft: rgbVar("ink-soft"),
          dim: rgbVar("ink-dim"),
        },
      },
      borderRadius: {
        neu: "16px",
        "neu-lg": "24px",
        "neu-xl": "32px",
      },
      boxShadow: {
        "neu-out": "var(--shadow-neu-out)",
        "neu-soft": "var(--shadow-neu-soft)",
        "neu-in": "var(--shadow-neu-in)",
        "neu-purple":
          "10px 10px 24px rgba(40,30,110,0.45), -8px -8px 20px rgba(140,120,240,0.18)",
        "neu-purple-in":
          "inset 6px 6px 14px rgba(40,30,110,0.55), inset -4px -4px 12px rgba(140,120,240,0.18)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      keyframes: {
        blob: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(40px, -60px) scale(1.1)" },
          "66%": { transform: "translate(-30px, 30px) scale(0.92)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(142,124,248,0.45)" },
          "50%": { boxShadow: "0 0 0 14px rgba(142,124,248,0)" },
        },
      },
      animation: {
        "blob-1": "blob 18s ease-in-out infinite",
        "blob-2": "blob 22s ease-in-out -7s infinite",
        "blob-3": "blob 26s ease-in-out -14s infinite",
        "fade-in-up": "fade-in-up 0.6s ease-out both",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
      },
    },
  },
} satisfies Partial<Config>;

export default preset;
