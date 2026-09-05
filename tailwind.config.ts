import type { Config } from "tailwindcss";

// Palette updated to match the actual SNMC logo's blue (sampled directly
// from the emblem — a rich royal blue, ~#14186B) rather than the
// near-black navy used previously. council.navy is a slightly lighter
// tint for panels/buttons that need to read as "blue" at smaller sizes;
// council.navyDeep is closer to the logo's own color, used for the
// sidebar and header gradient so the brand identity is immediately
// recognizable there.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        council: {
          navy: "#1B2074",
          navyDeep: "#14186B",
          cyan: "#17AEE0",
          cyanLight: "#5CC8ED",
          cream: "#FFFFFF",
          ink: "#1A1D22",
        },
        status: {
          active: "#1E7D4F",
          pending: "#B8860B",
          closed: "#8A2C2C",
        },
      },
      fontFamily: {
        display: ["'Baloo 2'", "Georgia", "serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
      },
      backgroundImage: {
        "council-header": "linear-gradient(180deg, #14186B 0%, #1B2074 60%, rgba(27,32,116,0) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
