import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "green-deep": "#0F3D2E",
        "green-mid": "#1D5C41",
        "green-soft": "#2E7350",
        "green-pale": "#E7EFE9",
        sand: "#F6F1E7",
        "sand-deep": "#EDE3CE",
        ink: "#16241C",
        "ink-soft": "#3C4A41",
        granite: "#8C8577",
        "granite-light": "#C9C2B4",
        gold: "#E3A857",
        "gold-deep": "#C4863A",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-work-sans)", "sans-serif"],
        script: ["var(--font-yesteryear)", "cursive"],
      },
      borderRadius: {
        boulder1: "62% 38% 55% 45% / 45% 55% 45% 55%",
        boulder2: "40% 60% 45% 55% / 55% 40% 60% 45%",
        boulder3: "55% 45% 62% 38% / 38% 55% 45% 62%",
      },
      boxShadow: {
        soft: "0 20px 45px -20px rgba(15,61,46,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
