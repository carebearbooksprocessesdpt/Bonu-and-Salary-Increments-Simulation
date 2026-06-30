import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        cream: "#f7f2e8",
        ink: "#172421",
        "dark-teal": "#0b4a45",
        teal: "#16736b",
        "teal-soft": "#d9efeb",
        sage: "#8aa891",
        "sage-soft": "#edf4ef",
        line: "#d9e4dc"
      },
      boxShadow: {
        soft: "0 16px 40px rgba(17, 46, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
