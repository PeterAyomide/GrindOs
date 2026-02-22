import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // JetBrains Mono loaded via Google Fonts in layout.tsx
        mono: ["'JetBrains Mono'", "Courier New", "monospace"],
      },
      colors: {
        terminal: {
          black: "#000000",
          white: "#FFFFFF",
          red: "#FF0000",
          // Dimmed variants for inactive states
          dimWhite: "#888888",
          dimRed: "#660000",
        },
      },
      keyframes: {
        // Subtle CRT scanline flicker
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.97" },
        },
        // Red failure pulse
        failurePulse: {
          "0%, 100%": { backgroundColor: "#FF0000" },
          "50%": { backgroundColor: "#CC0000" },
        },
      },
      animation: {
        flicker: "flicker 3s ease-in-out infinite",
        failurePulse: "failurePulse 0.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
