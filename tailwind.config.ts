import type { Config } from "tailwindcss";

// Palette pulled from the SNMC logo (navy lamp, gold flame) rather than a
// generic template palette — see brand notes in README.md.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        council: {
          navy: "#1B3A5C",
          navyDeep: "#122744",
          gold: "#C9922B",
          goldLight: "#E4B563",
          cream: "#F7F5F0",
          ink: "#1A1D22",
        },
        status: {
          active: "#1E7D4F",
          pending: "#B8860B",
          closed: "#8A2C2C",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "Georgia", "serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
