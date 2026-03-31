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
          dark: "#2D4A3E",
          "dark-secondary": "#1B3128",
          accent: "#2D4A3E",
          "accent-hover": "#1B3128",
          "accent-light": "#6B8F7B",
          text: "#1A1A1A",
          "text-secondary": "#6B7280",
          white: "#FFFFFF",
          cream: "#F0EBE3",
          light: "#F7F5F0",
        },
      },
      fontFamily: {
        heading: [
          '"Playfair Display"',
          "Georgia",
          '"Times New Roman"',
          "serif",
        ],
        body: [
          "Poppins",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        sans: [
          "Poppins",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "#1A1A1A",
            fontFamily: "Poppins, sans-serif",
            a: {
              color: "#2D4A3E",
              "&:hover": {
                color: "#1B3128",
              },
            },
            h1: {
              color: "#1B3128",
              fontFamily: '"Playfair Display", serif',
            },
            h2: {
              color: "#2D4A3E",
              fontFamily: "Poppins, sans-serif",
            },
            h3: {
              color: "#1B3128",
              fontFamily: "Poppins, sans-serif",
            },
            strong: {
              color: "#1B3128",
            },
            blockquote: {
              borderLeftColor: "#2D4A3E",
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
