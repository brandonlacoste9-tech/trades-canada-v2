import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Amber-Glassmorphism Design System
        amber: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        // Luxury Imperial Theme
        imperial: {
          black: "#0a0806",
          leather: "#2a1b12",
          suede: "#3d2b1f",
          gold: "#c5a059",
          "gold-bright": "#e5c07b",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "amber-glow": "radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.15) 0%, transparent 70%)",
        "amber-glow-sm": "radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 50%)",
        "grid-pattern": "linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)",
        "hero-gradient": "linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(15,10,5,0.98) 50%, rgba(0,0,0,0.95) 100%)",
        "leather-texture": "url('/textures/leather-dark.png')", // We'll add a CSS fallback for this
        "suede-texture": "linear-gradient(145deg, #2a1b12 0%, #3d2b1f 100%)",
        "gold-shimmer": "linear-gradient(90deg, transparent, rgba(197,160,89,0.2), transparent)",
      },
      backgroundSize: {
        "grid": "60px 60px",
      },
      boxShadow: {
        "amber": "0 0 30px rgba(245,158,11,0.15), 0 0 60px rgba(245,158,11,0.05)",
        "amber-sm": "0 0 15px rgba(245,158,11,0.1)",
        "amber-lg": "0 0 60px rgba(245,158,11,0.2), 0 0 120px rgba(245,158,11,0.08)",
        "glass": "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        "glass-lg": "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
      },
      animation: {
        "pulse-amber": "pulse-amber 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "ticker": "ticker 30s linear infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        "pulse-amber": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(245,158,11,0.1)" },
          "50%": { boxShadow: "0 0 40px rgba(245,158,11,0.25)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "ticker": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
