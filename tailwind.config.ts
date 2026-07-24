import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        mist: "#f5f7fb",
        line: "rgba(17, 24, 39, 0.08)"
      },
      borderRadius: {
        apple: "28px"
      },
      boxShadow: {
        apple: "0 24px 80px rgba(17, 24, 39, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
