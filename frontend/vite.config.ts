import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Separa las librerías grandes y estables en sus propios chunks para
        // que el navegador las cachee independientemente del código propio
        // (que cambia con cada deploy) — sin esto, todo node_modules termina
        // en un solo chunk de ~620KB que se re-descarga entero en cada
        // release aunque solo haya cambiado una línea de la app.
        manualChunks(id) {
          if (!id.includes("node_modules")) return
          if (id.includes("chart.js") || id.includes("react-chartjs-2")) return "vendor-charts"
          if (id.includes("@supabase")) return "vendor-supabase"
          if (id.includes("react-bootstrap") || id.includes("/bootstrap/")) return "vendor-ui"
          if (id.includes("lodash")) return "vendor-lodash"
          if (id.includes("@iconify")) return "vendor-icons"
          if (id.includes("react-dom") || id.includes("/react/") || id.includes("react-router")) return "vendor-react"
          return "vendor"
        },
      },
    },
  },
})
