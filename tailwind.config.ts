import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        cream: "#f6f7f4",
        ink: "#1c2420",
        "dark-teal": "#0e3d3a",
        teal: "#0a2d2a",
        "teal-soft": "#e8f0ee",
        sage: "#d2e0dd",
        "sage-soft": "#f8faf7",
        line: "#e2e6dc",
        "line-strong": "#cfd6c8",
        accent: "#c8893d",
        "accent-soft": "#f3e5d4",
        danger: "#8a3d35",
        "danger-soft": "#f4ddd9",
        success: "#244c3a",
        "success-soft": "#dcecdf",
        warn: "#7a4b11",
        "warn-soft": "#f3e5d4",
        info: "#2c5d7a",
        "info-soft": "#d8e7ee"
      },
      boxShadow: {
        soft: "0 16px 40px rgba(17, 46, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
