import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // ── Certifive public design system ──────────────────────────
        pub: {
          primary:      "hsl(142 69% 36%)",
          "primary-dark": "hsl(142 69% 31%)",
          "primary-soft": "hsl(142 60% 97%)",
          ink:          "#0f1f2e",
          muted:        "#5e6772",
          border:       "#e4e6ea",
          "border-soft":"#eef0f3",
          bg:           "#fafbfc",
        },
        // Energy rating chips
        er: {
          a: "#0a8a3f", b: "#4cae3a", c: "#9fd13a",
          d: "#f5d800", e: "#f5a623", f: "#ef6c2a", g: "#e23b2e",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      keyframes: {
        // Public flow animations
        "rv": {
          from: { transform: "translateY(14px)" },
          to:   { transform: "none" },
        },
        "pop": {
          "0%":   { transform: "scale(.6)", opacity: "0" },
          "70%":  { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)",  opacity: "1" },
        },
        "draw": {
          to: { "stroke-dashoffset": "0" },
        },
        "ring-pulse": {
          "0%,100%": { transform: "scale(1)",   opacity: "1" },
          "50%":     { transform: "scale(1.25)", opacity: "0" },
        },
        "shake": {
          "0%,100%": { transform: "translateX(0)" },
          "20%":     { transform: "translateX(-6px)" },
          "40%":     { transform: "translateX(6px)" },
          "60%":     { transform: "translateX(-4px)" },
          "80%":     { transform: "translateX(4px)" },
        },
        "ping-dot": {
          "75%,100%": { transform: "scale(2)", opacity: "0" },
        },
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "reveal":     "rv .6s cubic-bezier(.16,1,.3,1) both",
        "pop":        "pop .4s cubic-bezier(.16,1,.3,1) both",
        "draw":       "draw .5s ease forwards",
        "ring-pulse": "ring-pulse 1.4s ease-in-out infinite",
        "shake":      "shake .5s ease both",
        "ping-dot":   "ping-dot 1.2s cubic-bezier(0,0,.2,1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
