import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // SNMC's own palette — navy pulled directly from the emblem
      // (public/snmc-emblem.png) rather than guessed, so it matches the
      // real logo. This replaces a leftover Sibert Residence (guest
      // house) color set that never had any of these tokens defined,
      // which is why council-*/status-* classes across the site were
      // silently rendering with no color at all (browser defaults —
      // including the flat default blue on radio/checkbox inputs via
      // the accent-council-navy utility).
      colors: {
        council: {
          navy: "#081E7B",
          navyDeep: "#05134F",
          header: "#081E7B",
          cyan: "#2AA7D6",
          cyanLight: "#BFE6F5",
          cream: "#F5F3EC",
          ink: "#16213A",
        },
        status: {
          active: "#1E8E5A",
          pending: "#C48A1E",
          closed: "#C0392B",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-work-sans)", "sans-serif"],
        script: ["var(--font-yesteryear)", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
