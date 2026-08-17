import type { Config } from "tailwindcss";

// Palette matches the live SNMC website (snmc website hero/nav): dark
// navy-to-black gradient header, cyan accent for links/active states/
// buttons, white body background, near-black navy for headings. Updated
// from the earlier gold-accent palette (which was drawn from the logo
// alone) to match the site's actual established brand once we had a
// reference to match against.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        council: {
          navy: "#0B1F3A",
          navyDeep: "#060D1A",
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
        "council-header": "linear-gradient(180deg, #060D1A 0%, #0B1F3A 60%, rgba(11,31,58,0) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
