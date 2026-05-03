import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        destructive: "hsl(var(--destructive))",
        mysteria: "#1b1938",
        lavender: "#cbb7fb",
        charcoal: "#292827",
        "warm-cream": "#e9e5dd",
        parchment: "#dcd7d3",
        amethyst: "#714cb6",
      },
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "8px",
        md: "8px",
        lg: "16px",
        xl: "16px",
        "2xl": "16px",
      },
      boxShadow: {
        soft: "0 18px 70px rgba(27, 25, 56, 0.10)",
        tight: "0 8px 28px rgba(27, 25, 56, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
