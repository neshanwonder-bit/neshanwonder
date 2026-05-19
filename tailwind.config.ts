import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      colors: {
        ink: "#1a1a1a",
        cream: "#f7f3ec",
        accent: "#c8553d",
      },
    },
  },
  plugins: [],
};

export default config;
