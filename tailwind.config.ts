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
        // Brand
        primary: {
          DEFAULT: "#1E40AF",
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E3A8A",
          900: "#1E40AF",
        },
        accent: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
          dark: "#D97706",
          50: "#FFFBEB",
        },
        // Surface
        surface: "#FFFFFF",
        canvas: "#F0EFEA",
        // Sidebar
        sidebar: {
          DEFAULT: "#111827",
          hover: "#1F2937",
          active: "#374151",
          border: "#1F2937",
          text: "#9CA3AF",
          heading: "#6B7280",
        },
        // Status
        status: {
          approved: "#16A34A",
          "approved-bg": "#F0FDF4",
          pending: "#D97706",
          "pending-bg": "#FFFBEB",
          rejected: "#DC2626",
          "rejected-bg": "#FEF2F2",
          draft: "#374151",
          "draft-bg": "#F9FAFB",
          submitted: "#2563EB",
          "submitted-bg": "#EFF6FF",
          verified: "#0891B2",
          "verified-bg": "#ECFEFF",
          paid: "#7C3AED",
          "paid-bg": "#F5F3FF",
          locked: "#1F2937",
          "locked-bg": "#111827",
          active: "#16A34A",
          "active-bg": "#F0FDF4",
          critical: "#DC2626",
          "critical-bg": "#FEF2F2",
          "low-stock": "#D97706",
          "low-stock-bg": "#FFFBEB",
        },
      },
      fontFamily: {
        sans: ["var(--font-roboto)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-roboto-mono)", "JetBrains Mono", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "card-md": "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        modal: "0 20px 60px -12px rgb(0 0 0 / 0.25)",
        toast: "0 8px 24px -4px rgb(0 0 0 / 0.3)",
      },
      borderRadius: {
        badge: "4px",
      },
      animation: {
        "fade-in": "fadeIn 0.15s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
        "slide-in-right": "slideInRight 0.25s ease-out",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
