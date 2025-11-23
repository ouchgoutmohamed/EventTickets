import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  // 1. On enlève 'tailwindcss()' d'ici car Vite le gère via postcss.config.js
  plugins: [react()],
  css: {
    postcss: './postcss.config.js', // optionnel si tu as postcss.config.js
  },
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})