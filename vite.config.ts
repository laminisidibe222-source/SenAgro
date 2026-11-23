import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: {
    // `npm run dev:api` serves the Vercel handlers on 8788.
    proxy: { "/api": { target: "http://localhost:8788", changeOrigin: true } },
  },
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          vendor: ["react", "react-dom", "react-router-dom"],
          motion: ["gsap", "lenis"],
        },
      },
    },
  },
});
