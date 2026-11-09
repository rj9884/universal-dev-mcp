/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#150f23",
        "ink-deep": "#1f1633",
        "surface-canvas-dark": "#1f1633",
        "surface-night": "#150f23",
        "accent-lime": "#c2ef4e",
        "accent-pink": "#fa7faa",
        "accent-violet": "#6a5fc1",
        "accent-violet-deep": "#422082",
        "accent-violet-mid": "#79628c",
        "hairline-violet": "#362d59",
        "hairline-cool": "#cfcfdb",
        "hairline-cloud": "#e5e7eb",
        "on-dark-muted": "#bdb8c0",
        "on-dark-faint": "#3f3849",
      },
      fontFamily: {
        sans: ["Rubik", "-apple-system", "system-ui", "sans-serif"],
        mono: ["Monaco", "Menlo", "Ubuntu Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 12px 2px rgba(194, 239, 78, 0.15)",
        halo: "0 0 8px 6px #150f23",
      },
    },
  },
  plugins: [],
};
