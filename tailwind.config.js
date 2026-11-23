/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: "#14120E",
        panel: "#1C1A15",
        panel2: "#23211A",
        olive: "#2A2E21",
        gold: { 300: "#FFE08A", 400: "#F5C544", 500: "#E5A834" },
        leaf: "#7BE08B",
        cream: "#F5F0E6",
        mute: "#A49B85",
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
