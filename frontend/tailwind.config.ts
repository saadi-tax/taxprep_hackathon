import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1B4B66",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#F4B63D",
        },
      },
    },
  },
  plugins: [],
};

export default config;

