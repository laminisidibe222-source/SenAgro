/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Light theme: warm paper page, white cards, ink text.
        page: "#FAF8F2",
        card: "#FFFFFF",
        card2: "#F4F1E8",
        sand: "#EAE4D6",
        ink: "#1B1813",
        "ink-soft": "#6B6353",
        // Gold stays the brand fill; `accent` is the readable version on white.
        gold: { 300: "#FFE08A", 400: "#F5C544", 500: "#E5A834" },
        accent: "#7A5A08",
        leaf: "#2F7D46",
        // Legacy names kept as aliases so nothing renders unstyled.
        charcoal: "#FAF8F2",
        panel: "#FFFFFF",
        panel2: "#F4F1E8",
        olive: "#EAE4D6",
        cream: "#1B1813",
        mute: "#6B6353",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "Inter", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      keyframes: {
        "float-slow": { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-14px)" } },
        "pulse-soft": { "0%,100%": { opacity: "0.55" }, "50%": { opacity: "1" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        "leaf-sway": { "0%,100%": { transform: "rotate(-2deg)" }, "50%": { transform: "rotate(2deg)" } },
      },
      animation: {
        "float-slow": "float-slow 6s ease-in-out infinite",
        "pulse-soft": "pulse-soft 3.4s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
        "leaf-sway": "leaf-sway 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
