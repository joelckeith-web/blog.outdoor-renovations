import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#2D5016",
          "dark-secondary": "#1a3a0a",
          accent: "#4A7C28",
          "accent-hover": "#3d6620",
          "accent-light": "rgba(74, 124, 40, 0.08)",
          text: "#333333",
          "text-secondary": "#555555",
          white: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          '"Noto Sans"',
          "sans-serif",
        ],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "#333333",
            a: {
              color: "#4A7C28",
              "&:hover": {
                color: "#3d6620",
              },
            },
            h1: {
              color: "#2D5016",
            },
            h2: {
              color: "#2D5016",
            },
            h3: {
              color: "#1a3a0a",
            },
            strong: {
              color: "#1a3a0a",
            },
            blockquote: {
              borderLeftColor: "#4A7C28",
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
