import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: "./postcss.config.js",
  },
  server: {
    // Para dev server
    host: true,
    port: 1235,
  },
  preview: {
    // Para preview server (production build)
    host: true,
    port: 1235,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    // Copiar archivos de configuración del servidor
    copyPublicDir: true,
  },
})
