import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/moneybpt/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'sample-export.tsv'],
      manifest: {
        name: 'MoneyBPT — Учёт расходов',
        short_name: 'MoneyBPT',
        description: 'Личный учёт расходов. Данные только на устройстве.',
        theme_color: '#2d6a4f',
        background_color: '#f7faf8',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'ru',
        start_url: '/moneybpt/',
        scope: '/moneybpt/',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,tsv,woff2}'],
        navigateFallback: '/moneybpt/index.html',
      },
    }),
  ],
})
