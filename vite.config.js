import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo-clinica.png'],
      manifest: {
        name: 'ClinicOS',
        short_name: 'ClinicOS',
        description: 'Sistema de Gestão para Clínicas de Estética',
        theme_color: '#1D1D1D',
        background_color: '#C6D1C0',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/logo-clinica.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo-clinica.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/logo-clinica.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5000000 // Aumentar limite para imagens grandes
      }
    })
  ],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
