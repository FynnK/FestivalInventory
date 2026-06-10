import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Festival Inventory Management',
        short_name: 'FestivalInv',
        description: 'Manage inventory for festival events.',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/favicon.ico',
            sizes: 'multiple',
            type: 'image/x-icon',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: process.env.GITHUB_ACTIONS ? '/FestivalInventory/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
